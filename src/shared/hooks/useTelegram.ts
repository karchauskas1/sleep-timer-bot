/**
 * useTelegram - Standalone hook for Telegram Web App API access
 *
 * Provides direct access to Telegram WebApp functionality without requiring
 * the TelegramProvider context. Useful for components that need quick access
 * to Telegram APIs or for use outside the provider tree.
 *
 * For most cases, prefer using useTelegramContext() from TelegramProvider
 * as it provides reactive updates and proper lifecycle management.
 *
 * @example
 * // Basic usage
 * const { colorScheme, haptic, ready, close } = useTelegram();
 *
 * @example
 * // Trigger haptic feedback
 * const { haptic } = useTelegram();
 * haptic.success(); // Task completed
 * haptic.light();   // Selection change
 */

import WebApp from '@twa-dev/sdk';
import type { ThemeValue } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Haptic feedback methods available through the hook
 * All methods have graceful fallbacks for unsupported platforms (Android)
 */
interface HapticMethods {
  /** Light impact - for selection changes, scroll snapping */
  light: () => void;
  /** Medium impact - for button presses, timer start */
  medium: () => void;
  /** Heavy impact - for significant actions */
  heavy: () => void;
  /** Success notification - for completed tasks */
  success: () => void;
  /** Error notification - for errors, failed actions */
  error: () => void;
  /** Warning notification - for warnings */
  warning: () => void;
  /** Selection changed - for picker/scroll selection */
  selectionChanged: () => void;
}

/**
 * Return type of the useTelegram hook
 */
interface UseTelegramResult {
  /** Current color scheme from Telegram ('light' | 'dark') */
  colorScheme: ThemeValue;
  /** Haptic feedback methods */
  haptic: HapticMethods;
  /** Signal that the Mini App is ready to be displayed */
  ready: () => void;
  /** Close the Mini App */
  close: () => void;
  /** Expand the Mini App to full height */
  expand: () => void;
  /** Platform the app is running on */
  platform: string;
  /** Whether the app is running in Telegram environment */
  isTelegramEnv: boolean;
  /** User data from Telegram (if available) */
  user: typeof WebApp.initDataUnsafe.user | undefined;
  /** View port height */
  viewportHeight: number;
  /** View port stable height (excludes keyboard) */
  viewportStableHeight: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if haptic feedback is supported
 * Haptic feedback has limited support on Android devices
 */
function isHapticSupported(): boolean {
  try {
    return !!(
      WebApp.HapticFeedback &&
      typeof WebApp.HapticFeedback.impactOccurred === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Check if running in Telegram environment
 */
function checkTelegramEnv(): boolean {
  try {
    // Check for Telegram-specific properties
    return !!(
      WebApp.initData ||
      WebApp.initDataUnsafe?.query_id ||
      (typeof window !== 'undefined' && window.Telegram?.WebApp)
    );
  } catch {
    return false;
  }
}

/**
 * Create haptic feedback methods with graceful fallback
 * Returns no-op functions if haptic is not supported
 */
function createHapticMethods(): HapticMethods {
  const supported = isHapticSupported();

  // No-op function for unsupported environments
  const noop = () => {};

  if (!supported) {
    return {
      light: noop,
      medium: noop,
      heavy: noop,
      success: noop,
      error: noop,
      warning: noop,
      selectionChanged: noop,
    };
  }

  return {
    light: () => {
      try {
        WebApp.HapticFeedback.impactOccurred('light');
      } catch {
        // Silently fail if haptic not available
      }
    },
    medium: () => {
      try {
        WebApp.HapticFeedback.impactOccurred('medium');
      } catch {
        // Silently fail if haptic not available
      }
    },
    heavy: () => {
      try {
        WebApp.HapticFeedback.impactOccurred('heavy');
      } catch {
        // Silently fail if haptic not available
      }
    },
    success: () => {
      try {
        WebApp.HapticFeedback.notificationOccurred('success');
      } catch {
        // Silently fail if haptic not available
      }
    },
    error: () => {
      try {
        WebApp.HapticFeedback.notificationOccurred('error');
      } catch {
        // Silently fail if haptic not available
      }
    },
    warning: () => {
      try {
        WebApp.HapticFeedback.notificationOccurred('warning');
      } catch {
        // Silently fail if haptic not available
      }
    },
    selectionChanged: () => {
      try {
        WebApp.HapticFeedback.selectionChanged();
      } catch {
        // Silently fail if haptic not available
      }
    },
  };
}

// =============================================================================
// Hook
// =============================================================================

// Create haptic methods once (singleton pattern for performance)
const hapticMethods = createHapticMethods();

/**
 * Hook for direct access to Telegram Web App API
 *
 * Provides a lightweight way to access Telegram functionality.
 * All methods have graceful fallbacks for non-Telegram environments.
 *
 * @returns Object with Telegram WebApp methods and state
 */
export function useTelegram(): UseTelegramResult {
  // Get current color scheme (snapshot value)
  const colorScheme: ThemeValue = (WebApp.colorScheme as ThemeValue) || 'light';

  // Signal that app is ready to be displayed
  const ready = () => {
    try {
      WebApp.ready();
      WebApp.expand();
    } catch {
      // Silently fail if not in Telegram environment
    }
  };

  // Close the Mini App
  const close = () => {
    try {
      WebApp.close();
    } catch {
      // Silently fail if close not available
    }
  };

  // Expand to full height
  const expand = () => {
    try {
      WebApp.expand();
    } catch {
      // Silently fail if expand not available
    }
  };

  return {
    colorScheme,
    haptic: hapticMethods,
    ready,
    close,
    expand,
    platform: WebApp.platform || 'unknown',
    isTelegramEnv: checkTelegramEnv(),
    user: WebApp.initDataUnsafe?.user,
    viewportHeight: WebApp.viewportHeight || 0,
    viewportStableHeight: WebApp.viewportStableHeight || 0,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { UseTelegramResult, HapticMethods };
