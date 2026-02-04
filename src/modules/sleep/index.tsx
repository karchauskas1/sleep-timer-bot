/**
 * Sleep Calculator Module - Main entry point for sleep time calculations
 *
 * Integrates all sleep calculator components into a cohesive experience:
 * - ModeToggle for switching between 'Ложусь сейчас' and 'Нужно встать в...' modes
 * - TimeInput for selecting wake time (waketime mode only)
 * - TimeOptions displaying calculated sleep/wake times with cycle counts
 *
 * Design principles:
 * - Silence through minimalism - no recommendations, no moralizing
 * - Calm surface - clean interface for quick check-ins
 * - Instant feedback - results update immediately as time changes
 * - Lots of whitespace - centered layout with breathing room
 *
 * Modes:
 * - bedtime: "Ложусь сейчас" (Going to bed now) - shows wake time options
 * - waketime: "Нужно встать в..." (Need to wake at...) - shows bedtime options
 *
 * @example
 * // Basic usage in router
 * <Sleep />
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SleepMode } from '@/types';
import { ModeToggle } from '@/modules/sleep/components/ModeToggle';
import { TimeInput } from '@/modules/sleep/components/TimeInput';
import { TimeOptions } from '@/modules/sleep/components/TimeOptions';
import {
  calculateSleepOptions,
  getCurrentTimeRounded,
  createTimeForToday,
} from '@/modules/sleep/utils/sleepCalculator';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default wake time for waketime mode (7:00 AM)
 */
const DEFAULT_WAKE_HOUR = 7;
const DEFAULT_WAKE_MINUTE = 0;

/**
 * Animation configuration for content transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for content transitions
 */
const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Animation variants for time input appearance
 */
const timeInputVariants = {
  initial: { opacity: 0, scale: 0.95, height: 0 },
  animate: {
    opacity: 1,
    scale: 1,
    height: 'auto',
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Sleep module
 */
interface SleepProps {
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Sleep Calculator module component
 *
 * Main entry point for the sleep calculator functionality.
 * Manages mode state and time selection for calculating optimal sleep/wake times.
 *
 * @param props - Component props
 */
export function Sleep({ className = '' }: SleepProps) {
  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  /**
   * Sleep onset time in minutes from settings store
   * Used in all sleep calculations
   */
  const sleepOnsetMinutes = useSettingsStore((state) => state.sleepOnsetMinutes);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /**
   * Current calculator mode
   * - bedtime: Shows wake times based on going to bed now
   * - waketime: Shows bedtimes based on desired wake time
   */
  const [mode, setMode] = useState<SleepMode>('bedtime');

  /**
   * Selected time for waketime mode
   * In bedtime mode, we always use the current time
   */
  const [selectedTime, setSelectedTime] = useState<Date>(() =>
    createTimeForToday(DEFAULT_WAKE_HOUR, DEFAULT_WAKE_MINUTE, true)
  );

  /**
   * Current time for bedtime mode (updated periodically)
   */
  const [currentTime, setCurrentTime] = useState<Date>(getCurrentTimeRounded);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  /**
   * Update current time every minute in bedtime mode
   * This ensures the calculated wake times stay accurate
   */
  useEffect(() => {
    if (mode !== 'bedtime') return;

    // Update immediately
    setCurrentTime(getCurrentTimeRounded());

    // Update every minute
    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTimeRounded());
    }, 60000);

    return () => clearInterval(intervalId);
  }, [mode]);

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------

  /**
   * The reference time used for calculations
   * - bedtime mode: current time (going to bed now)
   * - waketime mode: selected wake time
   */
  const referenceTime = mode === 'bedtime' ? currentTime : selectedTime;

  /**
   * Calculated sleep/wake time options
   * Memoized to only recalculate when mode, reference time, or sleep onset setting changes
   */
  const sleepOptions = useMemo(
    () => calculateSleepOptions(mode, referenceTime, sleepOnsetMinutes),
    [mode, referenceTime, sleepOnsetMinutes]
  );

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle mode change
   * Resets selected time to default when switching to waketime mode
   */
  const handleModeChange = useCallback((newMode: SleepMode) => {
    setMode(newMode);

    // Reset selected time when switching to waketime mode
    if (newMode === 'waketime') {
      setSelectedTime(createTimeForToday(DEFAULT_WAKE_HOUR, DEFAULT_WAKE_MINUTE, true));
    }
  }, []);

  /**
   * Handle time change in waketime mode
   */
  const handleTimeChange = useCallback((time: Date) => {
    setSelectedTime(time);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={`flex flex-col min-h-full ${className}`}
      style={{
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Content container with vertical centering */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          padding: 'var(--space-lg)',
          paddingTop: 'var(--space-2xl)',
          paddingBottom: 'var(--space-3xl)',
        }}
      >
        {/* Mode Toggle */}
        <div
          className="w-full max-w-xs"
          style={{
            marginBottom: 'var(--space-3xl)',
          }}
        >
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
          />
        </div>

        {/* Time Input (waketime mode only) */}
        <AnimatePresence mode="wait">
          {mode === 'waketime' && (
            <motion.div
              key="time-input"
              variants={timeInputVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex justify-center"
              style={{
                marginBottom: 'var(--space-3xl)',
              }}
            >
              <TimeInput
                value={selectedTime}
                onChange={handleTimeChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* "Now" indicator for bedtime mode */}
        <AnimatePresence mode="wait">
          {mode === 'bedtime' && (
            <motion.div
              key="now-indicator"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={ANIMATION_CONFIG}
              className="text-center"
              style={{
                marginBottom: 'var(--space-3xl)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  letterSpacing: 'var(--letter-spacing-wide)',
                  textTransform: 'uppercase',
                }}
              >
                Если лечь сейчас
              </p>
              <p
                className="tabular-nums"
                style={{
                  fontSize: 'var(--font-timer)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                  lineHeight: 'var(--line-height-none)',
                }}
              >
                {currentTime.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Options */}
        <motion.div
          layout
          className="w-full max-w-sm"
          transition={ANIMATION_CONFIG}
        >
          <TimeOptions
            options={sleepOptions}
            mode={mode}
          />
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Sleep;
export type { SleepProps };
