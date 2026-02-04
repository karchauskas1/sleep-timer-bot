/**
 * WheelTimePicker - iOS-style wheel picker for timer duration selection
 *
 * Provides three scrollable wheel columns for hours, minutes, and seconds.
 * Uses @ncdai/react-wheel-picker for native iOS-like wheel interaction.
 *
 * Design philosophy: minimal, iOS Timer-style, quick selection.
 * Clean wheel interface with smooth infinite scrolling.
 *
 * @example
 * const timer = useTimer({ onComplete: handleComplete });
 *
 * // Show wheel picker when timer is idle
 * {timer.isIdle && (
 *   <WheelTimePicker
 *     onStart={(seconds) => timer.start(seconds)}
 *   />
 * )}
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WheelPicker, WheelPickerWrapper } from '@ncdai/react-wheel-picker';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/** Maximum hours value (0-23) */
const MAX_HOURS = 23;

/** Maximum minutes/seconds value (0-59) */
const MAX_MINUTES_SECONDS = 59;

/** Default values for picker */
const DEFAULT_HOURS = '00';
const DEFAULT_MINUTES = '00';
const DEFAULT_SECONDS = '00';

// =============================================================================
// Types
// =============================================================================

interface WheelTimePickerProps {
  /**
   * Callback fired when user starts the timer
   * @param seconds - Duration in seconds
   */
  onStart: (seconds: number) => void;

  /**
   * Whether the picker is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Initial hours value (0-23)
   */
  initialHours?: string;

  /**
   * Initial minutes value (0-59)
   */
  initialMinutes?: string;

  /**
   * Initial seconds value (0-59)
   */
  initialSeconds?: string;
}

interface PickerOption {
  value: string;
  label: string;
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
// Helper Functions
// =============================================================================

/**
 * Generate options array for wheel picker
 * @param max - Maximum value (inclusive)
 */
const generateOptions = (max: number): PickerOption[] => {
  return Array.from({ length: max + 1 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: String(i).padStart(2, '0'),
  }));
};

/**
 * Convert hours, minutes, seconds to total seconds
 */
const toTotalSeconds = (hours: string, minutes: string, seconds: string): number => {
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(seconds, 10)
  );
};

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Cancel button component
 */
const CancelButton = memo(function CancelButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptic.light();
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
        backgroundColor: 'var(--color-surface)',
        color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-xl)',
        minHeight: 'var(--min-touch-target)',
        minWidth: '100px',
        fontSize: 'var(--font-base)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        letterSpacing: 'var(--letter-spacing-wide)',
        transition: 'var(--transition-colors)',
        opacity: disabled ? 0.5 : 1,
      }}
      type="button"
      aria-label="Сбросить время"
    >
      Отмена
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

/**
 * Time unit label component
 */
const TimeLabel = memo(function TimeLabel({ label }: { label: string }) {
  return (
    <span
      style={{
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--font-weight-normal)',
        fontFamily: 'var(--font-family)',
        paddingLeft: 'var(--space-xs)',
        paddingRight: 'var(--space-sm)',
      }}
    >
      {label}
    </span>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * WheelTimePicker component for iOS-style time selection
 *
 * Features:
 * - Three wheel pickers for hours, minutes, seconds
 * - Infinite scroll enabled on all columns
 * - Cancel button to reset values
 * - Start button (disabled when 0:00:00)
 * - Haptic feedback on interactions
 * - Full accessibility support
 *
 * @param props - Component props
 */
export const WheelTimePicker = memo(function WheelTimePicker({
  onStart,
  disabled = false,
  className = '',
  initialHours = DEFAULT_HOURS,
  initialMinutes = DEFAULT_MINUTES,
  initialSeconds = DEFAULT_SECONDS,
}: WheelTimePickerProps) {
  // State for selected values
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  const haptic = useHaptic();

  // Generate options for each picker
  const hourOptions = useMemo(() => generateOptions(MAX_HOURS), []);
  const minuteSecondOptions = useMemo(() => generateOptions(MAX_MINUTES_SECONDS), []);

  // Calculate total seconds
  const totalSeconds = useMemo(
    () => toTotalSeconds(hours, minutes, seconds),
    [hours, minutes, seconds]
  );

  // Check if time is zero (Start button should be disabled)
  const isZeroTime = totalSeconds === 0;

  // Handle value changes with haptic feedback
  const handleHoursChange = useCallback(
    (value: string) => {
      haptic.selectionChanged();
      setHours(value);
    },
    [haptic]
  );

  const handleMinutesChange = useCallback(
    (value: string) => {
      haptic.selectionChanged();
      setMinutes(value);
    },
    [haptic]
  );

  const handleSecondsChange = useCallback(
    (value: string) => {
      haptic.selectionChanged();
      setSeconds(value);
    },
    [haptic]
  );

  // Handle cancel - reset all values
  const handleCancel = useCallback(() => {
    setHours(DEFAULT_HOURS);
    setMinutes(DEFAULT_MINUTES);
    setSeconds(DEFAULT_SECONDS);
  }, []);

  // Handle start - convert to seconds and call callback
  const handleStart = useCallback(() => {
    if (totalSeconds > 0) {
      onStart(totalSeconds);
    }
  }, [totalSeconds, onStart]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-lg) var(--space-md)',
        gap: 'var(--space-xl)',
      }}
    >
      {/* Wheel picker section */}
      <div
        className="flex items-center justify-center wheel-picker-container"
        role="group"
        aria-label="Выбор времени"
        style={{
          gap: 'var(--space-xs)',
        }}
      >
        <WheelPickerWrapper>
          {/* Hours picker */}
          <WheelPicker
            options={hourOptions}
            value={hours}
            onValueChange={handleHoursChange}
            infinite
            aria-label="Часы"
          />
          <TimeLabel label="ч" />

          {/* Minutes picker */}
          <WheelPicker
            options={minuteSecondOptions}
            value={minutes}
            onValueChange={handleMinutesChange}
            infinite
            aria-label="Минуты"
          />
          <TimeLabel label="мин" />

          {/* Seconds picker */}
          <WheelPicker
            options={minuteSecondOptions}
            value={seconds}
            onValueChange={handleSecondsChange}
            infinite
            aria-label="Секунды"
          />
          <TimeLabel label="сек" />
        </WheelPickerWrapper>
      </div>

      {/* Action buttons */}
      <div
        className="flex items-center justify-center"
        style={{ gap: 'var(--space-md)' }}
      >
        <CancelButton onClick={handleCancel} disabled={disabled} />
        <StartButton onClick={handleStart} disabled={disabled || isZeroTime} />
      </div>
    </motion.div>
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { WheelTimePickerProps };
export { DEFAULT_HOURS, DEFAULT_MINUTES, DEFAULT_SECONDS };
