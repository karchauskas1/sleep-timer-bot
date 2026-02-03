/**
 * Unit tests for useTimerHistory hook
 *
 * Tests cover:
 * - Adding entries to history
 * - FIFO queue behavior (max 5 entries)
 * - Duplicate prevention (moves to front)
 * - localStorage persistence
 * - Data validation
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerHistory } from '../useTimerHistory'
import type { TimerHistoryEntry } from '@/types'

// =============================================================================
// Test Constants
// =============================================================================

const STORAGE_KEY = 'sha_timer_history'

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Clear localStorage before each test
 */
function clearStorage() {
  localStorage.clear()
}

/**
 * Get history from localStorage
 */
function getStoredHistory(): TimerHistoryEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Set history in localStorage
 */
function setStoredHistory(history: TimerHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

// =============================================================================
// Test Suites
// =============================================================================

describe('useTimerHistory', () => {
  beforeEach(() => {
    clearStorage()
  })

  describe('Initial State', () => {
    it('should initialize with empty history when localStorage is empty', () => {
      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toEqual([])
    })

    it('should load existing history from localStorage on mount', () => {
      const existingHistory: TimerHistoryEntry[] = [
        { duration: 300, addedAt: '2024-01-01T00:00:00.000Z' },
        { duration: 600, addedAt: '2024-01-01T00:01:00.000Z' },
      ]
      setStoredHistory(existingHistory)

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toEqual(existingHistory)
    })
  })

  describe('Adding to History', () => {
    it('should add entry to empty history', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].duration).toBe(300)
      expect(result.current.history[0].addedAt).toBeDefined()
    })

    it('should add multiple entries in LIFO order (newest first)', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300) // 5 min
        result.current.addToHistory(600) // 10 min
        result.current.addToHistory(900) // 15 min
      })

      expect(result.current.history).toHaveLength(3)
      expect(result.current.history[0].duration).toBe(900) // Most recent
      expect(result.current.history[1].duration).toBe(600)
      expect(result.current.history[2].duration).toBe(300)
    })

    it('should persist to localStorage after adding entry', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      const stored = getStoredHistory()
      expect(stored).toHaveLength(1)
      expect(stored[0].duration).toBe(300)
    })

    it('should validate duration is a positive number', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(0)
        result.current.addToHistory(-100)
        result.current.addToHistory(NaN)
      })

      expect(result.current.history).toHaveLength(0)
    })

    it('should ignore non-number durations', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        // @ts-expect-error - testing runtime validation
        result.current.addToHistory('300')
        // @ts-expect-error - testing runtime validation
        result.current.addToHistory(null)
        // @ts-expect-error - testing runtime validation
        result.current.addToHistory(undefined)
      })

      expect(result.current.history).toHaveLength(0)
    })
  })

  describe('FIFO Queue Behavior', () => {
    it('should maintain maximum of 5 entries', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300) // 1
        result.current.addToHistory(600) // 2
        result.current.addToHistory(900) // 3
        result.current.addToHistory(1200) // 4
        result.current.addToHistory(1500) // 5
      })

      expect(result.current.history).toHaveLength(5)
    })

    it('should remove oldest entry when 6th entry is added', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300) // 1 - will be removed
        result.current.addToHistory(600) // 2
        result.current.addToHistory(900) // 3
        result.current.addToHistory(1200) // 4
        result.current.addToHistory(1500) // 5
        result.current.addToHistory(1800) // 6 - triggers FIFO
      })

      expect(result.current.history).toHaveLength(5)
      expect(result.current.history[4].duration).toBe(600) // Oldest remaining
      expect(result.current.history[0].duration).toBe(1800) // Newest
      expect(result.current.history.find((e) => e.duration === 300)).toBeUndefined() // First entry removed
    })

    it('should maintain FIFO order when adding multiple entries beyond limit', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        // Add 7 entries
        for (let i = 1; i <= 7; i++) {
          result.current.addToHistory(i * 300)
        }
      })

      expect(result.current.history).toHaveLength(5)
      // Should contain entries 3-7 (newest 5)
      expect(result.current.history[0].duration).toBe(2100) // 7
      expect(result.current.history[1].duration).toBe(1800) // 6
      expect(result.current.history[2].duration).toBe(1500) // 5
      expect(result.current.history[3].duration).toBe(1200) // 4
      expect(result.current.history[4].duration).toBe(900) // 3
    })
  })

  describe('Duplicate Handling', () => {
    it('should move existing entry to front when duplicate duration is added', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300) // 5 min
        result.current.addToHistory(600) // 10 min
        result.current.addToHistory(900) // 15 min
      })

      expect(result.current.history[0].duration).toBe(900)

      act(() => {
        result.current.addToHistory(300) // Add 5 min again
      })

      expect(result.current.history).toHaveLength(3) // Still 3 entries (no duplicate)
      expect(result.current.history[0].duration).toBe(300) // Moved to front
      expect(result.current.history[1].duration).toBe(900)
      expect(result.current.history[2].duration).toBe(600)
    })

    it('should not create duplicate entries in history', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
        result.current.addToHistory(300)
        result.current.addToHistory(300)
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].duration).toBe(300)
    })

    it('should update addedAt timestamp when moving duplicate to front', async () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      const firstTimestamp = result.current.history[0].addedAt

      // Wait a small amount to ensure timestamp is different
      await new Promise((resolve) => setTimeout(resolve, 10))

      act(() => {
        result.current.addToHistory(600)
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      act(() => {
        result.current.addToHistory(300) // Re-add same duration
      })

      expect(result.current.history[0].duration).toBe(300)
      expect(result.current.history[0].addedAt).not.toBe(firstTimestamp)
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should persist history to localStorage', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
        result.current.addToHistory(600)
      })

      const stored = getStoredHistory()
      expect(stored).toHaveLength(2)
      expect(stored[0].duration).toBe(600)
      expect(stored[1].duration).toBe(300)
    })

    it('should load persisted history on initialization', () => {
      // First render - add entries
      const { result: firstResult } = renderHook(() => useTimerHistory())

      act(() => {
        firstResult.current.addToHistory(300)
        firstResult.current.addToHistory(600)
      })

      // Second render - should load from localStorage
      const { result: secondResult } = renderHook(() => useTimerHistory())

      expect(secondResult.current.history).toHaveLength(2)
      expect(secondResult.current.history[0].duration).toBe(600)
      expect(secondResult.current.history[1].duration).toBe(300)
    })
  })

  describe('Data Validation', () => {
    it('should return empty array when localStorage has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{')

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toEqual([])
    })

    it('should return empty array when localStorage has non-array data', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'object' }))

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toEqual([])
    })

    it('should filter out entries with invalid structure', () => {
      const invalidHistory = [
        { duration: 300, addedAt: '2024-01-01T00:00:00.000Z' }, // Valid
        { duration: 'invalid', addedAt: '2024-01-01T00:01:00.000Z' }, // Invalid duration
        { addedAt: '2024-01-01T00:02:00.000Z' }, // Missing duration
        { duration: 600 }, // Missing addedAt
        { duration: 900, addedAt: '2024-01-01T00:03:00.000Z' }, // Valid
        null, // Invalid entry
        'invalid', // Invalid entry
      ]
      setStoredHistory(invalidHistory as TimerHistoryEntry[])

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toHaveLength(2)
      expect(result.current.history[0].duration).toBe(300)
      expect(result.current.history[1].duration).toBe(900)
    })

    it('should filter out entries with zero or negative duration', () => {
      const invalidHistory = [
        { duration: 300, addedAt: '2024-01-01T00:00:00.000Z' }, // Valid
        { duration: 0, addedAt: '2024-01-01T00:01:00.000Z' }, // Invalid
        { duration: -100, addedAt: '2024-01-01T00:02:00.000Z' }, // Invalid
      ]
      setStoredHistory(invalidHistory as TimerHistoryEntry[])

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].duration).toBe(300)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage.getItem errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable')
      })

      const { result } = renderHook(() => useTimerHistory())

      expect(result.current.history).toEqual([])
    })

    it('should handle localStorage.setItem errors gracefully', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('Storage full')
        })

      const { result } = renderHook(() => useTimerHistory())

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.addToHistory(300)
        })
      }).not.toThrow()

      // State should still be updated
      expect(result.current.history).toHaveLength(1)

      setItemSpy.mockRestore()
    })
  })

  describe('clearHistory', () => {
    it('should clear all history entries', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
        result.current.addToHistory(600)
        result.current.addToHistory(900)
      })

      expect(result.current.history).toHaveLength(3)

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.history).toHaveLength(0)
    })

    it('should remove history from localStorage', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

      act(() => {
        result.current.clearHistory()
      })

      // After clearing, localStorage should either be null or contain empty array
      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored === null || stored === '[]').toBe(true)
    })

    it('should handle clearHistory when history is already empty', () => {
      const { result } = renderHook(() => useTimerHistory())

      expect(() => {
        act(() => {
          result.current.clearHistory()
        })
      }).not.toThrow()

      expect(result.current.history).toEqual([])
    })
  })

  describe('ISO 8601 Timestamp Format', () => {
    it('should store addedAt in ISO 8601 format', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      const entry = result.current.history[0]
      expect(entry.addedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('should have valid parseable timestamps', () => {
      const { result } = renderHook(() => useTimerHistory())

      act(() => {
        result.current.addToHistory(300)
      })

      const entry = result.current.history[0]
      const date = new Date(entry.addedAt)
      expect(date.toString()).not.toBe('Invalid Date')
    })
  })
})
