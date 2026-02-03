/**
 * useTimerHistory - Timer history management hook
 *
 * Provides timer history tracking with:
 * - localStorage persistence
 * - FIFO queue behavior (max 5 entries)
 * - Duplicate prevention (moves existing entry to front)
 * - Automatic data validation
 *
 * History is persisted to localStorage so users can quickly restart
 * recently used timers without manual input.
 *
 * @example
 * const { history, addToHistory } = useTimerHistory();
 *
 * // Add a timer to history
 * addToHistory(300); // 5 minutes
 *
 * // Render history items
 * history.map((entry) => (
 *   <button onClick={() => startTimer(entry.duration)}>
 *     {formatDuration(entry.duration)}
 *   </button>
 * ));
 */

import { useState, useEffect, useCallback } from 'react';
import type { TimerHistoryEntry } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/** LocalStorage key for persisted timer history */
const HISTORY_STORAGE_KEY = 'sha_timer_history';

/** Maximum number of history entries to keep */
const MAX_HISTORY_ENTRIES = 5;

// =============================================================================
// Types
// =============================================================================

/**
 * Return type of the useTimerHistory hook
 */
export interface UseTimerHistoryResult {
  /** Array of timer history entries, most recent first */
  history: TimerHistoryEntry[];

  /**
   * Add a timer duration to history
   * - Moves existing entry to front if duration already exists
   * - Removes oldest entry if limit exceeded (FIFO)
   * - Automatically persists to localStorage
   *
   * @param durationSeconds - Duration in seconds to add
   */
  addToHistory: (durationSeconds: number) => void;

  /**
   * Clear all history entries
   * Removes all items from history and clears localStorage
   */
  clearHistory: () => void;
}

// =============================================================================
// Storage Helpers
// =============================================================================

/**
 * Load persisted timer history from localStorage
 */
function loadTimerHistory(): TimerHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);

    // Validate the stored data structure
    if (!Array.isArray(history)) {
      return [];
    }

    // Validate each entry has required fields
    const validHistory = history.filter(
      (entry): entry is TimerHistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.duration === 'number' &&
        typeof entry.addedAt === 'string' &&
        entry.duration > 0
    );

    return validHistory;
  } catch {
    // Invalid JSON or other parsing error - return empty array
    return [];
  }
}

/**
 * Save timer history to localStorage
 */
function saveTimerHistory(history: TimerHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage might be full or unavailable - fail silently
  }
}

/**
 * Clear persisted timer history
 */
function clearTimerHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing timer history with localStorage persistence
 *
 * @returns Timer history state and methods
 */
export function useTimerHistory(): UseTimerHistoryResult {
  // Initialize state from localStorage
  const [history, setHistory] = useState<TimerHistoryEntry[]>(() =>
    loadTimerHistory()
  );

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    saveTimerHistory(history);
  }, [history]);

  /**
   * Add a duration to history
   * - Removes duplicate if exists
   * - Adds new entry at the front
   * - Enforces max entries limit (FIFO)
   */
  const addToHistory = useCallback((durationSeconds: number) => {
    // Validate input
    if (
      typeof durationSeconds !== 'number' ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0
    ) {
      return;
    }

    setHistory((prevHistory) => {
      // Remove existing entry with same duration (to prevent duplicates)
      const filteredHistory = prevHistory.filter(
        (entry) => entry.duration !== durationSeconds
      );

      // Create new entry
      const newEntry: TimerHistoryEntry = {
        duration: durationSeconds,
        addedAt: new Date().toISOString(),
      };

      // Add to front and limit to MAX_HISTORY_ENTRIES (FIFO)
      const updatedHistory = [newEntry, ...filteredHistory].slice(
        0,
        MAX_HISTORY_ENTRIES
      );

      return updatedHistory;
    });
  }, []);

  /**
   * Clear all history entries
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    clearTimerHistory();
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
