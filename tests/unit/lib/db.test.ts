import {
  getTotalRequestCount,
  getAverageLlmResponseTime,
  getBlockedAndSuspiciousRequestCounts,
  getEventsPerMinute,
  getEventCountsByLevel,
  getAlertsOverTime,
} from '@/lib/db'
import betterSqlite3 from 'better-sqlite3'

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  const mockGet = jest.fn()
  const mockAll = jest.fn()
  const mockPrepare = jest.fn(() => ({
    get: mockGet,
    all: mockAll,
  }))

  return jest.fn(() => ({
    prepare: mockPrepare,
    close: jest.fn(),
  }))
})

describe('Database Utilities', () => {
  let mockDb
  let mockGet
  let mockAll

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb = betterSqlite3()
    mockGet = mockDb.prepare().get
    mockAll = mockDb.prepare().all
  })

  describe('getTotalRequestCount', () => {
    it('returns the total request count', async () => {
      mockGet.mockReturnValue({ count: 100 })
      const result = await getTotalRequestCount()
      expect(result).toBe(100)
    })

    it('returns 0 when there is an error', async () => {
      mockGet.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getTotalRequestCount()
      expect(result).toBe(0)
    })
  })

  describe('getAverageLlmResponseTime', () => {
    it('returns the rounded average response time', async () => {
      mockGet.mockReturnValue({ avg: 123.456 })
      const result = await getAverageLlmResponseTime()
      expect(result).toBe(123)
    })

    it('returns 0 when there is an error', async () => {
      mockGet.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getAverageLlmResponseTime()
      expect(result).toBe(0)
    })
  })

  describe('getBlockedAndSuspiciousRequestCounts', () => {
    it('returns the security counts', async () => {
      mockGet.mockReturnValue({ blocked: 5, suspicious: 10 })
      const result = await getBlockedAndSuspiciousRequestCounts()
      expect(result).toEqual({ blocked: 5, suspicious: 10 })
    })

    it('returns zeros when there is an error', async () => {
      mockGet.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getBlockedAndSuspiciousRequestCounts()
      expect(result).toEqual({ blocked: 0, suspicious: 0 })
    })
  })

  describe('getEventsPerMinute', () => {
    it('returns the events per minute', async () => {
      const mockEvents = [
        { minute: '12:00', count: 5 },
        { minute: '12:01', count: 8 },
      ]
      mockAll.mockReturnValue(mockEvents)
      const result = await getEventsPerMinute()
      expect(result).toEqual(mockEvents)
    })

    it('returns empty array when there is an error', async () => {
      mockAll.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getEventsPerMinute()
      expect(result).toEqual([])
    })
  })

  describe('getEventCountsByLevel', () => {
    it('returns the event counts by level', async () => {
      const mockCounts = [
        { level: 'info', count: 50 },
        { level: 'warning', count: 10 },
        { level: 'error', count: 5 },
      ]
      mockAll.mockReturnValue(mockCounts)
      const result = await getEventCountsByLevel()
      expect(result).toEqual(mockCounts)
    })

    it('returns empty array when there is an error', async () => {
      mockAll.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getEventCountsByLevel()
      expect(result).toEqual([])
    })
  })

  describe('getAlertsOverTime', () => {
    it('returns the alerts over time', async () => {
      const mockAlerts = [
        { date: '2024-03-12', count: 5 },
        { date: '2024-03-11', count: 3 },
      ]
      mockAll.mockReturnValue(mockAlerts)
      const result = await getAlertsOverTime()
      expect(result).toEqual(mockAlerts)
    })

    it('returns empty array when there is an error', async () => {
      mockAll.mockImplementation(() => {
        throw new Error('Database error')
      })
      const result = await getAlertsOverTime()
      expect(result).toEqual([])
    })
  })
})
