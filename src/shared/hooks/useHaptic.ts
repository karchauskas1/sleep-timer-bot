/**
 * useHaptic - Focused hook for haptic feedback in Telegram Mini Apps
 *
 * Provides a simple, ergonomic API for triggering haptic feedback.
 * All methods have graceful fallbacks for platforms that don't support
 * haptic feedback (notably Android devices).
 *
 * Haptic feedback types:
 * - Impact (light, medium, heavy): For physical actions like button taps
 * - Notification (success, error, warning): For action outcomes
 * - Selection: For picker/scroll value changes
 *
 * @example
 * // Basic usage
 * const haptic = useHaptic();
 * haptic.success(); // Task completed
 * haptic.light();   // Selection change
 *
 * @example
 * // In a task completion handler
 * const haptic = useHaptic();
 * const handleComplete = () => {
 *   completeTask(taskId);
 *   haptic.success();
 * };
 *
 * @example
 * // In a swipe delete action
 * const haptic = useHaptic();
 * const handleDelete = () => {
 *   deleteTask(taskId);
 *   haptic.light();
 * };
 *
 * @example
 * // In a timer start
 * const haptic = useHaptic();
 * const handleStart = () => {
 *   startTimer();
 *   haptic.medium();
 * };
 */

import WebApp from '@twa-dev/sdk';

// =============================================================================
// Types
// =============================================================================

/**
 * Impact intensity levels for physical feedback
 */
type ImpactStyle = 'light' | 'medium' | 'heavy';

/**
 * Notification types for outcome feedback
 */
type NotificationType = 'success' | 'error' | 'warning';

/**
 * Haptic feedback methods returned by the hook
 */
interface UseHapticResult {
  /**
   * Light impact feedback
   * Use for: selection changes, scroll snapping, minor interactions
   */
  light: () => void;

  /**
   * Medium impact feedback
   * Use for: button taps, timer start, confirming actions
   */
  medium: () => void;

  /**
   * Heavy impact feedback
   * Use for: significant actions, major confirmations
   */
  heavy: () => void;

  /**
   * Success notification feedback
   * Use for: task completion, successful actions
   */
  success: () => void;

  /**
   * Error notification feedback
   * Use for: failed actions, validation errors
   */
  error: () => void;

  /**
   * Warning notification feedback
   * Use for: warnings, caution states
   */
  warning: () => void;

  /**
   * Selection changed feedback
   * Use for: picker value changes, scroll selections
   */
  selectionChanged: () => void;

  /**
   * Generic impact feedback with configurable intensity
   * @param style - Impact intensity ('light' | 'medium' | 'heavy')
   */
  impact: (style: ImpactStyle) => void;

  /**
   * Generic notification feedback with configurable type
   * @param type - Notification type ('success' | 'error' | 'warning')
   */
  notification: (type: NotificationType) => void;

  /**
   * Check if haptic feedback is supported on current platform
   */
  isSupported: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if haptic feedback is supported
 * Haptic feedback has limited support on Android devices
 */
function checkHapticSupport(): boolean {
  try {
    return !!(
      WebApp.HapticFeedback &&
      typeof WebApp.HapticFeedback.impactOccurred === 'function' &&
      typeof WebApp.HapticFeedback.notificationOccurred === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Safely trigger impact feedback
 */
function triggerImpact(style: ImpactStyle): void {
  try {
    WebApp.HapticFeedback.impactOccurred(style);
  } catch {
    // Silently fail - haptic is enhancement, not requirement
  }
}

/**
 * Safely trigger notification feedback
 */
function triggerNotification(type: NotificationType): void {
  try {
    WebApp.HapticFeedback.notificationOccurred(type);
  } catch {
    // Silently fail - haptic is enhancement, not requirement
  }
}

/**
 * Safely trigger selection changed feedback
 */
function triggerSelectionChanged(): void {
  try {
    WebApp.HapticFeedback.selectionChanged();
  } catch {
    // Silently fail - haptic is enhancement, not requirement
  }
}

// =============================================================================
// Hook
// =============================================================================

// Cache support check result (won't change during session)
let cachedSupport: boolean | null = null;

function getHapticSupport(): boolean {
  if (cachedSupport === null) {
    cachedSupport = checkHapticSupport();
  }
  return cachedSupport;
}

/**
 * Hook for haptic feedback in Telegram Mini Apps
 *
 * Returns an object with methods for triggering different types
 * of haptic feedback. All methods are safe to call even on
 * platforms that don't support haptic feedback.
 *
 * @returns Object with haptic feedback methods
 */
export function useHaptic(): UseHapticResult {
  const isSupported = getHapticSupport();

  // No-op function for unsupported environments
  const noop = () => {};

  // If not supported, return no-op functions
  if (!isSupported) {
    return {
      light: noop,
      medium: noop,
      heavy: noop,
      success: noop,
      error: noop,
      warning: noop,
      selectionChanged: noop,
      impact: noop,
      notification: noop,
      isSupported: false,
    };
  }

  return {
    // Impact feedback methods
    light: () => triggerImpact('light'),
    medium: () => triggerImpact('medium'),
    heavy: () => triggerImpact('heavy'),

    // Notification feedback methods
    success: () => triggerNotification('success'),
    error: () => triggerNotification('error'),
    warning: () => triggerNotification('warning'),

    // Selection feedback
    selectionChanged: triggerSelectionChanged,

    // Generic methods for dynamic usage
    impact: (style: ImpactStyle) => triggerImpact(style),
    notification: (type: NotificationType) => triggerNotification(type),

    // Support flag
    isSupported: true,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { UseHapticResult, ImpactStyle, NotificationType };
