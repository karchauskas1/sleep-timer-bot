/**
 * TimerDisplay - Large centered timer display component
 *
 * Shows the remaining time in a prominent, easy-to-read format.
 * Displays MM:SS countdown with optional progress indicator.
 * Includes Stop button when timer is running.
 *
 * Design philosophy: minimal, calm, glanceable.
 * Large digits for quick reading without focusing.
 *
 * @example
 * const timer = useTimer({ onComplete: handleComplete });
 *
 * // When timer is running, show the display
 * {!timer.isIdle && (
 *   <TimerDisplay
 *     formattedTime={timer.formattedTime}
 *     progress={timer.progress}
 *     isRunning={timer.isRunning}
 *     isPaused={timer.isPaused}
 *     onPause={timer.pause}
 *     onResume={timer.resume}
 *     onStop={timer.reset}
 *   />
 * )}
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Types
// =============================================================================

interface TimerDisplayProps {
  /** Formatted time string (MM:SS) */
  formattedTime: string;
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Callback to pause the timer */
  onPause: () => void;
  /** Callback to resume the timer */
  onResume: () => void;
  /** Callback to stop/reset the timer */
  onStop: () => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
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

const buttonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Progress ring indicator
 */
const ProgressRing = memo(function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 4,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border-thin)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.3s ease-out',
        }}
      />
    </svg>
  );
});

/**
 * Control button component
 */
const ControlButton = memo(function ControlButton({
  label,
  onClick,
  variant = 'default',
}: {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}) {
  const haptic = useHaptic();

  const handleClick = () => {
    haptic.light();
    onClick();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-inverse)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        };
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
        };
    }
  };

  return (
    <motion.button
      variants={buttonVariants}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="rounded-full transition-colors cursor-pointer"
      style={{
        ...getVariantStyles(),
        padding: 'var(--space-sm) var(--space-lg)',
        minHeight: 'var(--min-touch-target)',
        minWidth: '100px',
        fontSize: 'var(--font-base)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        letterSpacing: 'var(--letter-spacing-wide)',
        transition: 'var(--transition-colors)',
      }}
      type="button"
      aria-label={label}
    >
      {label}
    </motion.button>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * TimerDisplay component showing remaining time in large centered format
 *
 * Features:
 * - Large, easy-to-read MM:SS display
 * - Optional progress ring indicator
 * - Pause/Resume toggle
 * - Stop button to cancel timer
 * - Smooth animations
 *
 * @param props - Component props
 */
export const TimerDisplay = memo(function TimerDisplay({
  formattedTime,
  progress,
  isRunning,
  isPaused,
  onPause,
  onResume,
  onStop,
  className = '',
}: TimerDisplayProps) {
  const handleToggle = () => {
    if (isRunning) {
      onPause();
    } else {
      onResume();
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-2xl) var(--space-md)',
        minHeight: '300px',
      }}
    >
      {/* Timer display with progress ring */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: '220px',
          height: '220px',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Progress ring */}
        <ProgressRing progress={progress} size={200} strokeWidth={4} />

        {/* Time display */}
        <motion.div
          key={formattedTime}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <span
            className="tabular-nums font-semibold"
            style={{
              fontSize: 'var(--font-timer)',
              lineHeight: 'var(--line-height-none)',
              color: 'var(--color-text-primary)',
              letterSpacing: 'var(--letter-spacing-tight)',
              fontFamily: 'var(--font-family)',
            }}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formattedTime}
          </span>

          {/* Status indicator */}
          {isPaused && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-xs)',
                letterSpacing: 'var(--letter-spacing-wide)',
              }}
            >
              Пауза
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Control buttons */}
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3"
      >
        {/* Pause/Resume button */}
        <ControlButton
          label={isRunning ? 'Пауза' : 'Далее'}
          onClick={handleToggle}
          variant="secondary"
        />

        {/* Stop button */}
        <ControlButton
          label="Стоп"
          onClick={onStop}
          variant="default"
        />
      </motion.div>
    </motion.div>
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { TimerDisplayProps };
