/**
 * SoundSelector - Component for selecting timer completion sound
 *
 * Provides a choice of calming notification sounds for timer completion.
 * Users can preview sounds before selecting, and the preference is persisted.
 *
 * Design philosophy: Simple, calm, minimal interaction.
 * Shows 4 options: Chime, Bell, Tone, None
 *
 * @example
 * const [soundPreference, setSoundPreference] = useState<SoundType>('chime');
 *
 * <SoundSelector
 *   selected={soundPreference}
 *   onSelect={(sound) => setSoundPreference(sound)}
 * />
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useSound } from '@/shared/hooks/useSound';
import { getSetting, setSetting } from '@/shared/utils/storage';
import type { SoundType } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Available sound options with Russian labels
 */
const SOUND_OPTIONS = [
  { value: 'chime' as const, label: 'Звонок', icon: '🔔' },
  { value: 'bell' as const, label: 'Колокол', icon: '🛎️' },
  { value: 'tone' as const, label: 'Тон', icon: '🎵' },
  { value: 'none' as const, label: 'Без звука', icon: '🔇' },
] as const;

// =============================================================================
// Types
// =============================================================================

interface SoundSelectorProps {
  /**
   * Currently selected sound
   */
  selected?: SoundType;

  /**
   * Callback fired when a sound is selected
   * @param sound - The selected sound type
   */
  onSelect?: (sound: SoundType) => void;

  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

interface SoundOptionButtonProps {
  value: SoundType;
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: (sound: SoundType) => void;
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
 * Individual sound option button
 */
const SoundOptionButton = memo(function SoundOptionButton({
  value,
  label,
  icon,
  isSelected,
  onClick,
  disabled = false,
  index,
}: SoundOptionButtonProps) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptic.light();
    onClick(value);
  }, [disabled, haptic, onClick, value]);

  return (
    <motion.button
      variants={buttonVariants}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className="cursor-pointer transition-colors"
      style={{
        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
        color: isSelected
          ? 'var(--color-text-inverse)'
          : disabled
            ? 'var(--color-text-disabled)'
            : 'var(--color-text-primary)',
        border: isSelected ? 'none' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        minHeight: 'var(--min-touch-target)',
        minWidth: '90px',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-family)',
        letterSpacing: 'var(--letter-spacing-normal)',
        transition: 'var(--transition-colors)',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-xs)',
      }}
      type="button"
      aria-label={`Выбрать звук: ${label}`}
      aria-pressed={isSelected}
      tabIndex={index + 1}
    >
      <span style={{ fontSize: 'var(--font-xl)' }}>{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * SoundSelector component for choosing timer completion sound
 *
 * Features:
 * - Four sound options: Chime, Bell, Tone, None
 * - Preview playback on selection
 * - Visual indication of selected sound
 * - Persists preference to IndexedDB
 * - Haptic feedback on selection
 * - Smooth staggered entrance animation
 * - Full accessibility support
 *
 * @param props - Component props
 */
export const SoundSelector = memo(function SoundSelector({
  selected,
  onSelect,
  disabled = false,
  className = '',
}: SoundSelectorProps) {
  const sound = useSound();
  const [internalSelected, setInternalSelected] = useState<SoundType>('chime');

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      const saved = await getSetting('soundPreference');
      if (saved && (saved === 'chime' || saved === 'bell' || saved === 'tone' || saved === 'none')) {
        setInternalSelected(saved as SoundType);
      }
    };

    if (selected === undefined) {
      loadPreference();
    }
  }, [selected]);

  // Use controlled value if provided, otherwise use internal state
  const currentSelected = selected !== undefined ? selected : internalSelected;

  // Handle sound selection
  const handleSelect = useCallback(
    async (soundType: SoundType) => {
      // Play preview (skip if 'none')
      if (soundType !== 'none') {
        sound.play(soundType);
      }

      // Save to IndexedDB
      await setSetting('soundPreference', soundType);

      // Update state
      if (selected === undefined) {
        setInternalSelected(soundType);
      }

      // Call callback if provided
      onSelect?.(soundType);
    },
    [sound, selected, onSelect]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        padding: 'var(--space-md)',
        gap: 'var(--space-sm)',
      }}
      role="group"
      aria-label="Выбор звука таймера"
    >
      {/* Label */}
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-sm)',
          fontWeight: 'var(--font-weight-normal)',
          fontFamily: 'var(--font-family)',
          marginBottom: 'var(--space-xs)',
        }}
      >
        Звук завершения
      </div>

      {/* Sound option buttons in a row */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: 'var(--space-sm)',
          flexWrap: 'wrap',
        }}
      >
        {SOUND_OPTIONS.map((option, index) => (
          <SoundOptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={currentSelected === option.value}
            onClick={handleSelect}
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

export type { SoundSelectorProps };
