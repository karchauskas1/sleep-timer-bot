/**
 * RecurringItem - Individual recurring task row component
 *
 * Displays a single recurring task with:
 * - Task text
 * - Schedule display (e.g., 'Пн, Ср, Пт · 09:00')
 * - Active/paused state toggle
 * - Swipe left to delete (via SwipeableRow)
 *
 * Visual design follows bank app subscription UI analogy:
 * - Clean, subscription-like appearance
 * - Clear active/paused state indication
 * - Minimal interaction points
 *
 * @example
 * // Basic usage
 * <RecurringItem recurringTask={recurringTask} />
 *
 * @example
 * // With edit callback
 * <RecurringItem
 *   recurringTask={recurringTask}
 *   onEdit={(id) => openEditModal(id)}
 * />
 *
 * @example
 * // In a list with AnimatePresence
 * <AnimatePresence mode="popLayout">
 *   {recurringTasks.map((rt) => (
 *     <motion.div
 *       key={rt.id}
 *       initial={{ opacity: 0, y: 20 }}
 *       animate={{ opacity: 1, y: 0 }}
 *       exit={{ opacity: 0, x: -100 }}
 *     >
 *       <RecurringItem recurringTask={rt} />
 *     </motion.div>
 *   ))}
 * </AnimatePresence>
 */

import { useCallback, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import type { RecurringTask } from '@/types';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';
import { SwipeableRow } from '@/shared/components/SwipeableRow';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Russian day names (short form)
 * Index corresponds to JavaScript's getDay() (0 = Sunday)
 */
const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'Вс',
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
};

/**
 * Animation configuration for state transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the RecurringItem component
 */
interface RecurringItemProps {
  /** The recurring task to display */
  recurringTask: RecurringTask;
  /** Optional callback when edit action is triggered */
  onEdit?: (taskId: string) => void;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format the schedule into a human-readable string
 *
 * Examples:
 * - Days only: "Пн, Ср, Пт"
 * - Days with time: "Пн, Ср, Пт · 09:00"
 * - Every day: "Каждый день"
 * - Weekdays: "По будням"
 * - Weekends: "По выходным"
 *
 * @param schedule - The recurring schedule configuration
 */
function formatSchedule(schedule: RecurringTask['schedule']): string {
  const { days, time } = schedule;

  // Sort days for consistent display (Mon-Sun order)
  const sortedDays = [...days].sort((a, b) => {
    // Reorder so Monday (1) comes first, Sunday (0) comes last
    const orderA = a === 0 ? 7 : a;
    const orderB = b === 0 ? 7 : b;
    return orderA - orderB;
  });

  let dayString: string;

  // Check for common patterns
  if (days.length === 7) {
    dayString = 'Каждый день';
  } else if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d))
  ) {
    dayString = 'По будням';
  } else if (
    days.length === 2 &&
    days.includes(0) &&
    days.includes(6)
  ) {
    dayString = 'По выходным';
  } else {
    // Format individual days
    dayString = sortedDays.map((d) => DAY_NAMES_SHORT[d]).join(', ');
  }

  // Add time if specified
  if (time) {
    return `${dayString} · ${time}`;
  }

  return dayString;
}

/**
 * Format end date for display
 *
 * @param endDate - End date string in YYYY-MM-DD format
 */
function formatEndDate(endDate: string): string {
  const date = new Date(endDate);
  const day = date.getDate();
  const month = date.toLocaleDateString('ru-RU', { month: 'short' });
  return `до ${day} ${month}`;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurringItem component for displaying a single recurring task
 *
 * Renders a recurring task row with schedule display and toggle.
 * Supports swipe-to-delete action.
 *
 * @param props - Component props
 */
export function RecurringItem({
  recurringTask,
  onEdit,
  className = '',
  testId,
}: RecurringItemProps) {
  const haptic = useHaptic();

  // Store actions
  const toggleRecurringTask = usePlannerStore((state) => state.toggleRecurringTask);
  const deleteRecurringTask = usePlannerStore((state) => state.deleteRecurringTask);

  // -------------------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle toggle button click
   */
  const handleToggle = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      toggleRecurringTask(recurringTask.id);

      // Haptic feedback - different for pause vs resume
      if (recurringTask.active) {
        haptic.light(); // Pausing
      } else {
        haptic.success(); // Resuming
      }
    },
    [recurringTask.id, recurringTask.active, toggleRecurringTask, haptic]
  );

  /**
   * Handle swipe left (delete)
   */
  const handleDelete = useCallback(() => {
    // Delete the recurring task and its generated tasks
    deleteRecurringTask(recurringTask.id, true);
  }, [recurringTask.id, deleteRecurringTask]);

  /**
   * Handle row tap (edit)
   */
  const handleRowClick = useCallback(() => {
    if (onEdit) {
      haptic.light();
      onEdit(recurringTask.id);
    }
  }, [recurringTask.id, onEdit, haptic]);

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------

  const scheduleText = formatSchedule(recurringTask.schedule);
  const hasEndDate = Boolean(recurringTask.schedule.endDate);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SwipeableRow
      onSwipeLeft={handleDelete}
      leftLabel="Удалить"
      className={className}
      testId={testId}
    >
      <div
        className="flex items-center gap-[var(--space-sm)]"
        style={{
          minHeight: 'var(--min-touch-target)',
          padding: 'var(--space-sm) var(--space-md)',
          backgroundColor: 'var(--color-surface)',
          cursor: onEdit ? 'pointer' : 'default',
        }}
        onClick={onEdit ? handleRowClick : undefined}
        role={onEdit ? 'button' : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onKeyDown={
          onEdit
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick();
                }
              }
            : undefined
        }
      >
        {/* Content section */}
        <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-xs)]">
          {/* Task text */}
          <span
            className="select-none"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-base)',
              fontWeight: 'var(--font-weight-normal)',
              color: recurringTask.active
                ? 'var(--color-text-primary)'
                : 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-normal)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-colors)',
            }}
          >
            {recurringTask.text}
          </span>

          {/* Schedule info */}
          <div
            className="flex items-center gap-[var(--space-xs)] flex-wrap"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            <span>{scheduleText}</span>

            {/* End date badge */}
            {hasEndDate && (
              <span
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-xs)',
                }}
              >
                {formatEndDate(recurringTask.schedule.endDate!)}
              </span>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: '48px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: recurringTask.active
              ? 'var(--color-accent)'
              : 'var(--color-border)',
            cursor: 'pointer',
            transition: 'var(--transition-colors)',
            position: 'relative',
            border: 'none',
            padding: 0,
          }}
          aria-label={recurringTask.active ? 'Приостановить' : 'Возобновить'}
          aria-pressed={recurringTask.active}
        >
          {/* Toggle knob */}
          <motion.div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface)',
              position: 'absolute',
              top: '2px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
            initial={false}
            animate={{
              left: recurringTask.active ? '22px' : '2px',
            }}
            transition={ANIMATION_CONFIG}
          />
        </button>
      </div>

      {/* Paused overlay indicator */}
      {!recurringTask.active && (
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
          style={{
            backgroundColor: 'var(--color-bg)',
            opacity: 0.3,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={ANIMATION_CONFIG}
          aria-hidden="true"
        />
      )}
    </SwipeableRow>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { RecurringItemProps };
export { formatSchedule, formatEndDate };
