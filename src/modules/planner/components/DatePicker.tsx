/**
 * DatePicker - Date selection component for postponing tasks
 *
 * Provides a compact interface for selecting a new date for a task:
 * - Tomorrow (quick option)
 * - Specific day options (next few days)
 * - Custom date input
 *
 * Used primarily for the postpone action when swiping right on a task.
 * Appears as a modal/sheet that overlays the content.
 *
 * Design principles:
 * - Silence through minimalism - no labels or explanations
 * - Quick selection - most common options readily available
 * - Calm surface - muted colors, no bright accents
 *
 * @example
 * // Basic usage for postponing a task
 * const [showDatePicker, setShowDatePicker] = useState(false);
 * const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
 *
 * const handlePostpone = (taskId: string) => {
 *   setSelectedTaskId(taskId);
 *   setShowDatePicker(true);
 * };
 *
 * const handleDateSelect = (date: string) => {
 *   if (selectedTaskId) {
 *     postponeTask(selectedTaskId, date);
 *   }
 *   setShowDatePicker(false);
 * };
 *
 * <DatePicker
 *   isOpen={showDatePicker}
 *   onClose={() => setShowDatePicker(false)}
 *   onSelect={handleDateSelect}
 * />
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useAnimation,
  type PanInfo,
} from 'framer-motion';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addWeeks,
  isToday,
  isTomorrow,
  isSameMonth,
  isSameDay,
  isBefore,
  eachDayOfInterval,
} from 'date-fns';
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
 * Swipe threshold for month navigation (in pixels)
 * Prevents accidental triggers with minimum distance requirement
 */
const MONTH_SWIPE_THRESHOLD = 50;

/**
 * Maximum drag distance for month swipe (prevents over-swiping)
 */
const MONTH_MAX_DRAG = 100;

/**
 * Animation configuration for month swipe transition
 */
const MONTH_SWIPE_ANIMATION = {
  type: 'tween' as const,
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Debounce time to prevent rapid month navigation triggers
 */
const MONTH_DEBOUNCE_MS = 300;

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
 * Day names in Russian (abbreviated) - Sunday first (for general use)
 */
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

/**
 * Day names for calendar header (Monday first - European style)
 */
const CALENDAR_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the DatePicker component
 */
interface DatePickerProps {
  /** Whether the date picker is open */
  isOpen: boolean;
  /** Callback when the date picker should close */
  onClose: () => void;
  /** Callback when a date is selected */
  onSelect: (date: string) => void;
  /** Current date of the task being postponed (for reference) */
  currentDate?: string;
  /** Minimum selectable date (defaults to tomorrow) */
  minDate?: string;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

/**
 * Date option structure for quick selections
 */
interface DateOption {
  /** Display label */
  label: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Optional sublabel (e.g., day of week) */
  sublabel?: string;
}

/**
 * Calendar day structure for grid rendering
 */
interface CalendarDay {
  /** The date object */
  date: Date;
  /** Date in YYYY-MM-DD format */
  dateStr: string;
  /** Day of month (1-31) */
  day: number;
  /** Whether this day is in the currently displayed month */
  isCurrentMonth: boolean;
  /** Whether this is today's date */
  isToday: boolean;
  /** Whether this day is before the minimum selectable date */
  isDisabled: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Format date for display
 */
function formatDateLabel(date: string): string {
  const dateObj = new Date(date);
  if (isToday(dateObj)) return 'Сегодня';
  if (isTomorrow(dateObj)) return 'Завтра';
  return format(dateObj, 'd MMM', { locale: ru });
}

/**
 * Get day of week name
 */
function getDayOfWeekName(date: string): string {
  const dateObj = new Date(date);
  return DAY_NAMES[dateObj.getDay()];
}

/**
 * Generate quick date options for the next 7 days
 */
function generateQuickOptions(): DateOption[] {
  const options: DateOption[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    options.push({
      label: i === 1 ? 'Завтра' : formatDateLabel(dateStr),
      date: dateStr,
      sublabel: i === 1 ? getDayOfWeekName(dateStr) : undefined,
    });
  }

  return options;
}

/**
 * Generate "next week" option - start of next week (Monday)
 */
function getNextWeekOption(): DateOption {
  const nextMonday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
  const dateStr = format(nextMonday, 'yyyy-MM-dd');

  return {
    label: 'След. неделя',
    date: dateStr,
    sublabel: format(nextMonday, 'd MMM', { locale: ru }),
  };
}

// =============================================================================
// Calendar Helpers
// =============================================================================

/**
 * Get the calendar grid days for a given month
 * Returns 6 weeks (42 days) to ensure consistent grid height
 * Week starts on Monday (European style)
 *
 * @param displayedMonth - The month to generate calendar for
 * @param minDate - Optional minimum selectable date (YYYY-MM-DD format)
 */
function getCalendarDays(displayedMonth: Date, minDate?: string): CalendarDay[] {
  const monthStart = startOfMonth(displayedMonth);
  const monthEnd = endOfMonth(displayedMonth);

  // Get the start of the week containing the first day of the month (Monday start)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Get the end of the week containing the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Parse minDate for comparison
  const minDateObj = minDate ? new Date(minDate) : null;
  const today = new Date();

  return days.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isDisabled = minDateObj
      ? isBefore(date, minDateObj) && !isSameDay(date, minDateObj)
      : false;

    return {
      date,
      dateStr,
      day: date.getDate(),
      isCurrentMonth: isSameMonth(date, displayedMonth),
      isToday: isSameDay(date, today),
      isDisabled,
    };
  });
}

/**
 * Navigate to the previous month
 */
function getPreviousMonth(currentMonth: Date): Date {
  return subMonths(currentMonth, 1);
}

/**
 * Navigate to the next month
 */
function getNextMonth(currentMonth: Date): Date {
  return addMonths(currentMonth, 1);
}

/**
 * Format month and year for display in Russian
 * Example: "Февраль 2026"
 */
function formatMonthYear(date: Date): string {
  return format(date, 'LLLL yyyy', { locale: ru });
}

/**
 * Check if navigation to previous month should be disabled
 * (when all days in previous month are before minDate)
 */
function canNavigateToPreviousMonth(
  currentMonth: Date,
  minDate?: string
): boolean {
  if (!minDate) return true;

  const previousMonth = getPreviousMonth(currentMonth);
  const previousMonthEnd = endOfMonth(previousMonth);
  const minDateObj = new Date(minDate);

  // Can navigate if the end of previous month is >= minDate
  return !isBefore(previousMonthEnd, minDateObj);
}

// =============================================================================
// Component
// =============================================================================

/**
 * DatePicker component for selecting dates when postponing tasks
 *
 * Renders as a bottom sheet with quick date options and a custom date input.
 * Uses Framer Motion for smooth animations.
 *
 * @param props - Component props
 */
export function DatePicker({
  isOpen,
  onClose,
  onSelect,
  currentDate,
  minDate,
  className = '',
  testId,
}: DatePickerProps) {
  const haptic = useHaptic();

  // -------------------------------------------------------------------------
  // Calendar State
  // -------------------------------------------------------------------------

  /**
   * Currently displayed month in the calendar view
   * Initialized to the current month
   */
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => new Date());

  /**
   * Currently selected date in the calendar
   * null means no date is selected yet
   */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // -------------------------------------------------------------------------
  // Swipe Gesture State
  // -------------------------------------------------------------------------

  /**
   * Motion value for tracking horizontal swipe position
   */
  const calendarX = useMotionValue(0);

  /**
   * Animation controls for calendar swipe transitions
   */
  const calendarControls = useAnimation();

  /**
   * Track last swipe action time for debouncing
   */
  const lastSwipeRef = useRef<number>(0);

  /**
   * Track if haptic has been triggered for current swipe gesture
   */
  const swipeHapticTriggeredRef = useRef<boolean>(false);

  // -------------------------------------------------------------------------
  // Memoized Values
  // -------------------------------------------------------------------------

  // Memoize options to avoid recalculating on each render
  const quickOptions = useMemo(() => generateQuickOptions(), []);
  const nextWeekOption = useMemo(() => getNextWeekOption(), []);

  // Calculate minimum date (default to tomorrow)
  const effectiveMinDate = minDate ?? getTomorrowDate();

  /**
   * Calendar days for the currently displayed month
   * Memoized to avoid recalculating on every render
   */
  const calendarDays = useMemo(
    () => getCalendarDays(displayedMonth, effectiveMinDate),
    [displayedMonth, effectiveMinDate]
  );

  /**
   * Formatted month and year string for header display
   * Example: "Февраль 2026"
   */
  const displayedMonthYear = useMemo(
    () => formatMonthYear(displayedMonth),
    [displayedMonth]
  );

  /**
   * Whether navigation to previous month is allowed
   */
  const canGoPrevious = useMemo(
    () => canNavigateToPreviousMonth(displayedMonth, effectiveMinDate),
    [displayedMonth, effectiveMinDate]
  );

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
   * Handle date option selection
   */
  const handleSelectOption = useCallback(
    (date: string) => {
      haptic.light();
      onSelect(date);
    },
    [haptic, onSelect]
  );

  /**
   * Handle custom date input change
   */
  const handleCustomDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const date = event.target.value;
      if (date && date >= effectiveMinDate) {
        haptic.selectionChanged();
        onSelect(date);
      }
    },
    [haptic, onSelect, effectiveMinDate]
  );

  /**
   * Prevent click propagation from sheet content
   */
  const handleSheetClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  // -------------------------------------------------------------------------
  // Calendar Handlers
  // -------------------------------------------------------------------------

  /**
   * Navigate to previous month
   */
  const handlePreviousMonth = useCallback(() => {
    if (!canGoPrevious) return;
    haptic.light();
    setDisplayedMonth((prev) => getPreviousMonth(prev));
  }, [haptic, canGoPrevious]);

  /**
   * Navigate to next month
   */
  const handleNextMonth = useCallback(() => {
    haptic.light();
    setDisplayedMonth((prev) => getNextMonth(prev));
  }, [haptic]);

  /**
   * Handle calendar day selection
   */
  const handleDaySelect = useCallback(
    (day: CalendarDay) => {
      if (day.isDisabled) return;
      haptic.selectionChanged();
      setSelectedDate(day.date);
    },
    [haptic]
  );

  /**
   * Reset calendar to today's date and clear selection
   */
  const handleReset = useCallback(() => {
    haptic.light();
    setDisplayedMonth(new Date());
    setSelectedDate(null);
  }, [haptic]);

  /**
   * Confirm the selected date and close the picker
   */
  const handleConfirm = useCallback(() => {
    if (!selectedDate) return;
    haptic.light();
    onSelect(format(selectedDate, 'yyyy-MM-dd'));
  }, [haptic, onSelect, selectedDate]);

  /**
   * Check if a date is currently selected
   */
  const isDateSelected = useCallback(
    (date: Date): boolean => {
      if (!selectedDate) return false;
      return isSameDay(date, selectedDate);
    },
    [selectedDate]
  );

  // -------------------------------------------------------------------------
  // Swipe Gesture Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle swipe drag on calendar - trigger haptic when threshold is crossed
   */
  const handleCalendarDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offsetX = info.offset.x;
      const passedThreshold = Math.abs(offsetX) >= MONTH_SWIPE_THRESHOLD;

      // Trigger haptic once when crossing threshold
      if (passedThreshold && !swipeHapticTriggeredRef.current) {
        haptic.light();
        swipeHapticTriggeredRef.current = true;
      } else if (!passedThreshold) {
        swipeHapticTriggeredRef.current = false;
      }
    },
    [haptic]
  );

  /**
   * Handle swipe drag end on calendar - navigate to previous/next month
   */
  const handleCalendarDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offsetX = info.offset.x;
      const now = Date.now();

      // Reset haptic trigger tracking
      swipeHapticTriggeredRef.current = false;

      // Check debounce
      if (now - lastSwipeRef.current < MONTH_DEBOUNCE_MS) {
        await calendarControls.start({ x: 0 }, MONTH_SWIPE_ANIMATION);
        return;
      }

      // Swipe left (negative offset) -> next month
      if (offsetX <= -MONTH_SWIPE_THRESHOLD) {
        lastSwipeRef.current = now;
        haptic.light();
        // Animate out to the left
        await calendarControls.start({ x: -MONTH_MAX_DRAG, opacity: 0 }, MONTH_SWIPE_ANIMATION);
        setDisplayedMonth((prev) => getNextMonth(prev));
        // Reset position and animate in
        calendarX.set(MONTH_MAX_DRAG);
        await calendarControls.start({ x: 0, opacity: 1 }, MONTH_SWIPE_ANIMATION);
      }
      // Swipe right (positive offset) -> previous month
      else if (offsetX >= MONTH_SWIPE_THRESHOLD && canGoPrevious) {
        lastSwipeRef.current = now;
        haptic.light();
        // Animate out to the right
        await calendarControls.start({ x: MONTH_MAX_DRAG, opacity: 0 }, MONTH_SWIPE_ANIMATION);
        setDisplayedMonth((prev) => getPreviousMonth(prev));
        // Reset position and animate in
        calendarX.set(-MONTH_MAX_DRAG);
        await calendarControls.start({ x: 0, opacity: 1 }, MONTH_SWIPE_ANIMATION);
      }
      // Did not meet threshold - snap back
      else {
        await calendarControls.start({ x: 0 }, MONTH_SWIPE_ANIMATION);
      }
    },
    [haptic, canGoPrevious, calendarControls, calendarX]
  );

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
            aria-label="Закрыть выбор даты"
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
              maxHeight: '70vh',
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
                maxHeight: 'calc(70vh - 32px)',
              }}
            >
              {/* Section: Quick options */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  Перенести на
                </span>

                {/* Quick options grid */}
                <div
                  className="grid grid-cols-3 gap-[var(--space-sm)]"
                  style={{ marginBottom: 'var(--space-sm)' }}
                >
                  {/* Tomorrow - highlighted */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(quickOptions[0].date)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'var(--color-border-thin)',
                      border: 'none',
                      padding: 'var(--space-sm) var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition-colors)',
                    }}
                    aria-label={`Завтра, ${quickOptions[0].sublabel}`}
                  >
                    <span style={{ display: 'block' }}>Завтра</span>
                    <span
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginTop: '2px',
                      }}
                    >
                      {quickOptions[0].sublabel}
                    </span>
                  </button>

                  {/* Next week */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(nextWeekOption.date)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      padding: 'var(--space-sm) var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition-colors)',
                    }}
                    aria-label={`Следующая неделя, ${nextWeekOption.sublabel}`}
                  >
                    <span style={{ display: 'block' }}>След. нед.</span>
                    <span
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginTop: '2px',
                      }}
                    >
                      {nextWeekOption.sublabel}
                    </span>
                  </button>

                  {/* Day after tomorrow */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(quickOptions[1].date)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      padding: 'var(--space-sm) var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition-colors)',
                    }}
                    aria-label={`Послезавтра, ${formatDateLabel(quickOptions[1].date)}`}
                  >
                    <span style={{ display: 'block' }}>Послезавтра</span>
                    <span
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginTop: '2px',
                      }}
                    >
                      {getDayOfWeekName(quickOptions[1].date)}
                    </span>
                  </button>
                </div>

                {/* Additional days list */}
                <div className="flex flex-wrap gap-[var(--space-xs)]">
                  {quickOptions.slice(2).map((option) => (
                    <button
                      key={option.date}
                      type="button"
                      onClick={() => handleSelectOption(option.date)}
                      style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-normal)',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition-colors)',
                      }}
                      aria-label={option.label}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--color-border-thin)',
                  margin: 'var(--space-md) 0',
                }}
              />

              {/* Section: Calendar Grid */}
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  Выбрать дату
                </span>

                {/* Calendar Header with Month/Year and Navigation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {displayedMonthYear}
                  </span>

                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button
                      type="button"
                      onClick={handlePreviousMonth}
                      disabled={!canGoPrevious}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-base)',
                        color: canGoPrevious
                          ? 'var(--color-text-secondary)'
                          : 'var(--color-text-disabled)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                        transition: 'var(--transition-colors)',
                      }}
                      aria-label="Предыдущий месяц"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-base)',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition-colors)',
                      }}
                      aria-label="Следующий месяц"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Week Days Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-xs)',
                  }}
                >
                  {CALENDAR_DAY_NAMES.map((dayName) => (
                    <div
                      key={dayName}
                      style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                        padding: 'var(--space-xs) 0',
                      }}
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid - Swipeable */}
                <div
                  style={{
                    overflow: 'hidden',
                    touchAction: 'pan-y',
                  }}
                >
                  <motion.div
                    style={{
                      x: calendarX,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 'var(--space-xs)',
                    }}
                    drag="x"
                    dragConstraints={{
                      left: -MONTH_MAX_DRAG,
                      right: canGoPrevious ? MONTH_MAX_DRAG : 0,
                    }}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDrag={handleCalendarDrag}
                    onDragEnd={handleCalendarDragEnd}
                    animate={calendarControls}
                    aria-label="Calendar grid - swipe left for next month, swipe right for previous month"
                  >
                    {calendarDays.map((day) => {
                      const isSelected = isDateSelected(day.date);
                      const isCurrentMonth = day.isCurrentMonth;
                      const isDisabled = day.isDisabled;
                      const isTodayDate = day.isToday;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => handleDaySelect(day)}
                          disabled={isDisabled}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-family)',
                            fontSize: 'var(--font-sm)',
                            fontWeight: isSelected
                              ? 'var(--font-weight-semibold)'
                              : 'var(--font-weight-normal)',
                            color: isSelected
                              ? 'var(--color-calendar-selection-text)'
                              : isDisabled
                              ? 'var(--color-text-disabled)'
                              : isCurrentMonth
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-muted)',
                            backgroundColor: isSelected
                              ? 'var(--color-calendar-selection)'
                              : 'transparent',
                            border: isTodayDate && !isSelected
                              ? '1px solid var(--color-border)'
                              : 'none',
                            borderRadius: 'var(--radius-full)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'var(--transition-colors)',
                          }}
                          aria-label={`${day.day} ${displayedMonthYear}`}
                          aria-pressed={isSelected}
                          aria-disabled={isDisabled}
                        >
                          {day.day}
                        </button>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Calendar Footer with Reset and Confirm */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-md)',
                    paddingTop: 'var(--space-md)',
                    borderTop: '1px solid var(--color-border-thin)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: 'var(--space-sm) var(--space-md)',
                      cursor: 'pointer',
                      transition: 'var(--transition-colors)',
                    }}
                    aria-label="Сбросить выбор"
                  >
                    Сброс
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedDate}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-lg)',
                      color: selectedDate
                        ? 'var(--color-calendar-selection-text)'
                        : 'var(--color-text-disabled)',
                      backgroundColor: selectedDate
                        ? 'var(--color-calendar-selection)'
                        : 'var(--color-border)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      cursor: selectedDate ? 'pointer' : 'not-allowed',
                      transition: 'var(--transition-colors)',
                    }}
                    aria-label="Подтвердить выбор"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Cancel button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: 'var(--space-md)',
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

export type { DatePickerProps, DateOption, CalendarDay };

// Export calendar helpers for potential reuse
export {
  getCalendarDays,
  getPreviousMonth,
  getNextMonth,
  formatMonthYear,
  canNavigateToPreviousMonth,
  CALENDAR_DAY_NAMES,
};
