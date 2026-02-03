/**
 * useStoreHydration - Hook to load IndexedDB data into Zustand stores on app startup
 *
 * This hook is critical for the offline-first architecture. It loads persisted
 * data from IndexedDB (Dexie) before the main app renders, ensuring the UI
 * displays the correct state immediately without a flash of empty content.
 *
 * @example
 * // In App.tsx
 * function App() {
 *   const isHydrated = useStoreHydration();
 *
 *   if (!isHydrated) {
 *     return null; // Or minimal loading state
 *   }
 *
 *   return <Router />;
 * }
 */

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/shared/utils/storage';
import type { Task, RecurringTask } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Data loaded from IndexedDB during hydration
 */
export interface HydrationData {
  /** All tasks from IndexedDB */
  tasks: Task[];
  /** All recurring tasks from IndexedDB */
  recurringTasks: RecurringTask[];
}

/**
 * Return type of the useStoreHydration hook
 */
export interface UseStoreHydrationResult {
  /** Whether hydration from IndexedDB is complete */
  isHydrated: boolean;
  /** Whether hydration encountered an error */
  hasError: boolean;
  /** The loaded data (available after hydration) */
  data: HydrationData | null;
  /** Function to manually trigger re-hydration */
  rehydrate: () => Promise<void>;
}

// =============================================================================
// Store Hydration Registry
// =============================================================================

/**
 * Type for store hydration callback functions
 * Stores register their hydration functions here
 */
type HydrationCallback = (data: HydrationData) => void;

/**
 * Registry of store hydration callbacks
 * Allows stores to register themselves for hydration
 */
const hydrationCallbacks: Set<HydrationCallback> = new Set();

/**
 * Register a callback to be called when hydration data is available
 * Used by Zustand stores to receive hydration data
 *
 * @param callback - Function to call with hydration data
 * @returns Unregister function
 *
 * @example
 * // In plannerStore.ts
 * import { registerHydrationCallback } from '@/shared/hooks/useStoreHydration';
 *
 * // Auto-hydrate when data is available
 * registerHydrationCallback((data) => {
 *   usePlannerStore.setState({
 *     tasks: data.tasks,
 *     recurringTasks: data.recurringTasks,
 *   });
 * });
 */
export function registerHydrationCallback(callback: HydrationCallback): () => void {
  hydrationCallbacks.add(callback);
  return () => {
    hydrationCallbacks.delete(callback);
  };
}

/**
 * Notify all registered stores with hydration data
 */
function notifyStores(data: HydrationData): void {
  hydrationCallbacks.forEach((callback) => {
    try {
      callback(data);
    } catch {
      // Silently continue with other callbacks if one fails
    }
  });
}

// =============================================================================
// Data Loading
// =============================================================================

/**
 * Load all data from IndexedDB
 * Performs parallel queries for optimal performance
 */
async function loadDataFromIndexedDB(): Promise<HydrationData> {
  // Load tasks and recurring tasks in parallel for faster startup
  const [tasks, recurringTasks] = await Promise.all([
    db.tasks.toArray(),
    db.recurringTasks.toArray(),
  ]);

  return {
    tasks,
    recurringTasks,
  };
}

// =============================================================================
// Global State for Single Hydration
// =============================================================================

/**
 * Global hydration state to ensure we only hydrate once across
 * multiple hook instances
 */
let globalHydrationPromise: Promise<HydrationData> | null = null;
let globalHydrationData: HydrationData | null = null;
let globalHydrationError = false;

/**
 * Perform hydration with deduplication
 * Multiple calls will share the same promise
 */
async function performHydration(): Promise<HydrationData> {
  // If already hydrated, return cached data
  if (globalHydrationData) {
    return globalHydrationData;
  }

  // If hydration is in progress, wait for it
  if (globalHydrationPromise) {
    return globalHydrationPromise;
  }

  // Start new hydration
  globalHydrationPromise = loadDataFromIndexedDB();

  try {
    const data = await globalHydrationPromise;
    globalHydrationData = data;
    globalHydrationError = false;

    // Notify all registered stores
    notifyStores(data);

    return data;
  } catch {
    globalHydrationError = true;
    globalHydrationPromise = null;
    throw new Error('Failed to hydrate from IndexedDB');
  }
}

/**
 * Force re-hydration (useful after data changes or for testing)
 */
async function forceRehydrate(): Promise<HydrationData> {
  // Reset global state
  globalHydrationPromise = null;
  globalHydrationData = null;
  globalHydrationError = false;

  // Perform fresh hydration
  return performHydration();
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to load IndexedDB data into Zustand stores on app startup
 *
 * This is the primary hook for app initialization. It ensures:
 * 1. Data is loaded from IndexedDB before rendering
 * 2. Zustand stores receive the hydration data
 * 3. Only one hydration occurs even with multiple hook instances
 *
 * Philosophy note: Per the spec, we return null (no loading spinner)
 * during hydration to maintain the "instant" feel. Hydration should
 * be fast enough (<100ms) that no visual indicator is needed.
 *
 * @returns Hydration state and data
 *
 * @example
 * // Simple usage - just check if ready
 * function App() {
 *   const { isHydrated } = useStoreHydration();
 *   if (!isHydrated) return null;
 *   return <Router />;
 * }
 *
 * @example
 * // Advanced usage - access loaded data
 * function App() {
 *   const { isHydrated, data, hasError } = useStoreHydration();
 *
 *   if (hasError) {
 *     // Handle hydration error (rare)
 *     return null;
 *   }
 *
 *   if (!isHydrated) return null;
 *
 *   console.log(`Loaded ${data?.tasks.length} tasks`);
 *   return <Router />;
 * }
 */
export function useStoreHydration(): UseStoreHydrationResult {
  const [isHydrated, setIsHydrated] = useState(!!globalHydrationData);
  const [hasError, setHasError] = useState(globalHydrationError);
  const [data, setData] = useState<HydrationData | null>(globalHydrationData);

  // Rehydrate function for manual triggering
  const rehydrate = useCallback(async () => {
    setIsHydrated(false);
    setHasError(false);

    try {
      const freshData = await forceRehydrate();
      setData(freshData);
      setIsHydrated(true);
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    // If already hydrated (from another hook instance), sync state
    if (globalHydrationData) {
      setData(globalHydrationData);
      setIsHydrated(true);
      setHasError(false);
      return;
    }

    // Start hydration
    let cancelled = false;

    performHydration()
      .then((hydrationData) => {
        if (!cancelled) {
          setData(hydrationData);
          setIsHydrated(true);
          setHasError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isHydrated,
    hasError,
    data,
    rehydrate,
  };
}

// =============================================================================
// Simple Hook (Matches Spec Pattern Exactly)
// =============================================================================

/**
 * Simple boolean hook for basic hydration check
 * Matches the spec's Pattern 1b exactly for simpler usage
 *
 * @returns true when hydration is complete
 *
 * @example
 * function App() {
 *   const isHydrated = useIsHydrated();
 *   if (!isHydrated) return null;
 *   return <Router />;
 * }
 */
export function useIsHydrated(): boolean {
  const { isHydrated } = useStoreHydration();
  return isHydrated;
}

// =============================================================================
// Exports
// =============================================================================

export { loadDataFromIndexedDB, forceRehydrate };
export type { HydrationCallback };
