/**
 * Planner Module - Main entry point for task management
 *
 * Integrates all planner components into a cohesive task management experience:
 * - HorizontalDaySelector for quick date navigation
 * - TaskInput at top for quick task entry
 * - TaskList displaying all tasks organized by date
 * - Navigation to RecurringList for managing recurring tasks
 * - DatePicker modal for postponing tasks
 * - MonthCalendar modal for selecting distant dates
 *
 * Design principles:
 * - Silence through minimalism - no productivity pressure
 * - Calm surface - clean interface for quick check-ins
 * - Quick entry - focus on rapid task capture and review
 *
 * @example
 * // Basic usage in router
 * <Planner />
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskInput } from '@/modules/planner/components/TaskInput';
import { TaskList } from '@/modules/planner/components/TaskList';
import { RecurringList } from '@/modules/planner/components/RecurringList';
import { DatePicker } from '@/modules/planner/components/DatePicker';
import { HorizontalDaySelector } from '@/modules/planner/components/HorizontalDaySelector';
import { MonthCalendar } from '@/modules/planner/components/MonthCalendar';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for view transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for view transitions
 */
const viewVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// =============================================================================
// Types
// =============================================================================

/**
 * Planner view states
 */
type PlannerView = 'main' | 'recurring';

/**
 * Props for the Planner module
 */
interface PlannerProps {
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Planner module component
 *
 * Main entry point for the task planner functionality.
 * Manages view state between main task list and recurring tasks.
 * Handles postpone action with date picker modal.
 * Integrates horizontal day selector and month calendar for date navigation.
 *
 * @param props - Component props
 */
export function Planner({ className = '' }: PlannerProps) {
  const haptic = useHaptic();
  const postponeTask = usePlannerStore((state) => state.postponeTask);
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  const setSelectedDate = usePlannerStore((state) => state.setSelectedDate);

  // View state
  const [currentView, setCurrentView] = useState<PlannerView>('main');

  // Date picker state for postpone action
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Month calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Navigate to recurring tasks list
   */
  const handleNavigateToRecurring = useCallback(() => {
    haptic.light();
    setCurrentView('recurring');
  }, [haptic]);

  /**
   * Navigate back to main view
   */
  const handleNavigateToMain = useCallback(() => {
    haptic.light();
    setCurrentView('main');
  }, [haptic]);

  /**
   * Handle postpone action - opens date picker
   */
  const handlePostpone = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDatePickerOpen(true);
  }, []);

  /**
   * Handle date selection for postpone
   */
  const handleDateSelect = useCallback(
    (date: string) => {
      if (selectedTaskId) {
        postponeTask(selectedTaskId, date);
        haptic.light();
      }
      setIsDatePickerOpen(false);
      setSelectedTaskId(null);
    },
    [selectedTaskId, postponeTask, haptic]
  );

  /**
   * Handle date picker close
   */
  const handleDatePickerClose = useCallback(() => {
    setIsDatePickerOpen(false);
    setSelectedTaskId(null);
  }, []);

  /**
   * Handle month label click - opens month calendar
   */
  const handleMonthLabelClick = useCallback(() => {
    setIsCalendarOpen(true);
  }, []);

  /**
   * Handle month calendar close
   */
  const handleCalendarClose = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

  /**
   * Handle date selection from month calendar
   */
  const handleCalendarSelect = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    },
    [setSelectedDate]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <motion.div
            key="main-view"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={ANIMATION_CONFIG}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Horizontal Day Selector */}
            <HorizontalDaySelector
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMonthLabelClick={handleMonthLabelClick}
            />

            {/* Task Input */}
            <TaskInput showDatePicker />

            {/* Task List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
              }}
            >
              <TaskList onPostpone={handlePostpone} singleDayMode />
            </div>

            {/* Footer with Recurring Tasks Link */}
            <div
              style={{
                padding: 'var(--space-md)',
                borderTop: '1px solid var(--color-border-thin)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <button
                type="button"
                onClick={handleNavigateToRecurring}
                className="w-full flex items-center justify-center gap-[var(--space-sm)]"
                style={{
                  minHeight: 'var(--min-touch-target)',
                  padding: 'var(--space-sm) var(--space-md)',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition-colors)',
                }}
                aria-label="Управление повторяющимися задачами"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2.25L14.25 4.5L12 6.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.75 9V7.5C3.75 6.70435 4.06607 5.94129 4.62868 5.37868C5.19129 4.81607 5.95435 4.5 6.75 4.5H14.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 15.75L3.75 13.5L6 11.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.25 9V10.5C14.25 11.2956 13.9339 12.0587 13.3713 12.6213C12.8087 13.1839 12.0456 13.5 11.25 13.5H3.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Повторяющиеся</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recurring-view"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={ANIMATION_CONFIG}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <RecurringList
              onBack={handleNavigateToMain}
              className="flex-1"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Picker Modal for Postpone */}
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={handleDatePickerClose}
        onSelect={handleDateSelect}
      />

      {/* Month Calendar Modal for Date Navigation */}
      <MonthCalendar
        isOpen={isCalendarOpen}
        onClose={handleCalendarClose}
        onSelect={handleCalendarSelect}
        selectedDate={selectedDate}
      />
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Planner;
export type { PlannerProps, PlannerView };
