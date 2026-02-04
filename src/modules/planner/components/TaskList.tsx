/**
 * TaskList - Task list component with date grouping and animations
 *
 * Displays tasks organized into sections:
 * - "Сегодня" (Today) - tasks for the current day
 * - "Ближайшее" (Upcoming) - future tasks grouped by date
 *
 * Features:
 * - AnimatePresence for smooth add/remove animations
 * - Date-based grouping with Russian labels
 * - Empty state when no tasks exist
 * - Overdue tasks highlighted (optional)
 * - Single day mode for horizontal day navigation
 *
 * @example
 * // Basic usage - displays all tasks with grouping
 * <TaskList />
 *
 * @example
 * // With postpone handler for date picker integration
 * <TaskList onPostpone={(taskId) => openDatePicker(taskId)} />
 *
 * @example
 * // Show only today's tasks
 * <TaskList showUpcoming={false} />
 *
 * @example
 * // Single day mode - shows tasks for selectedDate from store
 * <TaskList singleDayMode />
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskItem } from '@/modules/planner/components/TaskItem';
import { EmptyState } from '@/shared/components/EmptyState';
import {
  useTodaysTasks,
  useUpcomingTasksGrouped,
  useOverdueTasksGrouped,
  useTasksByDate,
  type TaskGroup,
} from '@/modules/planner/hooks/useTasks';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation variants for list items
 */
const taskVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

/**
 * Animation variants for section headers
 */
const sectionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Animation configuration
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the TaskList component
 */
interface TaskListProps {
  /** Optional callback when postpone action is triggered */
  onPostpone?: (taskId: string) => void;
  /** Whether to show upcoming tasks section (default: true) */
  showUpcoming?: boolean;
  /** Whether to show overdue tasks section (default: true) */
  showOverdue?: boolean;
  /** Additional CSS class name */
  className?: string;
  /**
   * Single day mode - displays only tasks for the selected date from store
   * When enabled, ignores showUpcoming/showOverdue and shows a flat list
   * without section headers
   * @default false
   */
  singleDayMode?: boolean;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Section header component
 */
function SectionHeader({
  title,
  count,
  isOverdue = false,
}: {
  title: string;
  count?: number;
  isOverdue?: boolean;
}) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={ANIMATION_CONFIG}
      style={{
        padding: 'var(--space-md) var(--space-md) var(--space-sm)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        color: isOverdue ? 'var(--color-text-error, var(--color-text-secondary))' : 'var(--color-text-secondary)',
        letterSpacing: 'var(--letter-spacing-wide)',
        textTransform: 'uppercase',
      }}
    >
      {title}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: 'var(--space-xs)',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--color-text-muted)',
          }}
        >
          {count}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Task group component for rendering a date group
 */
function TaskGroupSection({
  group,
  onPostpone,
  isOverdue = false,
}: {
  group: TaskGroup;
  onPostpone?: (taskId: string) => void;
  isOverdue?: boolean;
}) {
  return (
    <div>
      <SectionHeader title={group.label} isOverdue={isOverdue} />
      <AnimatePresence mode="popLayout">
        {group.tasks.map((task) => (
          <motion.div
            key={task.id}
            variants={taskVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={ANIMATION_CONFIG}
            layout
          >
            <TaskItem task={task} onPostpone={onPostpone} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskList component for displaying grouped tasks
 *
 * Renders tasks organized by date with smooth animations.
 * Shows empty state when no tasks exist.
 *
 * @param props - Component props
 */
export function TaskList({
  onPostpone,
  showUpcoming = true,
  showOverdue = true,
  className = '',
  singleDayMode = false,
}: TaskListProps) {
  // Get selected date from store (used in singleDayMode)
  const selectedDate = usePlannerStore((state) => state.selectedDate);

  // Fetch tasks from IndexedDB
  const todaysTasks = useTodaysTasks();
  const upcomingGroups = useUpcomingTasksGrouped();
  const overdueGroups = useOverdueTasksGrouped();
  const selectedDateTasks = useTasksByDate(selectedDate);

  // Separate today's tasks into incomplete and completed (for default mode)
  const { incompleteTasks, completedTasks } = useMemo(() => {
    if (!todaysTasks) return { incompleteTasks: [], completedTasks: [] };
    return {
      incompleteTasks: todaysTasks.filter((t) => !t.completed),
      completedTasks: todaysTasks.filter((t) => t.completed),
    };
  }, [todaysTasks]);

  // Separate selected date tasks into incomplete and completed (for single day mode)
  const { singleDayIncompleteTasks, singleDayCompletedTasks } = useMemo(() => {
    if (!selectedDateTasks) return { singleDayIncompleteTasks: [], singleDayCompletedTasks: [] };
    return {
      singleDayIncompleteTasks: selectedDateTasks.filter((t) => !t.completed),
      singleDayCompletedTasks: selectedDateTasks.filter((t) => t.completed),
    };
  }, [selectedDateTasks]);

  // Handle postpone callback wrapper
  const handlePostpone = useCallback(
    (taskId: string) => {
      if (onPostpone) {
        onPostpone(taskId);
      }
    },
    [onPostpone]
  );

  // ==========================================================================
  // Single Day Mode Rendering
  // ==========================================================================
  if (singleDayMode) {
    // Loading state for single day mode
    if (selectedDateTasks === undefined) {
      return null;
    }

    // Empty state for single day mode
    if (selectedDateTasks.length === 0) {
      return (
        <div className={className}>
          <EmptyState fullHeight />
        </div>
      );
    }

    // Render flat task list without section headers
    return (
      <div
        className={className}
        style={{
          paddingBottom: 'var(--space-2xl)',
        }}
      >
        {/* Incomplete tasks first */}
        <AnimatePresence mode="popLayout">
          {singleDayIncompleteTasks.map((task) => (
            <motion.div
              key={task.id}
              variants={taskVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={ANIMATION_CONFIG}
              layout
            >
              <TaskItem task={task} onPostpone={handlePostpone} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Completed tasks at the bottom */}
        {singleDayCompletedTasks.length > 0 && (
          <AnimatePresence mode="popLayout">
            {singleDayCompletedTasks.map((task) => (
              <motion.div
                key={task.id}
                variants={taskVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={ANIMATION_CONFIG}
                layout
              >
                <TaskItem task={task} onPostpone={handlePostpone} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // ==========================================================================
  // Default Mode Rendering (grouped by date)
  // ==========================================================================

  // Check if data is still loading
  const isLoading = todaysTasks === undefined ||
    (showUpcoming && upcomingGroups === undefined) ||
    (showOverdue && overdueGroups === undefined);

  // Check if there are any tasks at all
  const hasAnyTasks = useMemo(() => {
    if (isLoading) return true; // Assume tasks exist while loading

    const hasTodayTasks = todaysTasks && todaysTasks.length > 0;
    const hasUpcoming = showUpcoming && upcomingGroups && upcomingGroups.length > 0;
    const hasOverdue = showOverdue && overdueGroups && overdueGroups.length > 0;

    return hasTodayTasks || hasUpcoming || hasOverdue;
  }, [isLoading, todaysTasks, upcomingGroups, overdueGroups, showUpcoming, showOverdue]);

  // Loading state - render nothing (app should feel instant per design philosophy)
  if (isLoading) {
    return null;
  }

  // Empty state
  if (!hasAnyTasks) {
    return (
      <div className={className}>
        <EmptyState fullHeight />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        paddingBottom: 'var(--space-2xl)',
      }}
    >
      {/* Overdue tasks section */}
      {showOverdue && overdueGroups && overdueGroups.length > 0 && (
        <div>
          <SectionHeader title="Просрочено" count={overdueGroups.reduce((acc, g) => acc + g.tasks.length, 0)} isOverdue />
          {overdueGroups.map((group) => (
            <TaskGroupSection
              key={group.date}
              group={group}
              onPostpone={handlePostpone}
              isOverdue
            />
          ))}
        </div>
      )}

      {/* Today's tasks section */}
      {(incompleteTasks.length > 0 || completedTasks.length > 0) && (
        <div>
          <SectionHeader title="Сегодня" />

          {/* Incomplete tasks first */}
          <AnimatePresence mode="popLayout">
            {incompleteTasks.map((task) => (
              <motion.div
                key={task.id}
                variants={taskVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={ANIMATION_CONFIG}
                layout
              >
                <TaskItem task={task} onPostpone={handlePostpone} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Completed tasks at the bottom of today's section */}
          {completedTasks.length > 0 && (
            <AnimatePresence mode="popLayout">
              {completedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={taskVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={ANIMATION_CONFIG}
                  layout
              >
                  <TaskItem task={task} onPostpone={handlePostpone} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Upcoming tasks section */}
      {showUpcoming && upcomingGroups && upcomingGroups.length > 0 && (
        <div>
          <SectionHeader title="Ближайшее" />
          {upcomingGroups.map((group) => (
            <TaskGroupSection
              key={group.date}
              group={group}
              onPostpone={handlePostpone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { TaskListProps };
