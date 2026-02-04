/**
 * TimerPresets - Quick-start preset timer buttons
 *
 * Provides preset duration buttons (5, 10, 25 minutes) for quick timer start.
 * One tap to start - minimal interaction design.
 *
 * Design philosophy: Simple, calm, no explanations.
 * Labels use Russian abbreviations: '5 мин', '10 мин', '25 мин'
 *
 * @example
 * const timer = useTimer({ onComplete: handleComplete });
 *
 * // Show presets when timer is idle
 * {timer.isIdle && (
 *   <TimerPresets onSelect={(seconds) => timer.start(seconds)} />
 * )}
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Preset timer durations
 * Values in seconds, labels in Russian
 */
const PRESETS = [
  { minutes: 5, label: '5 мин', seconds: 5 * 60 },
  { minutes: 10, label: '10 мин', seconds: 10 * 60 },
  { minutes: 25, label: '25 мин', seconds: 25 * 60 },
] as const;

// =============================================================================
// Types
// =============================================================================

interface TimerPresetsProps {
  /**
   * Callback fired when a preset is selected
   * @param seconds - Duration in seconds
   */
  onSelect: (seconds: number) => void;

  /**
   * Whether preset buttons are disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

interface PresetButtonProps {
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
// Sub-components
// =============================================================================

/**
 * Individual preset button
 */
const PresetButton = memo(function PresetButton({
  label,
  seconds,
  onClick,
  disabled = false,
  index,
}: PresetButtonProps) {
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
      aria-label={`Запустить таймер на ${label}`}
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
 * TimerPresets component with 5, 10, 25 minute quick-start buttons
 *
 * Features:
 * - Three preset durations following spec: 5, 10, 25 minutes
 * - One tap to start timer immediately
 * - Haptic feedback on selection
 * - Smooth staggered entrance animation
 * - Full accessibility support
 *
 * @param props - Component props
 */
export const TimerPresets = memo(function TimerPresets({
  onSelect,
  disabled = false,
  className = '',
}: TimerPresetsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-xl) var(--space-md)',
        gap: 'var(--space-md)',
      }}
      role="group"
      aria-label="Предустановки таймера"
    >
      {/* Preset buttons in a row */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        {PRESETS.map((preset, index) => (
          <PresetButton
            key={preset.minutes}
            label={preset.label}
            seconds={preset.seconds}
            onClick={onSelect}
            disabled={disabled}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { TimerPresetsProps };
export { PRESETS };
