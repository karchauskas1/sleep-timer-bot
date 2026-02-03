/**
 * Planner Store - Zustand store for tasks and recurring tasks state management
 *
 * This store manages all planner-related state with IndexedDB persistence.
 * All changes are immediately synced to Dexie for offline-first support.
 *
 * @example
 * // Access store in components
 * import { usePlannerStore } from '@/modules/planner/store/plannerStore';
 *
 * function TaskList() {
 *   const tasks = usePlannerStore((state) => state.tasks);
 *   const addTask = usePlannerStore((state) => state.addTask);
 *   // ...
 * }
 */

import { create } from 'zustand';
import { db } from '@/shared/utils/storage';
import { registerHydrationCallback } from '@/shared/hooks/useStoreHydration';
import type { Task, RecurringTask } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating a new task (without auto-generated fields)
 */
export type CreateTaskInput = Pick<Task, 'text' | 'date'> & {
  recurringId?: string;
};

/**
 * Input for creating a new recurring task
 */
export type CreateRecurringTaskInput = Pick<RecurringTask, 'text' | 'schedule'>;

/**
 * Input for updating a recurring task
 */
export type UpdateRecurringTaskInput = Partial<Pick<RecurringTask, 'text' | 'schedule' | 'active'>>;

/**
 * Planner store state interface
 */
interface PlannerState {
  // State
  /** All tasks in the planner */
  tasks: Task[];
  /** All recurring task definitions */
  recurringTasks: RecurringTask[];

  // Task Actions
  /** Add a new task */
  addTask: (input: CreateTaskInput) => Task;
  /** Toggle task completion status */
  completeTask: (id: string) => void;
  /** Postpone a task to a new date */
  postponeTask: (id: string, newDate: string) => void;
  /** Delete a task */
  deleteTask: (id: string) => void;
  /** Edit task text */
  editTask: (id: string, newText: string) => void;

  // Recurring Task Actions
  /** Add a new recurring task */
  addRecurringTask: (input: CreateRecurringTaskInput) => RecurringTask;
  /** Update a recurring task */
  updateRecurringTask: (id: string, updates: UpdateRecurringTaskInput) => void;
  /** Delete a recurring task and optionally its generated tasks */
  deleteRecurringTask: (id: string, deleteGeneratedTasks?: boolean) => void;
  /** Toggle recurring task active state (pause/resume) */
  toggleRecurringTask: (id: string) => void;

  // Bulk Actions
  /** Set all tasks (used for hydration) */
  setTasks: (tasks: Task[]) => void;
  /** Set all recurring tasks (used for hydration) */
  setRecurringTasks: (recurringTasks: RecurringTask[]) => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Planner Zustand store
 *
 * All state modifications are persisted to IndexedDB immediately.
 * The store is hydrated from IndexedDB on app startup via registerHydrationCallback.
 */
export const usePlannerStore = create<PlannerState>()((set, get) => ({
  // -------------------------------------------------------------------------
  // Initial State
  // -------------------------------------------------------------------------
  tasks: [],
  recurringTasks: [],

  // -------------------------------------------------------------------------
  // Task Actions
  // -------------------------------------------------------------------------

  addTask: (input) => {
    const newTask: Task = {
      ...input,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    // Persist to IndexedDB
    db.tasks.add(newTask);

    return newTask;
  },

  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));

    // Get updated task and persist
    const updatedTask = get().tasks.find((t) => t.id === id);
    if (updatedTask) {
      db.tasks.update(id, { completed: updatedTask.completed });
    }
  },

  postponeTask: (id, newDate) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, date: newDate } : task
      ),
    }));

    // Persist to IndexedDB
    db.tasks.update(id, { date: newDate });
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    // Persist to IndexedDB
    db.tasks.delete(id);
  },

  editTask: (id, newText) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, text: newText } : task
      ),
    }));

    // Persist to IndexedDB
    db.tasks.update(id, { text: newText });
  },

  // -------------------------------------------------------------------------
  // Recurring Task Actions
  // -------------------------------------------------------------------------

  addRecurringTask: (input) => {
    const newRecurringTask: RecurringTask = {
      ...input,
      id: crypto.randomUUID(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      recurringTasks: [...state.recurringTasks, newRecurringTask],
    }));

    // Persist to IndexedDB
    db.recurringTasks.add(newRecurringTask);

    return newRecurringTask;
  },

  updateRecurringTask: (id, updates) => {
    set((state) => ({
      recurringTasks: state.recurringTasks.map((rt) =>
        rt.id === id ? { ...rt, ...updates } : rt
      ),
    }));

    // Build the update object for Dexie
    // We need to handle schedule separately since it's nested
    const dexieUpdates: Partial<RecurringTask> = {};

    if (updates.text !== undefined) {
      dexieUpdates.text = updates.text;
    }
    if (updates.active !== undefined) {
      dexieUpdates.active = updates.active;
    }
    if (updates.schedule !== undefined) {
      dexieUpdates.schedule = updates.schedule;
    }

    db.recurringTasks.update(id, dexieUpdates);
  },

  deleteRecurringTask: (id, deleteGeneratedTasks = false) => {
    if (deleteGeneratedTasks) {
      // Delete all tasks generated by this recurring task
      const tasksToDelete = get().tasks.filter((t) => t.recurringId === id);
      set((state) => ({
        recurringTasks: state.recurringTasks.filter((rt) => rt.id !== id),
        tasks: state.tasks.filter((t) => t.recurringId !== id),
      }));

      // Persist to IndexedDB - delete recurring task and its generated tasks
      db.transaction('rw', [db.recurringTasks, db.tasks], async () => {
        await db.recurringTasks.delete(id);
        const taskIds = tasksToDelete.map((t) => t.id);
        await db.tasks.bulkDelete(taskIds);
      });
    } else {
      // Only delete the recurring task definition
      set((state) => ({
        recurringTasks: state.recurringTasks.filter((rt) => rt.id !== id),
      }));

      db.recurringTasks.delete(id);
    }
  },

  toggleRecurringTask: (id) => {
    const recurringTask = get().recurringTasks.find((rt) => rt.id === id);
    if (!recurringTask) return;

    const newActiveState = !recurringTask.active;

    set((state) => ({
      recurringTasks: state.recurringTasks.map((rt) =>
        rt.id === id ? { ...rt, active: newActiveState } : rt
      ),
    }));

    // Persist to IndexedDB
    db.recurringTasks.update(id, { active: newActiveState });
  },

  // -------------------------------------------------------------------------
  // Bulk Actions (for hydration)
  // -------------------------------------------------------------------------

  setTasks: (tasks) => {
    set({ tasks });
  },

  setRecurringTasks: (recurringTasks) => {
    set({ recurringTasks });
  },
}));

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

/**
 * Select tasks for a specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export const selectTasksByDate = (date: string) => (state: PlannerState) =>
  state.tasks.filter((task) => task.date === date);

/**
 * Select incomplete tasks for a specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export const selectIncompleteTasks = (date: string) => (state: PlannerState) =>
  state.tasks.filter((task) => task.date === date && !task.completed);

/**
 * Select completed tasks for a specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export const selectCompletedTasks = (date: string) => (state: PlannerState) =>
  state.tasks.filter((task) => task.date === date && task.completed);

/**
 * Select overdue tasks (before today, not completed)
 * @param today - Today's date string in YYYY-MM-DD format
 */
export const selectOverdueTasks = (today: string) => (state: PlannerState) =>
  state.tasks.filter((task) => task.date < today && !task.completed);

/**
 * Select upcoming tasks (after today)
 * @param today - Today's date string in YYYY-MM-DD format
 */
export const selectUpcomingTasks = (today: string) => (state: PlannerState) =>
  state.tasks.filter((task) => task.date > today);

/**
 * Select active recurring tasks
 */
export const selectActiveRecurringTasks = (state: PlannerState) =>
  state.recurringTasks.filter((rt) => rt.active);

/**
 * Select paused recurring tasks
 */
export const selectPausedRecurringTasks = (state: PlannerState) =>
  state.recurringTasks.filter((rt) => !rt.active);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a Date object to YYYY-MM-DD string
 * @param date - Date object to format
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a recurring task has already generated an instance for a given date
 * @param recurringId - The recurring task ID
 * @param date - Date string in YYYY-MM-DD format
 */
export function hasGeneratedInstance(recurringId: string, date: string): boolean {
  const state = usePlannerStore.getState();
  return state.tasks.some(
    (task) => task.recurringId === recurringId && task.date === date
  );
}

/**
 * Check if a recurring task should generate on a given date
 * Validates: active status, day of week, and end date
 * @param recurringTask - The recurring task definition
 * @param date - Date string in YYYY-MM-DD format
 */
export function shouldGenerateOnDate(
  recurringTask: RecurringTask,
  date: string
): boolean {
  // Must be active
  if (!recurringTask.active) {
    return false;
  }

  // Check day of week matches schedule
  const dayOfWeek = new Date(date).getDay();
  if (!recurringTask.schedule.days.includes(dayOfWeek)) {
    return false;
  }

  // Check if past end date
  if (recurringTask.schedule.endDate && date > recurringTask.schedule.endDate) {
    return false;
  }

  return true;
}

/**
 * Generate a task instance from a recurring task for a specific date
 * @param recurringTask - The recurring task definition
 * @param date - Date string in YYYY-MM-DD format
 */
export function generateTaskFromRecurring(
  recurringTask: RecurringTask,
  date: string
): Task | null {
  // Check if already generated
  if (hasGeneratedInstance(recurringTask.id, date)) {
    return null;
  }

  // Validate this recurring task should generate on this date
  if (!shouldGenerateOnDate(recurringTask, date)) {
    return null;
  }

  // Generate the task
  const { addTask } = usePlannerStore.getState();
  return addTask({
    text: recurringTask.text,
    date,
    recurringId: recurringTask.id,
  });
}

// =============================================================================
// Recurring Task Scheduling Engine
// =============================================================================

/**
 * Generate task instances for all active recurring tasks for a specific date
 *
 * This is the core scheduling engine that:
 * 1. Gets all recurring tasks from the store
 * 2. Filters to active ones scheduled for the given day
 * 3. Generates task instances for any that don't already exist
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Array of newly generated tasks
 *
 * @example
 * // Generate today's recurring task instances
 * const newTasks = generateRecurringTasksForDate();
 *
 * // Generate instances for a specific date
 * const newTasks = generateRecurringTasksForDate('2026-02-03');
 */
export function generateRecurringTasksForDate(date?: string): Task[] {
  const targetDate = date || formatDateToYYYYMMDD(new Date());
  const state = usePlannerStore.getState();
  const generatedTasks: Task[] = [];

  // Iterate through all recurring tasks
  for (const recurringTask of state.recurringTasks) {
    // Skip if not active or shouldn't generate on this date
    if (!shouldGenerateOnDate(recurringTask, targetDate)) {
      continue;
    }

    // Skip if already generated for this date
    if (hasGeneratedInstance(recurringTask.id, targetDate)) {
      continue;
    }

    // Generate the task instance
    const newTask = state.addTask({
      text: recurringTask.text,
      date: targetDate,
      recurringId: recurringTask.id,
    });

    generatedTasks.push(newTask);
  }

  return generatedTasks;
}

/**
 * Generate task instances for all active recurring tasks for today
 * Convenience wrapper around generateRecurringTasksForDate
 *
 * @returns Array of newly generated tasks
 *
 * @example
 * // Called automatically after hydration
 * generateTodaysRecurringTasks();
 */
export function generateTodaysRecurringTasks(): Task[] {
  return generateRecurringTasksForDate();
}

/**
 * Run the recurring task scheduler
 *
 * This function is called after store hydration completes to ensure
 * today's recurring task instances are generated. It's designed to be
 * called once on app startup.
 *
 * The function is idempotent - calling it multiple times is safe because
 * hasGeneratedInstance() prevents duplicate task creation.
 *
 * @returns Promise resolving to the number of tasks generated
 */
export async function runRecurringTaskScheduler(): Promise<number> {
  // Generate today's task instances
  const generatedTasks = generateTodaysRecurringTasks();

  return generatedTasks.length;
}

/**
 * Get statistics about recurring task generation
 * Useful for debugging and monitoring
 *
 * @param date - Date to check (defaults to today)
 * @returns Statistics about recurring task generation
 */
export function getRecurringTaskStats(date?: string): {
  totalRecurring: number;
  activeRecurring: number;
  scheduledForDate: number;
  alreadyGenerated: number;
  pendingGeneration: number;
} {
  const targetDate = date || formatDateToYYYYMMDD(new Date());
  const state = usePlannerStore.getState();

  const totalRecurring = state.recurringTasks.length;
  const activeRecurring = state.recurringTasks.filter((rt) => rt.active).length;

  let scheduledForDate = 0;
  let alreadyGenerated = 0;

  for (const recurringTask of state.recurringTasks) {
    if (shouldGenerateOnDate(recurringTask, targetDate)) {
      scheduledForDate++;
      if (hasGeneratedInstance(recurringTask.id, targetDate)) {
        alreadyGenerated++;
      }
    }
  }

  return {
    totalRecurring,
    activeRecurring,
    scheduledForDate,
    alreadyGenerated,
    pendingGeneration: scheduledForDate - alreadyGenerated,
  };
}

// =============================================================================
// Hydration Registration
// =============================================================================

/**
 * Flag to track if the scheduler has been run for this session
 * Prevents duplicate runs if hydration callback fires multiple times
 */
let schedulerHasRun = false;

/**
 * Register for hydration to receive data from IndexedDB on app startup
 *
 * This is called automatically when the module is imported.
 * The useStoreHydration hook loads data and notifies all registered stores.
 *
 * After hydration completes, the recurring task scheduler runs to
 * generate today's task instances from active recurring tasks.
 */
registerHydrationCallback((data) => {
  // Hydrate the store with data from IndexedDB
  usePlannerStore.setState({
    tasks: data.tasks,
    recurringTasks: data.recurringTasks,
  });

  // Run the recurring task scheduler after hydration (once per session)
  // Use setTimeout to ensure state is fully updated before generating tasks
  if (!schedulerHasRun) {
    schedulerHasRun = true;
    setTimeout(() => {
      generateTodaysRecurringTasks();
    }, 0);
  }
});

/**
 * Reset the scheduler flag (for testing purposes)
 * @internal
 */
export function resetSchedulerFlag(): void {
  schedulerHasRun = false;
}
