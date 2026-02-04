/**
 * MonthCalendar - Full month calendar for distant date selection
 *
 * Provides a month grid calendar for selecting dates further in the future.
 * Displayed as a bottom sheet modal, similar to DatePicker.
 *
 * Features:
 * - Month grid with week rows (7 columns)
 * - Week starts on Monday
 * - Month/year header with prev/next navigation
 * - Days with tasks have indicator dots
 * - Selected day highlighted
 * - Today visually distinct
 * - Past days shown but dimmed
 *
 * Design principles:
 * - Silence through minimalism - clean calendar layout
 * - Quick selection - tap any day to select
 * - Calm surface - muted colors, no bright accents
 *
 * @example
 * // Basic usage for selecting a distant date
 * const [showCalendar, setShowCalendar] = useState(false);
 *
 * const handleDateSelect = (date: string) => {
 *   setSelectedDate(date);
 *   setShowCalendar(false);
 * };
 *
 * <MonthCalendar
 *   isOpen={showCalendar}
 *   onClose={() => setShowCalendar(false)}
 *   onSelect={handleDateSelect}
 *   selectedDate={selectedDate}
 * />
 */

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';

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
 * Backdrop animation variants
 */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Sheet animation variants
 */
const sheetVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

/**
 * Day names in Russian (abbreviated), starting from Monday
 */
const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the MonthCalendar component
 */
interface MonthCalendarProps {
  /** Whether the calendar is open */
  isOpen: boolean;
  /** Callback when the calendar should close */
  onClose: () => void;
  /** Callback when a date is selected */
  onSelect: (date: string) => void;
  /** Currently selected date (YYYY-MM-DD format) */
  selectedDate?: string;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

/**
 * Calendar day structure
 */
interface CalendarDay {
  /** Date object */
  date: Date;
  /** Date string in YYYY-MM-DD format */
  dateString: string;
  /** Whether this day is in the current displayed month */
  isCurrentMonth: boolean;
  /** Whether this day is today */
  isToday: boolean;
  /** Whether this day is selected */
  isSelected: boolean;
  /** Whether this day is in the past */
  isPast: boolean;
  /** Whether this day is a weekend (Sat/Sun) */
  isWeekend: boolean;
  /** Whether this day has tasks */
  hasTasks: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate calendar days for a given month
 * Includes days from previous/next months to fill complete weeks
 */
function generateCalendarDays(
  displayMonth: Date,
  selectedDateString: string | undefined,
  tasksDateSet: Set<string>
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  // Week starts on Monday (weekStartsOn: 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  let currentDate = calendarStart;

  while (currentDate <= calendarEnd) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();
    // Weekend: Saturday (6) or Sunday (0)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    days.push({
      date: currentDate,
      dateString,
      isCurrentMonth: isSameMonth(currentDate, displayMonth),
      isToday: isToday(currentDate),
      isSelected: selectedDateString === dateString,
      isPast: isBefore(currentDate, today),
      isWeekend,
      hasTasks: tasksDateSet.has(dateString),
    });

    currentDate = addDays(currentDate, 1);
  }

  return days;
}

/**
 * Format month and year for header display
 */
function formatMonthYear(date: Date): string {
  return format(date, 'LLLL yyyy', { locale: ru });
}

// =============================================================================
// Component
// =============================================================================

/**
 * MonthCalendar component for selecting dates from a full month view
 *
 * Renders as a bottom sheet with a month grid calendar.
 * Uses Framer Motion for smooth animations.
 *
 * @param props - Component props
 */
export function MonthCalendar({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
  className = '',
  testId,
}: MonthCalendarProps) {
  const haptic = useHaptic();
  const tasks = usePlannerStore((state) => state.tasks);

  // State for the currently displayed month
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  // Create a set of dates that have tasks for quick lookup
  const tasksDateSet = useMemo(() => {
    const dateSet = new Set<string>();
    tasks.forEach((task) => {
      if (!task.completed) {
        dateSet.add(task.date);
      }
    });
    return dateSet;
  }, [tasks]);

  // Generate calendar days for the current display month
  const calendarDays = useMemo(
    () => generateCalendarDays(displayMonth, selectedDate, tasksDateSet),
    [displayMonth, selectedDate, tasksDateSet]
  );

  // Split days into weeks for rendering
  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback(() => {
    haptic.light();
    onClose();
  }, [haptic, onClose]);

  /**
   * Handle day selection
   */
  const handleSelectDay = useCallback(
    (day: CalendarDay) => {
      haptic.light();
      onSelect(day.dateString);
    },
    [haptic, onSelect]
  );

  /**
   * Handle previous month navigation
   */
  const handlePrevMonth = useCallback(() => {
    haptic.selectionChanged();
    setDisplayMonth((prev) => subMonths(prev, 1));
  }, [haptic]);

  /**
   * Handle next month navigation
   */
  const handleNextMonth = useCallback(() => {
    haptic.selectionChanged();
    setDisplayMonth((prev) => addMonths(prev, 1));
  }, [haptic]);

  /**
   * Prevent click propagation from sheet content
   */
  const handleSheetClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  /**
   * Reset display month when calendar opens
   */
  const handleAnimationStart = useCallback(() => {
    if (isOpen) {
      setDisplayMonth(selectedDate ? new Date(selectedDate) : new Date());
    }
  }, [isOpen, selectedDate]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 ${className}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onAnimationStart={handleAnimationStart}
          data-testid={testId}
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            transition={ANIMATION_CONFIG}
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            }}
            onClick={handleBackdropClick}
            aria-label="Закрыть календарь"
          />

          {/* Bottom Sheet */}
          <motion.div
            variants={sheetVariants}
            transition={ANIMATION_CONFIG}
            className="absolute bottom-0 left-0 right-0"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              maxHeight: '85vh',
              overflow: 'hidden',
            }}
            onClick={handleSheetClick}
            role="dialog"
            aria-modal="true"
            aria-label="Выбор даты"
          >
            {/* Handle indicator */}
            <div
              className="flex justify-center"
              style={{ padding: 'var(--space-sm) 0' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '4px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '2px',
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                padding: '0 var(--space-md) var(--space-lg)',
                overflowY: 'auto',
                maxHeight: 'calc(85vh - 32px)',
              }}
            >
              {/* Month Navigation Header */}
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 'var(--space-md)' }}
              >
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: 'var(--space-sm)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'var(--transition-colors)',
                    lineHeight: 1,
                  }}
                  aria-label="Предыдущий месяц"
                >
                  ←
                </button>

                <span
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {formatMonthYear(displayMonth)}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: 'var(--space-sm)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'var(--transition-colors)',
                    lineHeight: 1,
                  }}
                  aria-label="Следующий месяц"
                >
                  →
                </button>
              </div>

              {/* Weekday Headers */}
              <div
                className="grid grid-cols-7"
                style={{ marginBottom: 'var(--space-xs)' }}
              >
                {WEEKDAY_NAMES.map((dayName, index) => {
                  // Weekend days are at indices 5 (Сб) and 6 (Вс)
                  const isWeekend = index === 5 || index === 6;
                  return (
                    <div
                      key={dayName}
                      className="text-center"
                      style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: isWeekend
                          ? 'var(--color-error)'
                          : 'var(--color-text-muted)',
                        padding: 'var(--space-xs) 0',
                      }}
                    >
                      {dayName}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Grid */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="grid grid-cols-7"
                    style={{ gap: '2px' }}
                  >
                    {week.map((day) => {
                      // Determine styles based on day state
                      let backgroundColor = 'transparent';
                      let textColor = 'var(--color-text-primary)';
                      let fontWeight = 'var(--font-weight-normal)';
                      let opacity = 1;

                      if (day.isSelected) {
                        backgroundColor = 'var(--color-accent)';
                        textColor = 'var(--color-text-inverse)';
                        fontWeight = 'var(--font-weight-semibold)';
                      } else if (day.isToday) {
                        backgroundColor = 'var(--color-border-thin)';
                        fontWeight = 'var(--font-weight-semibold)';
                      }

                      if (!day.isCurrentMonth) {
                        opacity = 0.3;
                      } else if (day.isPast && !day.isToday) {
                        opacity = 0.5;
                      }

                      if (day.isWeekend && !day.isSelected) {
                        textColor = 'var(--color-error)';
                      }

                      return (
                        <button
                          key={day.dateString}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          style={{
                            fontFamily: 'var(--font-family)',
                            fontSize: 'var(--font-sm)',
                            fontWeight,
                            color: textColor,
                            backgroundColor,
                            border: 'none',
                            padding: 'var(--space-sm) 0',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'var(--transition-colors)',
                            opacity,
                            position: 'relative',
                            minHeight: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          aria-label={format(day.date, 'd MMMM yyyy', {
                            locale: ru,
                          })}
                          aria-selected={day.isSelected}
                          aria-current={day.isToday ? 'date' : undefined}
                        >
                          <span>{format(day.date, 'd')}</span>
                          {/* Task indicator dot */}
                          {day.hasTasks && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: day.isSelected
                                  ? 'var(--color-text-inverse)'
                                  : 'var(--color-accent)',
                              }}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Cancel button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: 'var(--space-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-colors)',
                }}
                aria-label="Отмена"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { MonthCalendarProps, CalendarDay };
