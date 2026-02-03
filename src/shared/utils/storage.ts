/**
 * Dexie.js database setup for IndexedDB storage
 *
 * This module provides offline-first persistence for the ЩА (SHA) app.
 * All data is stored locally in IndexedDB and synced to Zustand stores on app initialization.
 */

import Dexie, { type Table } from 'dexie';
import type { Task, RecurringTask, Setting } from '@/types';

/**
 * SHA Database class extending Dexie
 *
 * Tables:
 * - tasks: Individual tasks with date-based indexing
 * - recurringTasks: Recurring task definitions with active state indexing
 * - settings: Key-value application settings
 */
export class ShaDatabase extends Dexie {
  /**
   * Tasks table - individual task instances
   * Indexed by: id (primary), date, completed, recurringId
   */
  tasks!: Table<Task>;

  /**
   * Recurring tasks table - task templates that generate instances
   * Indexed by: id (primary), active
   */
  recurringTasks!: Table<RecurringTask>;

  /**
   * Settings table - key-value pairs for app configuration
   * Indexed by: key (primary)
   */
  settings!: Table<Setting>;

  constructor() {
    super('sha');

    // Define database schema with indexed fields
    // Note: Listed fields are indexed, not all stored fields
    this.version(1).stores({
      // tasks: primary key 'id', indexed on 'date', 'completed', 'recurringId'
      tasks: 'id, date, completed, recurringId',
      // recurringTasks: primary key 'id', indexed on 'active'
      recurringTasks: 'id, active',
      // settings: primary key 'key'
      settings: 'key',
    });
  }
}

/**
 * Singleton database instance
 * Use this for all database operations throughout the app
 *
 * @example
 * // Add a task
 * await db.tasks.add({
 *   id: crypto.randomUUID(),
 *   text: 'New task',
 *   date: '2026-02-02',
 *   completed: false,
 *   createdAt: new Date().toISOString(),
 * });
 *
 * @example
 * // Query today's tasks
 * const today = format(new Date(), 'yyyy-MM-dd');
 * const tasks = await db.tasks.where('date').equals(today).toArray();
 *
 * @example
 * // Get all active recurring tasks
 * const recurring = await db.recurringTasks.where('active').equals(1).toArray();
 */
export const db = new ShaDatabase();

/**
 * Helper function to clear all data from the database
 * Useful for testing or implementing a "clear all data" feature
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.tasks, db.recurringTasks, db.settings], async () => {
    await db.tasks.clear();
    await db.recurringTasks.clear();
    await db.settings.clear();
  });
}

/**
 * Helper function to get a setting value by key
 *
 * @param key - The setting key to retrieve
 * @returns The setting value or undefined if not found
 */
export async function getSetting(key: Setting['key']): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

/**
 * Helper function to set a setting value
 *
 * @param key - The setting key
 * @param value - The value to store
 */
export async function setSetting(key: Setting['key'], value: string): Promise<void> {
  await db.settings.put({ key, value });
}
