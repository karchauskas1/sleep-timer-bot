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

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, addWeeks, isToday, isTomorrow } from 'date-fns';
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
 * Day names in Russian (abbreviated)
 */
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

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

  // Memoize options to avoid recalculating on each render
  const quickOptions = useMemo(() => generateQuickOptions(), []);
  const nextWeekOption = useMemo(() => getNextWeekOption(), []);

  // Calculate minimum date (default to tomorrow)
  const effectiveMinDate = minDate ?? getTomorrowDate();

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

              {/* Section: Custom date */}
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
                  Другая дата
                </span>

                <input
                  type="date"
                  min={effectiveMinDate}
                  onChange={handleCustomDateChange}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label="Выбрать другую дату"
                />
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

export type { DatePickerProps, DateOption };
