/**
 * SleepOnsetSetting - Component for configuring sleep onset time
 *
 * Provides a numeric input for setting the expected time to fall asleep (1-60 minutes).
 * This setting affects the sleep calculator's recommended bedtimes, adding the
 * sleep onset time to ensure users have enough time to fall asleep before their
 * target sleep time.
 *
 * Design philosophy: minimal, clear number input with stepper buttons.
 * No explanations needed - just a clean interface to set how many minutes
 * you typically need to fall asleep.
 *
 * @example
 * const [sleepOnset, setSleepOnset] = useState(15);
 *
 * <SleepOnsetSetting
 *   value={sleepOnset}
 *   onChange={setSleepOnset}
 * />
 */

import { memo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/** Minimum sleep onset time in minutes */
const MIN_MINUTES = 1;

/** Maximum sleep onset time in minutes */
const MAX_MINUTES = 60;

/** Default sleep onset time in minutes */
export const DEFAULT_SLEEP_ONSET_MINUTES = 14;

/** Step size for increment/decrement buttons */
const STEP_SIZE = 5;

// =============================================================================
// Types
// =============================================================================

interface SleepOnsetSettingProps {
  /**
   * Current sleep onset value in minutes
   */
  value: number;

  /**
   * Callback fired when the value changes
   * @param minutes - New sleep onset time in minutes
   */
  onChange: (minutes: number) => void;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Clamp value within valid range (1-60 minutes)
 */
function clampMinutes(value: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, value));
}

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

// =============================================================================
// Main Component
// =============================================================================

/**
 * SleepOnsetSetting component for configuring sleep onset time
 *
 * Features:
 * - Numeric input field for minutes (1-60)
 * - Increment/decrement stepper buttons (±5 minutes)
 * - Haptic feedback on interactions
 * - Full accessibility support
 * - Input validation and clamping
 *
 * @param props - Component props
 */
export const SleepOnsetSetting = memo(function SleepOnsetSetting({
  value,
  onChange,
  disabled = false,
  className = '',
}: SleepOnsetSettingProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty input for clearing
      if (inputValue === '') {
        onChange(MIN_MINUTES);
        return;
      }

      // Parse and clamp
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed)) {
        onChange(clampMinutes(parsed));
      }
    },
    [onChange]
  );

  // Handle input blur - ensure valid value
  const handleInputBlur = useCallback(() => {
    onChange(clampMinutes(value));
  }, [value, onChange]);

  // Handle increment
  const handleIncrement = useCallback(() => {
    const newValue = clampMinutes(value + STEP_SIZE);
    onChange(newValue);
  }, [value, onChange]);

  // Handle decrement
  const handleDecrement = useCallback(() => {
    const newValue = clampMinutes(value - STEP_SIZE);
    onChange(newValue);
  }, [value, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        haptic.selectionChanged();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        haptic.selectionChanged();
        handleDecrement();
      }
    },
    [handleIncrement, handleDecrement, haptic]
  );

  // Format display value
  const displayMinutes = value.toString();

  // Calculate if at bounds
  const atMin = value <= MIN_MINUTES;
  const atMax = value >= MAX_MINUTES;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ gap: 'var(--space-md)' }}
      role="group"
      aria-label="Настройка времени засыпания"
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
          aria-label="Время засыпания в минутах"
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
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { SleepOnsetSettingProps };
export { MIN_MINUTES, MAX_MINUTES, STEP_SIZE };
