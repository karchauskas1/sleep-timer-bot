/**
 * CustomTimeInput - Component for entering custom timer duration
 *
 * Provides a simple numeric input for custom timer durations in minutes.
 * Supports both typing and increment/decrement buttons.
 *
 * Design philosophy: minimal, quick entry, no explanations.
 * Just a clean interface to enter how many minutes you want.
 *
 * @example
 * const timer = useTimer({ onComplete: handleComplete });
 *
 * // Show custom input when timer is idle
 * {timer.isIdle && (
 *   <CustomTimeInput
 *     onStart={(seconds) => timer.start(seconds)}
 *   />
 * )}
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/** Minimum timer duration in minutes */
const MIN_MINUTES = 1;

/** Maximum timer duration in minutes (2 hours) */
const MAX_MINUTES = 120;

/** Default initial value in minutes */
const DEFAULT_MINUTES = 15;

/** Step size for increment/decrement buttons */
const STEP_SIZE = 5;

// =============================================================================
// Types
// =============================================================================

interface CustomTimeInputProps {
  /**
   * Callback fired when user starts the timer
   * @param seconds - Duration in seconds
   */
  onStart: (seconds: number) => void;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Initial value in minutes
   */
  initialMinutes?: number;
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
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
 * Stepper button for increment/decrement
 */
const StepperButton = memo(function StepperButton({
  direction,
  onClick,
  disabled = false,
}: {
  direction: 'increment' | 'decrement';
  onClick: () => void;
  disabled?: boolean;
}) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptic.light();
    onClick();
  }, [disabled, haptic, onClick]);

  const isIncrement = direction === 'increment';

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={handleClick}
      disabled={disabled}
      className="flex items-center justify-center cursor-pointer transition-colors"
      style={{
        width: 'var(--min-touch-target)',
        height: 'var(--min-touch-target)',
        backgroundColor: disabled ? 'var(--color-surface)' : 'var(--color-surface-hover)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-xl)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        transition: 'var(--transition-colors)',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
      }}
      type="button"
      aria-label={isIncrement ? 'Увеличить время' : 'Уменьшить время'}
    >
      {isIncrement ? '+' : '−'}
    </motion.button>
  );
});

/**
 * Start button component
 */
const StartButton = memo(function StartButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptic.medium();
    onClick();
  }, [disabled, haptic, onClick]);

  return (
    <motion.button
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className="cursor-pointer transition-colors"
      style={{
        backgroundColor: disabled ? 'var(--color-surface)' : 'var(--color-accent)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-inverse)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-2xl)',
        minHeight: 'var(--min-touch-target)',
        minWidth: '140px',
        fontSize: 'var(--font-base)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        letterSpacing: 'var(--letter-spacing-wide)',
        transition: 'var(--transition-colors)',
        opacity: disabled ? 0.5 : 1,
      }}
      type="button"
      aria-label="Запустить таймер"
    >
      Старт
    </motion.button>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * CustomTimeInput component for entering custom timer duration
 *
 * Features:
 * - Numeric input field for minutes
 * - Increment/decrement stepper buttons (±5 minutes)
 * - Start button to begin timer
 * - Haptic feedback on interactions
 * - Full accessibility support
 *
 * @param props - Component props
 */
export const CustomTimeInput = memo(function CustomTimeInput({
  onStart,
  disabled = false,
  className = '',
  initialMinutes = DEFAULT_MINUTES,
}: CustomTimeInputProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const inputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  // Clamp value within bounds
  const clampMinutes = useCallback((value: number): number => {
    return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, value));
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Allow empty input for clearing
      if (value === '') {
        setMinutes(MIN_MINUTES);
        return;
      }

      // Parse and clamp
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        setMinutes(clampMinutes(parsed));
      }
    },
    [clampMinutes]
  );

  // Handle input blur - ensure valid value
  const handleInputBlur = useCallback(() => {
    setMinutes((current) => clampMinutes(current));
  }, [clampMinutes]);

  // Handle increment
  const handleIncrement = useCallback(() => {
    setMinutes((current) => {
      const newValue = clampMinutes(current + STEP_SIZE);
      return newValue;
    });
  }, [clampMinutes]);

  // Handle decrement
  const handleDecrement = useCallback(() => {
    setMinutes((current) => {
      const newValue = clampMinutes(current - STEP_SIZE);
      return newValue;
    });
  }, [clampMinutes]);

  // Handle start
  const handleStart = useCallback(() => {
    if (minutes > 0) {
      onStart(minutes * 60); // Convert to seconds
    }
  }, [minutes, onStart]);

  // Handle key press for quick entry
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        haptic.selectionChanged();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        haptic.selectionChanged();
        handleDecrement();
      }
    },
    [handleStart, handleIncrement, handleDecrement, haptic]
  );

  // Format display value
  const displayMinutes = minutes.toString();

  // Calculate if at bounds
  const atMin = minutes <= MIN_MINUTES;
  const atMax = minutes >= MAX_MINUTES;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-lg) var(--space-md)',
        gap: 'var(--space-lg)',
      }}
    >
      {/* Time input with stepper buttons */}
      <div
        className="flex items-center justify-center"
        style={{ gap: 'var(--space-md)' }}
        role="group"
        aria-label="Установка времени"
      >
        {/* Decrement button */}
        <StepperButton
          direction="decrement"
          onClick={handleDecrement}
          disabled={disabled || atMin}
        />

        {/* Minutes input */}
        <div
          className="flex items-center justify-center"
          style={{ gap: 'var(--space-xs)' }}
        >
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={displayMinutes}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            className="text-center tabular-nums appearance-none"
            style={{
              width: '80px',
              padding: 'var(--space-sm) var(--space-xs)',
              backgroundColor: 'var(--color-surface)',
              color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family)',
              letterSpacing: 'var(--letter-spacing-tight)',
              outline: 'none',
              transition: 'var(--transition-colors)',
              opacity: disabled ? 0.5 : 1,
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
            }}
            aria-label="Количество минут"
          />
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-base)',
              fontWeight: 'var(--font-weight-normal)',
              fontFamily: 'var(--font-family)',
            }}
          >
            мин
          </span>
        </div>

        {/* Increment button */}
        <StepperButton
          direction="increment"
          onClick={handleIncrement}
          disabled={disabled || atMax}
        />
      </div>

      {/* Start button */}
      <StartButton onClick={handleStart} disabled={disabled || minutes < MIN_MINUTES} />
    </motion.div>
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { CustomTimeInputProps };
export { MIN_MINUTES, MAX_MINUTES, DEFAULT_MINUTES, STEP_SIZE };
