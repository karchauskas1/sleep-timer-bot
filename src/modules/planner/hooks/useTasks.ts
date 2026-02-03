/**
 * useTasks - Reactive task hooks using Dexie useLiveQuery
 *
 * These hooks provide reactive access to tasks from IndexedDB.
 * When IndexedDB data changes, components using these hooks automatically re-render.
 *
 * @example
 * // Get today's tasks
 * const tasks = useTodaysTasks();
 * if (tasks === undefined) return <Loading />;
 *
 * @example
 * // Get tasks grouped by date
 * const groups = useUpcomingTasksGrouped();
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { db } from '@/shared/utils/storage';
import type { Task } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * A group of tasks by date
 */
export interface TaskGroup {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Formatted date for display (e.g., "Сегодня", "Завтра", "3 февраля") */
  label: string;
  /** Tasks for this date */
  tasks: Task[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(tomorrow, 'yyyy-MM-dd');
}

/**
 * Format a date string for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted label (e.g., "Сегодня", "Завтра", "3 фев")
 */
function formatDateLabel(dateStr: string): string {
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  if (dateStr === today) {
    return 'Сегодня';
  }
  if (dateStr === tomorrow) {
    return 'Завтра';
  }

  // Parse and format the date
  const date = parseISO(dateStr);
  const day = date.getDate();

  // Russian month names (abbreviated)
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  ];
  const month = months[date.getMonth()];

  return `${day} ${month}`;
}

/**
 * Sort tasks by creation date (newest first within a date group)
 */
function sortByCreatedAt(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Group tasks by date
 */
function groupTasksByDate(tasks: Task[]): TaskGroup[] {
  const groups: Map<string, Task[]> = new Map();

  for (const task of tasks) {
    const existing = groups.get(task.date) || [];
    groups.set(task.date, [...existing, task]);
  }

  // Convert to array and sort by date
  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, groupTasks]) => ({
      date,
      label: formatDateLabel(date),
      tasks: sortByCreatedAt(groupTasks),
    }));
}

// =============================================================================
// Today's Tasks Hooks
// =============================================================================

/**
 * Get all tasks for today
 *
 * @returns Array of today's tasks or undefined while loading
 *
 * @example
 * const tasks = useTodaysTasks();
 * if (tasks === undefined) return null; // Loading
 * return <TaskList tasks={tasks} />;
 */
export function useTodaysTasks(): Task[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    () => db.tasks.where('date').equals(today).toArray().then(sortByCreatedAt),
    [today]
  );
}

/**
 * Get incomplete (not completed) tasks for today
 *
 * @returns Array of incomplete tasks or undefined while loading
 */
export function useTodaysIncompleteTasks(): Task[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.where('date').equals(today).toArray();
      return sortByCreatedAt(tasks.filter((t) => !t.completed));
    },
    [today]
  );
}

/**
 * Get completed tasks for today
 *
 * @returns Array of completed tasks or undefined while loading
 */
export function useTodaysCompletedTasks(): Task[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.where('date').equals(today).toArray();
      return sortByCreatedAt(tasks.filter((t) => t.completed));
    },
    [today]
  );
}

// =============================================================================
// Upcoming Tasks Hooks
// =============================================================================

/**
 * Get all upcoming tasks (after today)
 *
 * @returns Array of upcoming tasks sorted by date, or undefined while loading
 */
export function useUpcomingTasks(): Task[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      return tasks
        .filter((t) => t.date > today)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [today]
  );
}

/**
 * Get upcoming tasks grouped by date
 *
 * @returns Array of task groups sorted by date, or undefined while loading
 *
 * @example
 * const groups = useUpcomingTasksGrouped();
 * if (groups === undefined) return null;
 * return groups.map((group) => (
 *   <TaskGroup key={group.date} label={group.label} tasks={group.tasks} />
 * ));
 */
export function useUpcomingTasksGrouped(): TaskGroup[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      const upcoming = tasks.filter((t) => t.date > today);
      return groupTasksByDate(upcoming);
    },
    [today]
  );
}

// =============================================================================
// Overdue Tasks Hooks
// =============================================================================

/**
 * Get all overdue tasks (before today and not completed)
 *
 * @returns Array of overdue tasks sorted by date (oldest first), or undefined while loading
 *
 * @example
 * const overdue = useOverdueTasks();
 * if (overdue && overdue.length > 0) {
 *   return <OverdueWarning count={overdue.length} />;
 * }
 */
export function useOverdueTasks(): Task[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      return tasks
        .filter((t) => t.date < today && !t.completed)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [today]
  );
}

/**
 * Get overdue tasks grouped by date
 *
 * @returns Array of task groups sorted by date (oldest first), or undefined while loading
 */
export function useOverdueTasksGrouped(): TaskGroup[] | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      const overdue = tasks.filter((t) => t.date < today && !t.completed);
      return groupTasksByDate(overdue);
    },
    [today]
  );
}

// =============================================================================
// Completed Tasks Hooks
// =============================================================================

/**
 * Get all completed tasks across all dates
 *
 * @returns Array of completed tasks sorted by date (most recent first), or undefined while loading
 */
export function useCompletedTasks(): Task[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      return tasks
        .filter((t) => t.completed)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    []
  );
}

/**
 * Get completed tasks grouped by date
 *
 * @returns Array of task groups sorted by date (most recent first), or undefined while loading
 */
export function useCompletedTasksGrouped(): TaskGroup[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      const completed = tasks.filter((t) => t.completed);
      return groupTasksByDate(completed).reverse(); // Most recent first
    },
    []
  );
}

// =============================================================================
// Tasks by Date Hooks
// =============================================================================

/**
 * Get tasks for a specific date
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of tasks for the date, or undefined while loading
 *
 * @example
 * const tasks = useTasksByDate('2026-02-15');
 */
export function useTasksByDate(date: string): Task[] | undefined {
  return useLiveQuery(
    () => db.tasks.where('date').equals(date).toArray().then(sortByCreatedAt),
    [date]
  );
}

/**
 * Get incomplete tasks for a specific date
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns Array of incomplete tasks, or undefined while loading
 */
export function useIncompleteTasksByDate(date: string): Task[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.where('date').equals(date).toArray();
      return sortByCreatedAt(tasks.filter((t) => !t.completed));
    },
    [date]
  );
}

// =============================================================================
// Recurring Task Instance Hooks
// =============================================================================

/**
 * Get all task instances generated from a recurring task
 *
 * @param recurringId - The recurring task ID
 * @returns Array of tasks with this recurringId, or undefined while loading
 */
export function useRecurringTaskInstances(recurringId: string): Task[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks
        .where('recurringId')
        .equals(recurringId)
        .toArray();
      return tasks.sort((a, b) => b.date.localeCompare(a.date));
    },
    [recurringId]
  );
}

// =============================================================================
// Aggregate Hooks
// =============================================================================

/**
 * Get task counts for quick summary display
 *
 * @returns Object with counts for today, overdue, upcoming, or undefined while loading
 *
 * @example
 * const counts = useTaskCounts();
 * if (counts) {
 *   return <Badge>{counts.overdue} overdue</Badge>;
 * }
 */
export function useTaskCounts(): { today: number; overdue: number; upcoming: number; completed: number } | undefined {
  const today = getTodayString();

  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();

      const todayCount = tasks.filter((t) => t.date === today && !t.completed).length;
      const overdueCount = tasks.filter((t) => t.date < today && !t.completed).length;
      const upcomingCount = tasks.filter((t) => t.date > today).length;
      const completedCount = tasks.filter((t) => t.completed).length;

      return {
        today: todayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        completed: completedCount,
      };
    },
    [today]
  );
}

/**
 * Get all tasks (for planner overview)
 *
 * @returns Array of all tasks sorted by date, or undefined while loading
 */
export function useAllTasks(): Task[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.tasks.toArray();
      return tasks.sort((a, b) => a.date.localeCompare(b.date));
    },
    []
  );
}

/**
 * Check if a task instance exists for a recurring task on a specific date
 *
 * @param recurringId - The recurring task ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Boolean indicating if instance exists, or undefined while loading
 */
export function useHasRecurringInstance(recurringId: string, date: string): boolean | undefined {
  return useLiveQuery(
    async () => {
      const count = await db.tasks
        .where({ recurringId, date })
        .count();
      return count > 0;
    },
    [recurringId, date]
  );
}
