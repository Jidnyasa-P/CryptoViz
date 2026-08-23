'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CipherResult } from '@/lib/cipher/types'
import type { WorkerRequest, WorkerResponse } from '@/types/worker'
import type { WorkerPriority } from '@/lib/workers/pool'
import { CipherError } from '@/lib/utils/errors'

const MAX_CACHE_SIZE = 200
const WORKER_TIMEOUT_MS = 10000
const resultCache = new Map<string, CipherResult>()

export interface CipherWorkerProgress {
  percent: number
  currentMilestone: string
  jobId: string
}

export interface RunCipherOptions {
  signal?: AbortSignal
  bypassCache?: boolean
  priority?: WorkerPriority
  onProgress?: (percent: number, message: string) => void
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  const record = obj as Record<string, unknown>
  return Object.fromEntries(Object.keys(record).sort().map(k => [k, sortObjectKeys(record[k])]))
}

function getCacheKey(
  action: 'encrypt' | 'decrypt',
  cipherId: string,
  input: string,
  key: string,
  options?: RunCipherOptions,
) {
  const { signal: _, bypassCache: __, onProgress: ___, priority: ____, ...cacheableOptions } = options || {}
  return JSON.stringify({ action, cipherId, input, key, options: sortObjectKeys(cacheableOptions) })
}

function cacheResult(key: string, result: CipherResult) {
  if (resultCache.has(key)) resultCache.delete(key)
  else if (resultCache.size >= MAX_CACHE_SIZE) {
    const oldest = resultCache.keys().next().value
    if (oldest !== undefined) resultCache.delete(oldest)
  }
  resultCache.set(key, result)
}

export function clearCipherWorkerCache() {
  resultCache.clear()
}

function decodeWorkerMessage(data: unknown): WorkerResponse | { type: 'PROGRESS'; jobId: string; percent: number; currentMilestone: string } {
  if (data instanceof Uint8Array) {
    return JSON.parse(new TextDecoder().decode(data)) as WorkerResponse | { type: 'PROGRESS'; jobId: string; percent: number; currentMilestone: string }
  }
  return data as WorkerResponse | { type: 'PROGRESS'; jobId: string; percent: number; currentMilestone: string }
}

export function useCipherWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<CipherWorkerProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fatalError, setFatalError] = useState<Error | null>(null)
  const activeRequestsRef = useRef(new Map<string, {
    resolve: (value: CipherResult) => void
    reject: (reason: unknown) => void
    signal?: AbortSignal
    onAbort?: () => void
    timeoutId: ReturnType<typeof setTimeout>
    cacheKey: string | null
    onProgress?: (percent: number, message: string) => void
  }>())

  const terminateWorkerAndRejectAll = useCallback((reason: Error) => {
    workerRef.current?.terminate()
    workerRef.current = null
    for (const req of activeRequestsRef.current.values()) {
      clearTimeout(req.timeoutId)
      if (req.signal && req.onAbort) req.signal.removeEventListener('abort', req.onAbort)
      req.reject(reason)
    }
    activeRequestsRef.current.clear()
    setLoading(false)
    setProgress(null)
  }, [])

  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null
    const worker = new Worker(new URL('../lib/workers/cipher-transfer.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<unknown>) => {
      let data: ReturnType<typeof decodeWorkerMessage>
      try {
        data = decodeWorkerMessage(event.data)
      } catch {
        const malformed = new Error('Invalid response from cipher worker.')
        setError(malformed.message)
        terminateWorkerAndRejectAll(malformed)
        return
      }

      if (data.type === 'PROGRESS') {
        const p = {
          percent: Math.max(0, Math.min(100, Number(data.percent))),
          currentMilestone: String(data.currentMilestone ?? ''),
          jobId: String(data.jobId ?? ''),
        }
        setProgress(p)
        activeRequestsRef.current.get(p.jobId)?.onProgress?.(p.percent, p.currentMilestone)
        return
      }

      const request = activeRequestsRef.current.get(data.requestId)
      if (!request) return
      clearTimeout(request.timeoutId)
      if (request.signal && request.onAbort) request.signal.removeEventListener('abort', request.onAbort)

      if (data.success && data.payload?.result) {
        const result: CipherResult = {
          ...data.payload.result,
          durationMs: data.timings?.durationMs ?? data.payload.result.durationMs ?? 0,
        }
        if (request.cacheKey) cacheResult(request.cacheKey, result)
        request.resolve(result)
      } else {
        const message = data.payload?.error ?? 'Operation failed in worker'
        setError(message)
        request.reject(data.payload?.errorCode ? new CipherError(data.payload.errorCode, message) : new Error(message))
      }

      activeRequestsRef.current.delete(data.requestId)
      if (activeRequestsRef.current.size === 0) {
        setLoading(false)
        setProgress(null)
      }
    }
    worker.onerror = event => {
      const workerError = new Error(event.message || 'Web Worker initialization or runtime error.')
      setError(workerError.message)
      setFatalError(workerError)
      terminateWorkerAndRejectAll(workerError)
    }
    return worker
  }, [terminateWorkerAndRejectAll])

  useEffect(() => {
    workerRef.current = createWorker()
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [createWorker])

  const runCipher = useCallback((
    action: 'encrypt' | 'decrypt',
    cipherId: string,
    input: string,
    key: string,
    options?: RunCipherOptions,
  ): Promise<CipherResult> => {
    const cacheKey = getCacheKey(action, cipherId, input, key, options)
    if (!options?.bypassCache && resultCache.has(cacheKey)) return Promise.resolve(resultCache.get(cacheKey)!)

    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = createWorker()
        if (!workerRef.current) {
          reject(new Error('Web Worker is not available on SSR.'))
          return
        }
      }

      const id = crypto.randomUUID()
      const signal = options?.signal
      if (signal?.aborted) {
        reject(new DOMException('The user aborted the request.', 'AbortError'))
        return
      }

      const timeoutId = setTimeout(() => {
        const timeout = new CipherError('WORKER_TIMEOUT', `Cipher operation timed out after ${WORKER_TIMEOUT_MS}ms`)
        setError(timeout.message)
        terminateWorkerAndRejectAll(timeout)
      }, WORKER_TIMEOUT_MS)

      const onAbort = () => {
        clearTimeout(timeoutId)
        workerRef.current?.postMessage({ type: 'CANCEL', requestId: id, jobId: id })
        activeRequestsRef.current.delete(id)
        if (activeRequestsRef.current.size === 0) {
          setLoading(false)
          setProgress(null)
        }
        reject(new DOMException('The user aborted the request.', 'AbortError'))
      }

      if (signal) signal.addEventListener('abort', onAbort, { once: true })
      activeRequestsRef.current.set(id, {
        resolve, reject, signal, onAbort, timeoutId, cacheKey, onProgress: options?.onProgress,
      })
      setLoading(true)
      setError(null)
      setProgress({ percent: 0, currentMilestone: 'Queued', jobId: id })

      const { signal: _sig, priority: _priority, onProgress: _progress, bypassCache: _bypass, ...forwardOptions } = options || {}
      const requestMessage: WorkerRequest = {
        type: 'EXECUTE',
        requestId: id,
        jobId: id,
        priority: options?.priority ?? 'NORMAL',
        payload: { type: action, cipherId, input, key, options: forwardOptions },
      }

      try {
        const payloadBuffer = new TextEncoder().encode(JSON.stringify(requestMessage))
        workerRef.current.postMessage(payloadBuffer, [payloadBuffer.buffer])
      } catch (err) {
        clearTimeout(timeoutId)
        activeRequestsRef.current.delete(id)
        if (signal) signal.removeEventListener('abort', onAbort)
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }, [createWorker, terminateWorkerAndRejectAll])

  if (fatalError) throw fatalError
  return { runCipher, loading, error, progress }
}
