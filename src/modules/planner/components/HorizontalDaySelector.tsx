/**
 * HorizontalDaySelector - Horizontal scrollable day strip for date navigation
 *
 * Displays 7 days centered on the selected date, allowing users to:
 * - Quickly navigate between days via tapping or swiping
 * - See today highlighted with a distinct visual indicator
 * - View weekends with different styling (muted color)
 * - Tap month label to open full month calendar
 *
 * Design principles:
 * - Silence through minimalism - compact day cells with essential info
 * - Quick navigation - instant day selection with haptic feedback
 * - Calm surface - muted colors, subtle indicators
 *
 * @example
 * // Basic usage with store integration
 * const selectedDate = usePlannerStore((state) => state.selectedDate);
 * const setSelectedDate = usePlannerStore((state) => state.setSelectedDate);
 *
 * <HorizontalDaySelector
 *   selectedDate={selectedDate}
 *   onSelectDate={setSelectedDate}
 * />
 *
 * @example
 * // With month calendar trigger
 * <HorizontalDaySelector
 *   selectedDate={selectedDate}
 *   onSelectDate={setSelectedDate}
 *   onMonthLabelClick={() => setCalendarOpen(true)}
 * />
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isToday, isSameDay, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for UI elements
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Number of days to show in the selector (should be odd for center alignment)
 */
const VISIBLE_DAYS = 7;

/**
 * Day names in Russian (abbreviated)
 */
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

/**
 * Weekend day indices (0 = Sunday, 6 = Saturday)
 */
const WEEKEND_DAYS = [0, 6] as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the HorizontalDaySelector component
 */
interface HorizontalDaySelectorProps {
  /** Currently selected date in YYYY-MM-DD format */
  selectedDate: string;
  /** Callback when a date is selected */
  onSelectDate: (date: string) => void;
  /** Callback when month label is clicked (to open calendar) */
  onMonthLabelClick?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

/**
 * Day cell data structure
 */
interface DayCell {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day number (1-31) */
  dayNumber: number;
  /** Abbreviated day name (e.g., "Пн") */
  dayName: string;
  /** Whether this is today */
  isToday: boolean;
  /** Whether this is a weekend day */
  isWeekend: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate array of day cells centered on the selected date
 */
function generateDayCells(centerDate: string, count: number): DayCell[] {
  const cells: DayCell[] = [];
  const center = new Date(centerDate);
  const offset = Math.floor(count / 2);

  for (let i = -offset; i <= offset; i++) {
    const date = addDays(center, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    cells.push({
      date: dateStr,
      dayNumber: date.getDate(),
      dayName: DAY_NAMES[dayOfWeek],
      isToday: isToday(date),
      isWeekend: WEEKEND_DAYS.includes(dayOfWeek as 0 | 6),
    });
  }

  return cells;
}

/**
 * Format month label for display
 */
function formatMonthLabel(date: string): string {
  const dateObj = new Date(date);
  return format(dateObj, 'LLLL', { locale: ru });
}

/**
 * Get relative date description
 */
function getRelativeDateLabel(date: string): string {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Завтра';
  if (diffDays === -1) return 'Вчера';

  if (diffDays > 0) {
    const dayName = format(dateObj, 'EEEE', { locale: ru });
    return `Через ${diffDays} ${getDaysWord(diffDays)}, ${dayName}`;
  } else {
    const dayName = format(dateObj, 'EEEE', { locale: ru });
    return `${Math.abs(diffDays)} ${getDaysWord(Math.abs(diffDays))} назад, ${dayName}`;
  }
}

/**
 * Get correct Russian word form for days
 */
function getDaysWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'дней';
  if (lastOne === 1) return 'день';
  if (lastOne >= 2 && lastOne <= 4) return 'дня';
  return 'дней';
}

// =============================================================================
// Component
// =============================================================================

/**
 * HorizontalDaySelector component for navigating between days
 *
 * Renders a horizontal strip of day cells with scroll capability.
 * The selected day is centered, today is highlighted.
 *
 * @param props - Component props
 */
export function HorizontalDaySelector({
  selectedDate,
  onSelectDate,
  onMonthLabelClick,
  className = '',
  testId,
}: HorizontalDaySelectorProps) {
  const haptic = useHaptic();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate day cells centered on selected date
  const dayCells = useMemo(
    () => generateDayCells(selectedDate, VISIBLE_DAYS),
    [selectedDate]
  );

  // Month label for the selected date
  const monthLabel = useMemo(
    () => formatMonthLabel(selectedDate),
    [selectedDate]
  );

  // Relative date description
  const relativeDateLabel = useMemo(
    () => getRelativeDateLabel(selectedDate),
    [selectedDate]
  );

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle day cell click
   */
  const handleDayClick = useCallback(
    (date: string) => {
      if (date !== selectedDate) {
        haptic.light();
        onSelectDate(date);
      }
    },
    [selectedDate, onSelectDate, haptic]
  );

  /**
   * Handle month label click
   */
  const handleMonthLabelClick = useCallback(() => {
    haptic.light();
    onMonthLabelClick?.();
  }, [haptic, onMonthLabelClick]);

  /**
   * Navigate to previous week
   */
  const handlePreviousWeek = useCallback(() => {
    const newDate = format(addDays(new Date(selectedDate), -7), 'yyyy-MM-dd');
    haptic.light();
    onSelectDate(newDate);
  }, [selectedDate, onSelectDate, haptic]);

  /**
   * Navigate to next week
   */
  const handleNextWeek = useCallback(() => {
    const newDate = format(addDays(new Date(selectedDate), 7), 'yyyy-MM-dd');
    haptic.light();
    onSelectDate(newDate);
  }, [selectedDate, onSelectDate, haptic]);

  /**
   * Handle horizontal scroll to navigate days
   */
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      // Only handle horizontal scroll
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        const direction = event.deltaX > 0 ? 1 : -1;
        const newDate = format(
          addDays(new Date(selectedDate), direction),
          'yyyy-MM-dd'
        );
        haptic.selectionChanged();
        onSelectDate(newDate);
      }
    },
    [selectedDate, onSelectDate, haptic]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={className}
      data-testid={testId}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border-thin)',
      }}
    >
      {/* Day strip container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-sm) var(--space-xs)',
          gap: 'var(--space-xs)',
        }}
      >
        {/* Navigation arrow - previous */}
        <button
          type="button"
          onClick={handlePreviousWeek}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
          aria-label="Предыдущая неделя"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>

        {/* Day cells */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {dayCells.map((cell) => {
            const isSelected = cell.date === selectedDate;

            return (
              <motion.button
                key={cell.date}
                type="button"
                onClick={() => handleDayClick(cell.date)}
                whileTap={{ scale: 0.95 }}
                transition={ANIMATION_CONFIG}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  height: '56px',
                  padding: 'var(--space-xs)',
                  backgroundColor: isSelected
                    ? 'var(--color-accent)'
                    : 'transparent',
                  border: cell.isToday && !isSelected
                    ? '1px solid var(--color-accent)'
                    : 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition-colors)',
                }}
                aria-label={`${cell.dayNumber} ${cell.dayName}${cell.isToday ? ', сегодня' : ''}`}
                aria-pressed={isSelected}
              >
                {/* Day number */}
                <span
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-base)',
                    fontWeight: isSelected || cell.isToday
                      ? 'var(--font-weight-semibold)'
                      : 'var(--font-weight-normal)',
                    color: isSelected
                      ? 'var(--color-text-inverse)'
                      : cell.isWeekend
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {cell.dayNumber}
                </span>

                {/* Day name */}
                <span
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: isSelected
                      ? 'var(--color-text-inverse)'
                      : cell.isWeekend
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text-secondary)',
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {cell.dayName}
                </span>

                {/* Today indicator dot (when not selected) */}
                {cell.isToday && !isSelected && (
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: '50%',
                      marginTop: '2px',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Navigation arrow - next */}
        <button
          type="button"
          onClick={handleNextWeek}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
          aria-label="Следующая неделя"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4L10 8L6 12" />
          </svg>
        </button>
      </div>

      {/* Month label and relative date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 var(--space-md) var(--space-sm)',
          gap: 'var(--space-sm)',
        }}
      >
        {/* Month label (clickable to open calendar) */}
        <button
          type="button"
          onClick={handleMonthLabelClick}
          disabled={!onMonthLabelClick}
          style={{
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: onMonthLabelClick ? 'pointer' : 'default',
            textTransform: 'capitalize',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
          aria-label={onMonthLabelClick ? 'Открыть календарь' : undefined}
        >
          {monthLabel}
          {onMonthLabelClick && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6L8 10L12 6" />
            </svg>
          )}
        </button>

        {/* Separator */}
        <span
          style={{
            width: '1px',
            height: '12px',
            backgroundColor: 'var(--color-border)',
          }}
        />

        {/* Relative date label */}
        <span
          style={{
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-xs)',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--color-text-muted)',
          }}
        >
          {relativeDateLabel}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { HorizontalDaySelectorProps, DayCell };
