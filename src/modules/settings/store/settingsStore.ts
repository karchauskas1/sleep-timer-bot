/**
 * Settings Store - Zustand store for application settings state management
 *
 * This store manages all settings-related state with IndexedDB persistence.
 * All changes are immediately synced to Dexie for offline-first support.
 *
 * @example
 * // Access store in components
 * import { useSettingsStore } from '@/modules/settings/store/settingsStore';
 *
 * function SettingsScreen() {
 *   const sleepOnsetMinutes = useSettingsStore((state) => state.sleepOnsetMinutes);
 *   const setSleepOnsetMinutes = useSettingsStore((state) => state.setSleepOnsetMinutes);
 *   // ...
 * }
 */

import { create } from 'zustand';
import { db } from '@/shared/utils/storage';
import { registerHydrationCallback } from '@/shared/hooks/useStoreHydration';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default sleep onset time in minutes
 * Based on average time it takes most people to fall asleep
 */
const DEFAULT_SLEEP_ONSET_MINUTES = 14;

/**
 * Minimum allowed sleep onset time in minutes
 */
const MIN_SLEEP_ONSET_MINUTES = 1;

/**
 * Maximum allowed sleep onset time in minutes
 */
const MAX_SLEEP_ONSET_MINUTES = 60;

// =============================================================================
// Types
// =============================================================================

/**
 * Settings store state interface
 */
interface SettingsState {
  // State
  /** Time to fall asleep in minutes (1-60) */
  sleepOnsetMinutes: number;

  // Actions
  /** Set sleep onset time in minutes */
  setSleepOnsetMinutes: (minutes: number) => void;

  // Bulk Actions
  /** Set sleep onset minutes (used for hydration) */
  hydrateSleepOnsetMinutes: (minutes: number) => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Settings Zustand store
 *
 * All state modifications are persisted to IndexedDB immediately.
 * The store is hydrated from IndexedDB on app startup via registerHydrationCallback.
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  // -------------------------------------------------------------------------
  // Initial State
  // -------------------------------------------------------------------------
  sleepOnsetMinutes: DEFAULT_SLEEP_ONSET_MINUTES,

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  setSleepOnsetMinutes: (minutes) => {
    // Validate range
    const validatedMinutes = Math.min(
      MAX_SLEEP_ONSET_MINUTES,
      Math.max(MIN_SLEEP_ONSET_MINUTES, minutes)
    );

    set({ sleepOnsetMinutes: validatedMinutes });

    // Persist to IndexedDB
    db.settings.put({
      key: 'sleepOnsetMinutes',
      value: String(validatedMinutes),
    });
  },

  // -------------------------------------------------------------------------
  // Bulk Actions (Hydration)
  // -------------------------------------------------------------------------

  hydrateSleepOnsetMinutes: (minutes) => {
    set({ sleepOnsetMinutes: minutes });
  },
}));

// =============================================================================
// Hydration
// =============================================================================

/**
 * Register hydration callback to load settings from IndexedDB on app startup
 */
registerHydrationCallback(() => {
  // Load sleepOnsetMinutes from IndexedDB asynchronously
  db.settings.get('sleepOnsetMinutes').then((sleepOnsetSetting) => {
    if (sleepOnsetSetting) {
      const minutes = parseInt(sleepOnsetSetting.value, 10);

      // Validate and set
      if (!isNaN(minutes) && minutes >= MIN_SLEEP_ONSET_MINUTES && minutes <= MAX_SLEEP_ONSET_MINUTES) {
        useSettingsStore.getState().hydrateSleepOnsetMinutes(minutes);
      }
    }
  });
});

// =============================================================================
// Exports
// =============================================================================

/**
 * Export constants for use in components
 */
export { DEFAULT_SLEEP_ONSET_MINUTES, MIN_SLEEP_ONSET_MINUTES, MAX_SLEEP_ONSET_MINUTES };
