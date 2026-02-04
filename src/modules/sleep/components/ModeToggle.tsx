/**
 * ModeToggle - Switch between 'Ложусь сейчас' and 'Нужно встать в...' modes
 *
 * Two-button toggle for selecting sleep calculator mode:
 * - bedtime: "Ложусь сейчас" (Going to bed now) - calculates wake times
 * - waketime: "Нужно встать в..." (Need to wake at...) - calculates bed times
 *
 * Design philosophy: "silence through minimalism" - clean toggle with
 * instant feedback and no explanations.
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SleepMode } from '@/types';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Types
// =============================================================================

interface ModeToggleProps {
  /** Currently selected mode */
  mode: SleepMode;
  /** Called when mode changes */
  onModeChange: (mode: SleepMode) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

interface ModeButtonProps {
  /** Mode this button represents */
  targetMode: SleepMode;
  /** Current mode for checking if selected */
  currentMode: SleepMode;
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Label for bedtime mode (going to bed now) */
const LABEL_BEDTIME = 'Ложусь сейчас';

/** Label for waketime mode (need to wake at specific time) */
const LABEL_WAKETIME = 'Нужно встать в...';

// =============================================================================
// Animation Variants
// =============================================================================

const indicatorVariants = {
  bedtime: { x: 0 },
  waketime: { x: '100%' },
};

// =============================================================================
// ModeButton Component
// =============================================================================

/**
 * Individual mode button
 */
const ModeButton = memo(function ModeButton({
  targetMode,
  currentMode,
  label,
  onClick,
  disabled = false,
}: ModeButtonProps) {
  const isSelected = currentMode === targetMode;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`sleep-panel-${targetMode}`}
      id={`sleep-tab-${targetMode}`}
      tabIndex={isSelected ? 0 : -1}
      className={`
        relative z-10 flex-1 py-2.5 px-4
        text-center transition-colors
        rounded-lg
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      style={{
        fontSize: 'var(--font-sm)',
        fontWeight: isSelected ? 600 : 400,
        color: isSelected
          ? 'var(--color-text-primary)'
          : 'var(--color-text-tertiary, var(--color-text-secondary))',
        opacity: isSelected ? 1 : 0.65,
        lineHeight: 'var(--line-height-normal)',
        letterSpacing: 'var(--letter-spacing-normal)',
        transitionDuration: 'var(--duration-base)',
        transitionTimingFunction: 'var(--ease-out)',
        transitionProperty: 'color, opacity, font-weight',
      }}
    >
      {label}
    </button>
  );
});

// =============================================================================
// ModeToggle Component
// =============================================================================

/**
 * Mode toggle switch for sleep calculator
 *
 * @example
 * // Basic usage
 * const [mode, setMode] = useState<SleepMode>('bedtime');
 *
 * <ModeToggle
 *   mode={mode}
 *   onModeChange={setMode}
 * />
 *
 * @example
 * // With callback that resets time on mode change
 * const handleModeChange = (newMode: SleepMode) => {
 *   setMode(newMode);
 *   if (newMode === 'bedtime') {
 *     setTime(new Date()); // Auto-fill current time for bedtime mode
 *   }
 * };
 *
 * <ModeToggle
 *   mode={mode}
 *   onModeChange={handleModeChange}
 * />
 */
export const ModeToggle = memo(function ModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className = '',
}: ModeToggleProps) {
  const haptic = useHaptic();

  // Handle mode selection
  const handleSelectMode = useCallback(
    (newMode: SleepMode) => {
      if (newMode !== mode && !disabled) {
        haptic.light();
        onModeChange(newMode);
      }
    },
    [mode, disabled, haptic, onModeChange]
  );

  // Handle bedtime mode selection
  const handleSelectBedtime = useCallback(() => {
    handleSelectMode('bedtime');
  }, [handleSelectMode]);

  // Handle waketime mode selection
  const handleSelectWaketime = useCallback(() => {
    handleSelectMode('waketime');
  }, [handleSelectMode]);

  return (
    <div
      className={`relative ${className}`}
      role="tablist"
      aria-label="Режим калькулятора сна"
    >
      {/* Background container */}
      <div
        className="flex rounded-lg p-1"
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Sliding indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-md"
          style={{
            width: 'calc(50% - 4px)',
            left: 4,
            backgroundColor: 'var(--color-bg)',
            boxShadow: `
              0 1px 3px rgba(0, 0, 0, 0.08),
              0 2px 6px rgba(0, 0, 0, 0.06),
              0 0 0 1px rgba(0, 0, 0, 0.04)
            `,
          }}
          variants={indicatorVariants}
          animate={mode}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.8,
          }}
        />

        {/* Bedtime button */}
        <ModeButton
          targetMode="bedtime"
          currentMode={mode}
          label={LABEL_BEDTIME}
          onClick={handleSelectBedtime}
          disabled={disabled}
        />

        {/* Waketime button */}
        <ModeButton
          targetMode="waketime"
          currentMode={mode}
          label={LABEL_WAKETIME}
          onClick={handleSelectWaketime}
          disabled={disabled}
        />
      </div>
    </div>
  );
});

// =============================================================================
// Exports
// =============================================================================

export type { ModeToggleProps };
