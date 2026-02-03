/**
 * TimerHistory - Recently used timer buttons
 *
 * Displays the last 5 started timers for quick one-click restart.
 * Positioned above preset buttons for convenient access to frequently used durations.
 *
 * Design philosophy: Simple, calm, no explanations.
 * Shows "Недавние" (Recent) section with compact buttons.
 *
 * @example
 * const timer = useTimer({ onComplete: handleComplete });
 * const { history } = useTimerHistory();
 *
 * // Show history when it exists
 * {history.length > 0 && (
 *   <TimerHistory onSelect={(seconds) => timer.start(seconds)} />
 * )}
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useTimerHistory } from '../hooks/useTimerHistory';

// =============================================================================
// Types
// =============================================================================

interface TimerHistoryProps {
  /**
   * Callback fired when a history item is selected
   * @param seconds - Duration in seconds
   */
  onSelect: (seconds: number) => void;

  /**
   * Whether history buttons are disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

interface HistoryButtonProps {
  label: string;
  seconds: number;
  onClick: (seconds: number) => void;
  disabled?: boolean;
  index: number;
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
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
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format duration for display
 * - Whole minutes: "5 мин"
 * - Mixed durations: "3:30"
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Whole minutes: show as "X мин"
  if (remainingSeconds === 0) {
    return `${minutes} мин`;
  }

  // Mixed durations: show as "X:XX"
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
}

/**
 * Format duration for accessibility label
 */
function formatAccessibilityLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `Запустить таймер на ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}`;
  }

  return `Запустить таймер на ${minutes} минут ${remainingSeconds} секунд`;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Individual history button
 */
const HistoryButton = memo(function HistoryButton({
  label,
  seconds,
  onClick,
  disabled = false,
  index,
}: HistoryButtonProps) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptic.medium();
    onClick(seconds);
  }, [disabled, haptic, onClick, seconds]);

  return (
    <motion.button
      variants={buttonVariants}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className="cursor-pointer transition-colors"
      style={{
        backgroundColor: 'var(--color-surface)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg) var(--space-xl)',
        minHeight: 'var(--min-touch-target)',
        minWidth: '100px',
        fontSize: 'var(--font-lg)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        letterSpacing: 'var(--letter-spacing-normal)',
        transition: 'var(--transition-colors)',
        opacity: disabled ? 0.5 : 1,
      }}
      type="button"
      aria-label={formatAccessibilityLabel(seconds)}
      tabIndex={index + 1}
    >
      {label}
    </motion.button>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * TimerHistory component displaying recently used timers
 *
 * Features:
 * - Shows last 5 timer durations from history
 * - One tap to restart timer immediately
 * - Haptic feedback on selection
 * - Smooth staggered entrance animation
 * - Full accessibility support
 * - Only renders if history exists
 *
 * @param props - Component props
 */
export const TimerHistory = memo(function TimerHistory({
  onSelect,
  disabled = false,
  className = '',
}: TimerHistoryProps) {
  const { history } = useTimerHistory();

  // Don't render if no history
  if (history.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-md)',
        gap: 'var(--space-md)',
      }}
      role="group"
      aria-label="Недавние таймеры"
    >
      {/* Section header */}
      <div
        style={{
          fontSize: 'var(--font-xs)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--letter-spacing-wide)',
          fontFamily: 'var(--font-family)',
        }}
      >
        Недавние
      </div>

      {/* History buttons in a row */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        {history.map((entry, index) => (
          <HistoryButton
            key={entry.addedAt}
            label={formatDuration(entry.duration)}
            seconds={entry.duration}
            onClick={onSelect}
            disabled={disabled}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});
