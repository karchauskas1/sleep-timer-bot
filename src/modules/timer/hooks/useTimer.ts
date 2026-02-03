/**
 * useTimer - Timer state management hook
 *
 * Provides a complete timer implementation with:
 * - Start, pause, reset functions
 * - Completion callback support
 * - State persistence to survive module switching
 * - Haptic feedback on completion
 *
 * Timer state is persisted to localStorage so the timer continues
 * running even when switching between modules.
 *
 * @example
 * const timer = useTimer({
 *   onComplete: () => {
 *     // Play sound, show notification
 *   },
 * });
 *
 * // Start a 5-minute timer
 * timer.start(5 * 60);
 *
 * // Pause/resume
 * timer.pause();
 * timer.resume();
 *
 * // Reset timer
 * timer.reset();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHaptic } from '@/shared/hooks/useHaptic';
import type { TimerState } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/** LocalStorage key for persisted timer state */
const TIMER_STORAGE_KEY = 'sha_timer_state';

/** Interval for countdown updates (1 second) */
const TICK_INTERVAL_MS = 1000;

// =============================================================================
// Types
// =============================================================================

/**
 * Options for the useTimer hook
 */
export interface UseTimerOptions {
  /**
   * Callback fired when timer reaches zero
   * Use this to trigger sound, notification, or other completion effects
   */
  onComplete?: () => void;

  /**
   * Callback fired on each tick (every second)
   * Use this for custom UI updates if needed
   */
  onTick?: (remaining: number) => void;
}

/**
 * Return type of the useTimer hook
 */
export interface UseTimerResult {
  /** Remaining time in seconds */
  remaining: number;

  /** Whether the timer is currently running */
  isRunning: boolean;

  /** Original duration in seconds */
  duration: number;

  /**
   * Start the timer with a given duration
   * @param durationSeconds - Duration in seconds
   */
  start: (durationSeconds: number) => void;

  /**
   * Pause the running timer
   */
  pause: () => void;

  /**
   * Resume a paused timer
   */
  resume: () => void;

  /**
   * Toggle between paused and running states
   */
  toggle: () => void;

  /**
   * Reset the timer to idle state
   * Clears the timer completely
   */
  reset: () => void;

  /**
   * Progress as a value from 0 to 1
   * Useful for progress indicators
   */
  progress: number;

  /**
   * Formatted time string (MM:SS)
   */
  formattedTime: string;

  /**
   * Whether the timer is in idle state (not started)
   */
  isIdle: boolean;

  /**
   * Whether the timer is paused
   */
  isPaused: boolean;
}

// =============================================================================
// Storage Helpers
// =============================================================================

/**
 * Load persisted timer state from localStorage
 */
function loadTimerState(): TimerState | null {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!stored) return null;

    const state: TimerState = JSON.parse(stored);

    // Validate the stored state
    if (
      typeof state.remaining !== 'number' ||
      typeof state.isRunning !== 'boolean' ||
      typeof state.duration !== 'number'
    ) {
      return null;
    }

    // If timer was running, calculate elapsed time since last save
    if (state.isRunning && state.startedAt) {
      const startedAt = new Date(state.startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const remaining = Math.max(0, state.remaining - elapsedSeconds);

      // If timer has completed while app was closed
      if (remaining <= 0) {
        return {
          ...state,
          remaining: 0,
          isRunning: false,
          startedAt: undefined,
        };
      }

      return {
        ...state,
        remaining,
        startedAt: new Date().toISOString(), // Update startedAt to now
      };
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Save timer state to localStorage
 */
function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage might be full or unavailable - fail silently
  }
}

/**
 * Clear persisted timer state
 */
function clearTimerState(): void {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format seconds as MM:SS string
 */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing timer state
 *
 * Features:
 * - Automatic persistence across module switches
 * - Background time calculation (timer continues when switching modules)
 * - Haptic feedback on completion
 * - Formatted time output
 * - Progress percentage for UI indicators
 *
 * @param options - Configuration options
 * @returns Timer state and control functions
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerResult {
  const { onComplete, onTick } = options;
  const haptic = useHaptic();

  // Initialize state from localStorage or defaults
  const [state, setState] = useState<TimerState>(() => {
    const stored = loadTimerState();
    if (stored) return stored;

    return {
      remaining: 0,
      isRunning: false,
      duration: 0,
    };
  });

  // Refs to track latest values in callbacks
  const stateRef = useRef(state);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const hasTriggeredCompleteRef = useRef(false);

  // Keep refs updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (state.duration > 0) {
      saveTimerState(state);
    } else {
      clearTimerState();
    }
  }, [state]);

  // Handle completion when remaining hits 0
  useEffect(() => {
    if (state.remaining <= 0 && state.duration > 0 && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true;

      // Trigger haptic feedback
      haptic.success();

      // Call completion callback
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }

    // Reset completion flag when timer is reset or started fresh
    if (state.remaining > 0) {
      hasTriggeredCompleteRef.current = false;
    }
  }, [state.remaining, state.duration, haptic]);

  // Main countdown interval
  useEffect(() => {
    if (!state.isRunning || state.remaining <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setState((prev) => {
        const newRemaining = Math.max(0, prev.remaining - 1);

        // Call tick callback
        if (onTickRef.current) {
          onTickRef.current(newRemaining);
        }

        // Stop running when reaching 0
        if (newRemaining <= 0) {
          return {
            ...prev,
            remaining: 0,
            isRunning: false,
            startedAt: undefined,
          };
        }

        return {
          ...prev,
          remaining: newRemaining,
        };
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [state.isRunning, state.remaining]);

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Start the timer with a specified duration
   */
  const start = useCallback((durationSeconds: number) => {
    if (durationSeconds <= 0) return;

    // Trigger haptic feedback on start
    haptic.medium();

    setState({
      remaining: durationSeconds,
      isRunning: true,
      duration: durationSeconds,
      startedAt: new Date().toISOString(),
    });
  }, [haptic]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning) return prev;

      haptic.light();

      return {
        ...prev,
        isRunning: false,
        startedAt: undefined,
      };
    });
  }, [haptic]);

  /**
   * Resume the timer
   */
  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning || prev.remaining <= 0) return prev;

      haptic.light();

      return {
        ...prev,
        isRunning: true,
        startedAt: new Date().toISOString(),
      };
    });
  }, [haptic]);

  /**
   * Toggle between running and paused
   */
  const toggle = useCallback(() => {
    if (stateRef.current.isRunning) {
      pause();
    } else if (stateRef.current.remaining > 0) {
      resume();
    }
  }, [pause, resume]);

  /**
   * Reset the timer to idle state
   */
  const reset = useCallback(() => {
    haptic.light();

    setState({
      remaining: 0,
      isRunning: false,
      duration: 0,
    });

    clearTimerState();
  }, [haptic]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  /** Progress from 0 to 1 */
  const progress = state.duration > 0 ? 1 - state.remaining / state.duration : 0;

  /** Formatted time string */
  const formattedTime = formatTime(state.remaining);

  /** Whether timer is in idle state (never started or fully reset) */
  const isIdle = state.duration === 0;

  /** Whether timer is paused (started but not running) */
  const isPaused = !state.isRunning && state.remaining > 0;

  return {
    remaining: state.remaining,
    isRunning: state.isRunning,
    duration: state.duration,
    start,
    pause,
    resume,
    toggle,
    reset,
    progress,
    formattedTime,
    isIdle,
    isPaused,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { TimerState };
