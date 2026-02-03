/**
 * useOnboarding - Hook to manage onboarding state for first-time users
 *
 * Provides state management for the onboarding flow with localStorage persistence.
 * Tracks whether the user has completed the onboarding and provides a function
 * to mark it as completed.
 *
 * Features:
 * - Persists completion state to localStorage
 * - Graceful fallback if localStorage unavailable
 * - Simple API: { isCompleted, completeOnboarding }
 *
 * @example
 * // Basic usage in App.tsx
 * const { isCompleted, completeOnboarding } = useOnboarding();
 *
 * if (!isCompleted) {
 *   return <Onboarding onComplete={completeOnboarding} />;
 * }
 *
 * return <Router />;
 *
 * @example
 * // In Onboarding component
 * const { completeOnboarding } = useOnboarding();
 *
 * const handleSkip = () => {
 *   completeOnboarding();
 * };
 *
 * const handleFinish = () => {
 *   completeOnboarding();
 * };
 */

import { useState, useCallback } from 'react';
import type { OnboardingState } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Storage key for persisting onboarding completion state
 */
const STORAGE_KEY = 'sha_onboarding_completed';

/**
 * Value stored when onboarding is completed
 */
const COMPLETED_VALUE = 'true';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if onboarding has been completed
 * @returns true if onboarding was previously completed, false otherwise
 */
function getOnboardingCompleted(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === COMPLETED_VALUE;
  } catch {
    // localStorage might not be available
    return false;
  }
}

/**
 * Mark onboarding as completed in localStorage
 */
function saveOnboardingCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, COMPLETED_VALUE);
  } catch {
    // localStorage might not be available - silently fail
    // User will see onboarding again next session, but that's acceptable
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing onboarding state
 *
 * Returns the current completion state and a function to mark onboarding
 * as completed. State is persisted to localStorage so users only see
 * onboarding once.
 *
 * @returns Object with isCompleted flag and completeOnboarding function
 */
export function useOnboarding(): OnboardingState {
  // Initialize state from localStorage
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return getOnboardingCompleted();
  });

  // Memoized function to complete onboarding
  const completeOnboarding = useCallback(() => {
    saveOnboardingCompleted();
    setIsCompleted(true);
  }, []);

  return {
    isCompleted,
    completeOnboarding,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { OnboardingState };
