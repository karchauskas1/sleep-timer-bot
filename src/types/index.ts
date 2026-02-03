/**
 * Type definitions for the ЩА (SHA) Telegram Mini App
 */

import type { ReactNode } from 'react';

// =============================================================================
// Task Types
// =============================================================================

/**
 * A single task in the planner module
 */
export interface Task {
  /** Unique identifier (UUID) */
  id: string;
  /** Task description text */
  text: string;
  /** Date assigned to task in YYYY-MM-DD format */
  date: string;
  /** Whether the task has been completed */
  completed: boolean;
  /** ISO 8601 timestamp when the task was created */
  createdAt: string;
  /** Optional reference to the recurring task that generated this instance */
  recurringId?: string;
}

/**
 * Schedule configuration for recurring tasks
 */
export interface RecurringSchedule {
  /** Days of week when task should occur (0=Sun, 1=Mon, ..., 6=Sat) */
  days: number[];
  /** Optional specific time in HH:mm format */
  time?: string;
  /** Optional end date in YYYY-MM-DD format */
  endDate?: string;
}

/**
 * A recurring task that generates task instances on specified days
 */
export interface RecurringTask {
  /** Unique identifier (UUID) */
  id: string;
  /** Task description text */
  text: string;
  /** Schedule configuration */
  schedule: RecurringSchedule;
  /** Whether the recurring task is currently active */
  active: boolean;
  /** ISO 8601 timestamp when the recurring task was created */
  createdAt: string;
}

// =============================================================================
// Timer Types
// =============================================================================

/**
 * State of the timer module
 */
export interface TimerState {
  /** Remaining time in seconds */
  remaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Original duration in seconds (for reset) */
  duration: number;
  /** ISO 8601 timestamp when timer was started (for background persistence) */
  startedAt?: string;
}

// =============================================================================
// Settings Types
// =============================================================================

/**
 * Valid setting keys for the application
 */
export type SettingKey = 'lastModule' | 'theme';

/**
 * Module identifiers for navigation
 */
export type ModuleId = 'planner' | 'sleep' | 'timer';

/**
 * Theme options
 */
export type ThemeValue = 'light' | 'dark';

/**
 * A key-value setting stored in IndexedDB
 */
export interface Setting {
  /** Setting identifier */
  key: SettingKey;
  /** Setting value */
  value: string;
}

// =============================================================================
// Sleep Calculator Types
// =============================================================================

/**
 * Sleep calculator modes
 */
export type SleepMode = 'bedtime' | 'waketime';

/**
 * A calculated sleep/wake time option
 */
export interface SleepOption {
  /** The calculated time */
  time: Date;
  /** Number of sleep cycles */
  cycles: number;
}

// =============================================================================
// UI Component Types
// =============================================================================

/**
 * Swipe action types for SwipeableRow component
 */
export type SwipeAction = 'postpone' | 'delete' | 'none';

/**
 * Haptic feedback intensity levels
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

// =============================================================================
// Onboarding Types
// =============================================================================

/**
 * A single slide in the onboarding flow
 */
export interface OnboardingSlide {
  /** Unique identifier for the slide */
  id: string;
  /** Slide title text */
  title: string;
  /** Slide description text */
  description: string;
  /** Visual content (React component or image) for the slide */
  illustration: ReactNode;
}

/**
 * State of the onboarding flow
 */
export interface OnboardingState {
  /** Whether the user has completed onboarding */
  isCompleted: boolean;
  /** Function to mark onboarding as completed */
  completeOnboarding: () => void;
}
