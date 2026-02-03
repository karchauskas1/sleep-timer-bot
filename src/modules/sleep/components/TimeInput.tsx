/**
 * TimeInput - Scroll/drag time selection component for the sleep calculator
 *
 * Features:
 * - Large digits (36-48px) for easy reading
 * - 5-minute increments for minutes
 * - Touch drag and mouse wheel support
 * - Haptic feedback on each step change
 * - Smooth scroll snapping animation
 *
 * Design philosophy: "silence through minimalism" - no labels, no explanations,
 * just clear time display that responds to touch.
 */

import { useRef, useCallback, useEffect, useState, useMemo, memo } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useTelegramContext } from '@/app/providers/TelegramProvider';

// =============================================================================
// Types
// =============================================================================

interface TimeInputProps {
  /** Current time value */
  value: Date;
  /** Called when time changes */
  onChange: (time: Date) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

interface WheelColumnProps {
  /** Array of values to display */
  values: number[];
  /** Currently selected value */
  selectedValue: number;
  /** Called when value changes */
  onValueChange: (value: number) => void;
  /** Format function for display */
  formatValue: (value: number) => string;
  /** Whether this column is disabled */
  disabled?: boolean;
  /** Aria label for accessibility */
  ariaLabel: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Height of each item in the scroll wheel */
const ITEM_HEIGHT = 56;

/** Number of items visible above and below selected */
const VISIBLE_ITEMS = 2;

/** Total visible height of the wheel */
const WHEEL_HEIGHT = ITEM_HEIGHT * (VISIBLE_ITEMS * 2 + 1);

/** Hours array 0-23 */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Minutes array in 5-minute steps: 0, 5, 10, ... 55 */
const MINUTES_5_STEP = Array.from({ length: 12 }, (_, i) => i * 5);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format hour with leading zero
 */
function formatHour(hour: number): string {
  return hour.toString().padStart(2, '0');
}

/**
 * Format minute with leading zero
 */
function formatMinute(minute: number): string {
  return minute.toString().padStart(2, '0');
}

/**
 * Round minutes to nearest 5
 */
function roundToNearest5(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

/**
 * Get the nearest valid minute value (0, 5, 10, ... 55)
 */
function getNearestValidMinute(minutes: number): number {
  const rounded = roundToNearest5(minutes);
  return Math.min(55, Math.max(0, rounded));
}

// =============================================================================
// WheelColumn Component
// =============================================================================

/**
 * Single scroll wheel column for hour or minute selection
 */
const WheelColumn = memo(function WheelColumn({
  values,
  selectedValue,
  onValueChange,
  formatValue,
  disabled = false,
  ariaLabel,
}: WheelColumnProps) {
  const haptic = useHaptic();
  const { disableVerticalSwipes, enableVerticalSwipes } = useTelegramContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const lastValueRef = useRef(selectedValue);
  const isDraggingRef = useRef(false);

  // Track if touch is active (for cleanup purposes)
  const isTouchActiveRef = useRef(false);

  // Calculate initial offset based on selected value
  const selectedIndex = values.indexOf(selectedValue);
  const initialOffset = -selectedIndex * ITEM_HEIGHT;

  // Track if we've initialized
  const hasInitialized = useRef(false);

  // Set initial position
  useEffect(() => {
    if (!hasInitialized.current) {
      y.set(initialOffset);
      hasInitialized.current = true;
    }
  }, [initialOffset, y]);

  // Update position when selected value changes externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      const newIndex = values.indexOf(selectedValue);
      const newOffset = -newIndex * ITEM_HEIGHT;
      if (Math.abs(y.get() - newOffset) > 1) {
        animate(y, newOffset, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
      }
    }
    lastValueRef.current = selectedValue;
  }, [selectedValue, values, y]);

  // Calculate which value is currently "selected" based on scroll position
  const snapToValue = useCallback(() => {
    const currentY = y.get();
    const index = Math.round(-currentY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
    const targetY = -clampedIndex * ITEM_HEIGHT;

    // Animate to snapped position
    animate(y, targetY, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });

    // Notify if value changed
    const newValue = values[clampedIndex];
    if (newValue !== lastValueRef.current) {
      haptic.selectionChanged();
      onValueChange(newValue);
      lastValueRef.current = newValue;
    }
  }, [y, values, onValueChange, haptic]);

  // Handle drag
  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Calculate current index while dragging
      const currentY = y.get();
      const index = Math.round(-currentY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
      const currentValue = values[clampedIndex];

      // Trigger haptic when crossing a value boundary
      if (currentValue !== lastValueRef.current) {
        haptic.selectionChanged();
        lastValueRef.current = currentValue;
      }
    },
    [y, values, haptic]
  );

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      isDraggingRef.current = false;

      // Add velocity-based momentum
      const velocity = info.velocity.y;
      const currentY = y.get();
      const projectedY = currentY + velocity * 0.2;

      // Calculate target index with momentum
      const targetIndex = Math.round(-projectedY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, targetIndex));
      const targetY = -clampedIndex * ITEM_HEIGHT;

      animate(y, targetY, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });

      const newValue = values[clampedIndex];
      if (newValue !== lastValueRef.current) {
        haptic.selectionChanged();
        onValueChange(newValue);
        lastValueRef.current = newValue;
      }
    },
    [y, values, onValueChange, haptic]
  );

  // Handle wheel events
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;

      e.preventDefault();

      // Calculate scroll direction and amount
      const delta = e.deltaY > 0 ? 1 : -1;
      const currentIndex = values.indexOf(lastValueRef.current);
      const newIndex = Math.max(0, Math.min(values.length - 1, currentIndex + delta));

      if (newIndex !== currentIndex) {
        const newValue = values[newIndex];
        const targetY = -newIndex * ITEM_HEIGHT;

        animate(y, targetY, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });

        haptic.selectionChanged();
        onValueChange(newValue);
        lastValueRef.current = newValue;
      }
    },
    [disabled, values, y, onValueChange, haptic]
  );

  // ==========================================================================
  // Touch Event Handlers - Telegram Swipe Control Integration
  // ==========================================================================

  /**
   * Handle touch start - disable Telegram's swipe-to-close while interacting
   * This prevents the app from closing when scrolling the time wheel
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      // Prevent event from bubbling to Telegram WebApp
      e.stopPropagation();

      // Mark touch as active
      isTouchActiveRef.current = true;

      // Disable Telegram's swipe-to-close while interacting with wheel
      disableVerticalSwipes();
    },
    [disabled, disableVerticalSwipes]
  );

  /**
   * Handle touch move - prevent propagation to avoid Telegram gestures
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      // Prevent event from bubbling to Telegram WebApp
      e.stopPropagation();
    },
    [disabled]
  );

  /**
   * Handle touch end - re-enable Telegram swipes after interaction
   */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Prevent event from bubbling
      e.stopPropagation();

      // Mark touch as inactive
      isTouchActiveRef.current = false;

      // Re-enable Telegram swipes after interaction
      enableVerticalSwipes();
    },
    [enableVerticalSwipes]
  );

  /**
   * Handle touch cancel - cleanup on interrupted touch (e.g., phone call)
   */
  const handleTouchCancel = useCallback(
    (e: React.TouchEvent) => {
      // Prevent event from bubbling
      e.stopPropagation();

      // Mark touch as inactive
      isTouchActiveRef.current = false;

      // Re-enable Telegram swipes on cancel
      enableVerticalSwipes();
    },
    [enableVerticalSwipes]
  );

  // Cleanup effect: ensure swipes are re-enabled when component unmounts
  // or when user navigates away while touching
  useEffect(() => {
    return () => {
      // If touch was active when unmounting, re-enable swipes
      if (isTouchActiveRef.current) {
        enableVerticalSwipes();
      }
    };
  }, [enableVerticalSwipes]);

  // Calculate drag constraints
  const maxY = 0;
  const minY = -(values.length - 1) * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{
        height: WHEEL_HEIGHT,
        // Prevent browser's default touch behaviors to avoid gesture conflicts
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      role="listbox"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none rounded-lg"
        style={{
          top: VISIBLE_ITEMS * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
          backgroundColor: 'var(--color-surface-hover)',
        }}
      />

      {/* Gradient overlays for fade effect */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{
          height: VISIBLE_ITEMS * ITEM_HEIGHT,
          background: 'linear-gradient(to bottom, var(--color-bg), transparent)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{
          height: VISIBLE_ITEMS * ITEM_HEIGHT,
          background: 'linear-gradient(to top, var(--color-bg), transparent)',
        }}
      />

      {/* Scrollable content */}
      <motion.div
        style={{
          y,
          paddingTop: VISIBLE_ITEMS * ITEM_HEIGHT,
          paddingBottom: VISIBLE_ITEMS * ITEM_HEIGHT,
        }}
        drag={disabled ? false : 'y'}
        dragConstraints={{ top: minY, bottom: maxY }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={disabled ? 'opacity-50' : 'cursor-grab active:cursor-grabbing'}
      >
        {values.map((value, index) => {
          const isSelected = value === selectedValue;
          return (
            <WheelItem
              key={value}
              value={value}
              formatValue={formatValue}
              isSelected={isSelected}
              itemHeight={ITEM_HEIGHT}
              y={y}
              index={index}
            />
          );
        })}
      </motion.div>
    </div>
  );
});

// =============================================================================
// WheelItem Component
// =============================================================================

interface WheelItemProps {
  value: number;
  formatValue: (value: number) => string;
  isSelected: boolean;
  itemHeight: number;
  y: ReturnType<typeof useMotionValue<number>>;
  index: number;
}

const WheelItem = memo(function WheelItem({
  value,
  formatValue,
  isSelected,
  itemHeight,
  y,
  index,
}: WheelItemProps) {
  // Calculate opacity and scale based on distance from center
  const itemOffset = index * itemHeight;

  const opacity = useTransform(y, (latestY) => {
    const distance = Math.abs(latestY + itemOffset) / itemHeight;
    return Math.max(0.3, 1 - distance * 0.25);
  });

  const scale = useTransform(y, (latestY) => {
    const distance = Math.abs(latestY + itemOffset) / itemHeight;
    return Math.max(0.85, 1 - distance * 0.05);
  });

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{
        height: itemHeight,
        opacity,
        scale,
      }}
      role="option"
      aria-selected={isSelected}
    >
      <span
        className="font-semibold tabular-nums"
        style={{
          fontSize: 'var(--font-2xl)',
          lineHeight: 'var(--line-height-none)',
          color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-family)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}
      >
        {formatValue(value)}
      </span>
    </motion.div>
  );
});

// =============================================================================
// TimeInput Component
// =============================================================================

/**
 * Time input with scroll/drag wheels for hours and minutes
 *
 * @example
 * // Basic usage
 * const [time, setTime] = useState(new Date());
 *
 * <TimeInput
 *   value={time}
 *   onChange={setTime}
 * />
 *
 * @example
 * // With sleep calculator
 * const [wakeTime, setWakeTime] = useState(new Date());
 * const sleepOptions = calculateSleepOptions('waketime', wakeTime);
 *
 * <TimeInput
 *   value={wakeTime}
 *   onChange={setWakeTime}
 * />
 */
export function TimeInput({
  value,
  onChange,
  disabled = false,
  className = '',
}: TimeInputProps) {
  // Extract hours and minutes from value
  const currentHour = value.getHours();
  const currentMinute = getNearestValidMinute(value.getMinutes());

  // Handle hour change
  const handleHourChange = useCallback(
    (hour: number) => {
      const newTime = new Date(value);
      newTime.setHours(hour);
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      onChange(newTime);
    },
    [value, onChange]
  );

  // Handle minute change
  const handleMinuteChange = useCallback(
    (minute: number) => {
      const newTime = new Date(value);
      newTime.setMinutes(minute);
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      onChange(newTime);
    },
    [value, onChange]
  );

  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="group"
      aria-label="Выбор времени"
    >
      {/* Hours wheel */}
      <div className="w-20">
        <WheelColumn
          values={HOURS}
          selectedValue={currentHour}
          onValueChange={handleHourChange}
          formatValue={formatHour}
          disabled={disabled}
          ariaLabel="Часы"
        />
      </div>

      {/* Separator */}
      <div
        className="flex flex-col items-center justify-center self-center"
        style={{ height: WHEEL_HEIGHT }}
        aria-hidden="true"
      >
        <span
          className="font-bold"
          style={{
            fontSize: 'var(--font-2xl)',
            lineHeight: 'var(--line-height-none)',
            color: 'var(--color-text-primary)',
          }}
        >
          :
        </span>
      </div>

      {/* Minutes wheel */}
      <div className="w-20">
        <WheelColumn
          values={MINUTES_5_STEP}
          selectedValue={currentMinute}
          onValueChange={handleMinuteChange}
          formatValue={formatMinute}
          disabled={disabled}
          ariaLabel="Минуты"
        />
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { TimeInputProps };
