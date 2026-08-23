/**
 * Transferable response adapter for the cipher worker.
 *
 * Cipher results can contain hundreds of trace steps. Posting the result object
 * directly forces the browser to structured-clone every nested array/string.
 * Encode the message once and transfer its ArrayBuffer instead.
 */

const workerScope = self as unknown as DedicatedWorkerGlobalScope
const nativePostMessage = workerScope.postMessage.bind(workerScope)

workerScope.postMessage = ((message: unknown, transfer?: Transferable[]) => {
  if (message && typeof message === 'object') {
    const encoded = new TextEncoder().encode(JSON.stringify(message))
    nativePostMessage(encoded, [encoded.buffer])
    return
  }

  nativePostMessage(message, transfer ?? [])
}) as typeof workerScope.postMessage

void import('./cipher.worker')
