import { describe, expect, it } from 'vitest'
import {
  filterConversionHistory,
  formatConversionHistoryRecord,
  normalizeConversionHistory,
  serializeConversionHistoryToCsv,
  serializeConversionHistoryToJson,
  type ConversionHistoryEntry,
} from '../../lib/utils/conversionHistory'

const history: ConversionHistoryEntry[] = [
  {
    id: '1',
    cipherId: 'caesar',
    input: 'HELLO',
    key: '3',
    action: 'encrypt',
    output: 'KHOOR',
    timestamp: '7/14/2026, 5:00:00 PM',
  },
  {
    id: '2',
    cipherId: 'caesar',
    input: 'KHOOR',
    key: '3',
    action: 'decrypt',
    output: 'HELLO',
    timestamp: '7/14/2026, 5:02:00 PM',
  },
]

describe('conversion history utilities', () => {
  it('normalizes valid entries and removes malformed or duplicate data', () => {
    expect(
      normalizeConversionHistory(
        [history[0], history[0], { id: 'broken' }, null],
        'caesar',
      ),
    ).toEqual([history[0]])
  })

  it('searches input, output, direction and timestamp', () => {
    expect(filterConversionHistory(history, 'KHOOR')).toHaveLength(2)
    expect(filterConversionHistory(history, 'decrypt')).toEqual([history[1]])
    expect(filterConversionHistory(history, '5:02')).toEqual([history[1]])
    expect(filterConversionHistory(history, 'missing')).toEqual([])
  })

  it('serializes active cipher history to JSON', () => {
    expect(JSON.parse(serializeConversionHistoryToJson(history))).toEqual(history)
  })

  it('serializes CSV with escaped values', () => {
    const csv = serializeConversionHistoryToCsv([
      { ...history[0], input: 'Hello, world' },
    ])
    expect(csv).toContain('"Hello, world"')
    expect(csv.split('\n')[0]).toBe(
      'cipherId,input,key,direction,output,timestamp',
    )
  })

  it('formats a complete clipboard record', () => {
    const record = formatConversionHistoryRecord(history[0])
    expect(record).toContain('Cipher: caesar')
    expect(record).toContain('Direction: encrypt')
    expect(record).toContain('Output: KHOOR')
  })
})
