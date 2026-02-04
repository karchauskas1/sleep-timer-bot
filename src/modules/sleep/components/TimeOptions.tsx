/**
 * TimeOptions - Display component for calculated sleep/wake time options
 *
 * Shows 3-5 time options with their corresponding sleep cycle counts.
 * No recommendations, no moralizing - just the facts in a calm visual presentation.
 *
 * Design philosophy: "silence through minimalism" - each option is displayed
 * as time + cycle count, letting users make their own decisions.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { SleepOption, SleepMode } from '@/types';
import { formatSleepDuration } from '../utils/sleepCalculator';

// =============================================================================
// Types
// =============================================================================

interface TimeOptionsProps {
  /** Array of calculated sleep options to display */
  options: SleepOption[];
  /** Current mode for labeling purposes (bedtime shows wake times, waketime shows sleep times) */
  mode: SleepMode;
  /** Optional callback when an option is tapped */
  onSelect?: (option: SleepOption) => void;
  /** Additional class names */
  className?: string;
}

interface TimeOptionItemProps {
  option: SleepOption;
  index: number;
  onSelect?: (option: SleepOption) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format time for display (HH:mm)
 */
function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Get Russian plural form for cycles
 * 1 цикл, 2-4 цикла, 5+ циклов
 */
function getCycleText(cycles: number): string {
  const lastDigit = cycles % 10;
  const lastTwoDigits = cycles % 100;

  // Special cases for 11-14 (always use "циклов")
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${cycles} циклов`;
  }

  // Standard Russian plural rules
  if (lastDigit === 1) {
    return `${cycles} цикл`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${cycles} цикла`;
  }
  return `${cycles} циклов`;
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
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
    y: -10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// =============================================================================
// TimeOptionItem Component
// =============================================================================

/**
 * Individual time option row
 */
const TimeOptionItem = memo(function TimeOptionItem({
  option,
  index,
  onSelect,
}: TimeOptionItemProps) {
  const isClickable = typeof onSelect === 'function';
  const timeString = formatTime(option.time);
  const cycleText = getCycleText(option.cycles);
  const durationText = formatSleepDuration(option.cycles);

  const handleClick = () => {
    if (onSelect) {
      onSelect(option);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={isClickable ? { scale: 1.01 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={`
        flex items-center justify-between
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      style={{
        padding: 'var(--space-card-y) var(--space-card-x)',
        backgroundColor: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-thin)',
        boxShadow: 'var(--shadow-card)',
        transition: `
          background-color var(--duration-fast) var(--ease-out),
          box-shadow var(--duration-base) var(--ease-out),
          transform var(--duration-fast) var(--ease-out),
          border-color var(--duration-fast) var(--ease-out)
        `,
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-card)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.borderColor = 'var(--color-border-thin)';
        }
      }}
      onFocus={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--color-border-focus)';
          e.currentTarget.style.outline = 'none';
        }
      }}
      onBlur={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-card)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.borderColor = 'var(--color-border-thin)';
        }
      }}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : -1}
      role={isClickable ? 'button' : 'listitem'}
      aria-label={`${timeString}, ${cycleText}, ${durationText}`}
    >
      {/* Time display */}
      <span
        className="font-semibold tabular-nums"
        style={{
          fontSize: 'var(--font-xl)',
          lineHeight: 'var(--line-height-tight)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}
      >
        {timeString}
      </span>

      {/* Cycle and duration info */}
      <div className="flex items-center gap-2">
        {/* Cycle count */}
        <span
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {cycleText}
        </span>

        {/* Separator dot */}
        <span
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
          }}
          aria-hidden="true"
        >
          ·
        </span>

        {/* Duration */}
        <span
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {durationText}
        </span>
      </div>
    </motion.div>
  );
});

// =============================================================================
// TimeOptions Component
// =============================================================================

/**
 * Display calculated sleep/wake time options
 *
 * @example
 * // Basic usage with bedtime mode (shows wake times)
 * const bedTime = new Date();
 * const options = calculateSleepOptions('bedtime', bedTime);
 *
 * <TimeOptions
 *   options={options}
 *   mode="bedtime"
 * />
 *
 * @example
 * // With selection callback
 * <TimeOptions
 *   options={options}
 *   mode="waketime"
 *   onSelect={(option) => console.log('Selected:', option.time)}
 * />
 */
export function TimeOptions({
  options,
  mode,
  onSelect,
  className = '',
}: TimeOptionsProps) {
  // Determine heading based on mode
  const heading = mode === 'bedtime' ? 'Проснуться в' : 'Лечь спать в';

  // Handle empty state
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Section heading */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="mb-3 text-center"
        style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--color-text-secondary)',
          letterSpacing: 'var(--letter-spacing-wide)',
        }}
      >
        {heading}
      </motion.p>

      {/* Options list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`options-${options.map((o) => o.cycles).join('-')}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="flex flex-col"
          style={{ gap: 'var(--space-list-gap)' }}
          role="list"
          aria-label={heading}
        >
          {options.map((option, index) => (
            <TimeOptionItem
              key={`${option.cycles}-${option.time.getTime()}`}
              option={option}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { TimeOptionsProps };
