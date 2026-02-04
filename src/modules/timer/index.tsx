/**
 * Timer Module - Main entry point for timer functionality
 *
 * Integrates all timer components into a cohesive experience:
 * - WheelTimePicker for iOS-style wheel duration selection
 * - TimerHistory for quick restart from recent durations
 * - TimerDisplay showing countdown when active
 *
 * Design principles:
 * - Silence through minimalism - no tracking, no statistics
 * - Calm surface - clean interface for quick check-ins
 * - One-tap start - minimal interaction to begin
 * - Large, glanceable display when running
 *
 * States:
 * - idle: Shows wheel picker and history (timer not started)
 * - active: Shows countdown display with stop button
 *
 * @example
 * // Basic usage in router
 * <Timer />
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '@/modules/timer/hooks/useTimer';
import { useTimerHistory } from '@/modules/timer/hooks/useTimerHistory';
import { TimerDisplay } from '@/modules/timer/components/TimerDisplay';
import { TimerHistory } from '@/modules/timer/components/TimerHistory';
import { WheelTimePicker } from '@/modules/timer/components/WheelTimePicker';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for content transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for idle state content
 */
const idleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Animation variants for active state content
 */
const activeVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Animation variants for section transitions
 */
const sectionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Timer module
 */
interface TimerProps {
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Timer module component
 *
 * Main entry point for the timer functionality.
 * Manages timer state and switches between idle and active views.
 *
 * Features:
 * - iOS-style wheel picker for hours, minutes, seconds
 * - Recent timer history for quick restart
 * - Large countdown display when running
 * - Pause/resume and stop controls
 * - Haptic feedback on interactions
 * - Persists across module switching
 *
 * @param props - Component props
 */
export function Timer({ className = '' }: TimerProps) {
  // -------------------------------------------------------------------------
  // Timer Hook
  // -------------------------------------------------------------------------

  const timer = useTimer({
    onComplete: () => {
      // Timer completion is handled by the hook (haptic feedback)
      // Additional effects (sound, notification) can be added here
    },
  });

  // -------------------------------------------------------------------------
  // Timer History Hook
  // -------------------------------------------------------------------------

  const { addToHistory } = useTimerHistory();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Start timer with a given duration in seconds
   * Also adds the duration to history for quick restart
   */
  const handleStart = useCallback(
    (seconds: number) => {
      timer.start(seconds);
      addToHistory(seconds);
    },
    [timer, addToHistory]
  );

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
          paddingTop: 'var(--space-xl)',
          paddingBottom: 'var(--space-2xl)',
        }}
      >
        <AnimatePresence mode="wait">
          {timer.isIdle ? (
            // =================================================================
            // Idle State: Show wheel picker and history
            // =================================================================
            <motion.div
              key="idle-state"
              variants={idleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-sm flex flex-col items-center"
            >
              {/* History Section */}
              <motion.div
                variants={sectionVariants}
                className="w-full"
                style={{
                  marginBottom: 'var(--space-xl)',
                }}
              >
                <TimerHistory onSelect={handleStart} />
              </motion.div>

              {/* Wheel Time Picker Section */}
              <motion.div
                variants={sectionVariants}
                className="w-full"
              >
                <WheelTimePicker onStart={handleStart} />
              </motion.div>
            </motion.div>
          ) : (
            // =================================================================
            // Active State: Show timer display
            // =================================================================
            <motion.div
              key="active-state"
              variants={activeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-sm flex flex-col items-center justify-center"
            >
              <TimerDisplay
                formattedTime={timer.formattedTime}
                progress={timer.progress}
                isRunning={timer.isRunning}
                isPaused={timer.isPaused}
                onPause={timer.pause}
                onResume={timer.resume}
                onStop={timer.reset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Timer;
export type { TimerProps };
