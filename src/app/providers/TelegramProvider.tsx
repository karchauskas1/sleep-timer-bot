/**
 * TelegramProvider - Telegram Web App integration provider
 *
 * This provider initializes the Telegram Web App SDK and provides
 * access to Telegram-specific functionality throughout the app:
 * - WebApp initialization (ready, expand)
 * - Color scheme detection (light/dark)
 * - Haptic feedback methods
 * - App close functionality
 *
 * @example
 * // Wrap your app with TelegramProvider
 * <TelegramProvider>
 *   <App />
 * </TelegramProvider>
 *
 * @example
 * // Use the hook in components
 * const { colorScheme, haptic, close } = useTelegramContext();
 * haptic.success(); // Trigger success haptic
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import WebApp from '@twa-dev/sdk';
import type { ThemeValue, HapticType } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Haptic feedback methods available through the provider
 */
interface HapticMethods {
  /** Light impact - for selection changes */
  light: () => void;
  /** Medium impact - for button presses, timer start */
  medium: () => void;
  /** Heavy impact - for significant actions */
  heavy: () => void;
  /** Success notification - for completed tasks */
  success: () => void;
  /** Error notification - for errors */
  error: () => void;
  /** Warning notification - for warnings */
  warning: () => void;
}

/**
 * Telegram context value provided to consumers
 */
interface TelegramContextValue {
  /** Whether the Telegram WebApp SDK is initialized */
  isReady: boolean;
  /** Current color scheme from Telegram ('light' | 'dark') */
  colorScheme: ThemeValue;
  /** Haptic feedback methods */
  haptic: HapticMethods;
  /** Close the Mini App */
  close: () => void;
  /** Expand the Mini App to full height */
  expand: () => void;
  /** Disable vertical swipes (prevents swipe-to-close during scroll interactions) */
  disableVerticalSwipes: () => void;
  /** Re-enable vertical swipes (restore normal swipe-to-close behavior) */
  enableVerticalSwipes: () => void;
  /** User data from Telegram (if available) */
  user: typeof WebApp.initDataUnsafe.user | undefined;
  /** Platform the app is running on */
  platform: string;
}

/**
 * Props for TelegramProvider component
 */
interface TelegramProviderProps {
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

/**
 * React context for Telegram functionality
 * Default value is undefined - must be used within TelegramProvider
 */
const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

// =============================================================================
// Haptic Feedback Helpers
// =============================================================================

/**
 * Check if haptic feedback is supported
 * Haptic feedback has limited support on Android devices
 */
function isHapticSupported(): boolean {
  try {
    // Check if HapticFeedback is available and has methods
    return !!(
      WebApp.HapticFeedback &&
      typeof WebApp.HapticFeedback.impactOccurred === 'function'
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
  };
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * TelegramProvider component
 *
 * Initializes Telegram WebApp SDK and provides context to child components.
 * Should be placed near the root of your app.
 *
 * On mount:
 * - Calls WebApp.ready() to signal the app is ready
 * - Calls WebApp.expand() to maximize the app height
 * - Sets up color scheme tracking
 *
 * @param props - Component props
 * @param props.children - Child components to render
 */
export function TelegramProvider({ children }: TelegramProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<ThemeValue>(
    (WebApp.colorScheme as ThemeValue) || 'light'
  );

  // Initialize WebApp on mount
  useEffect(() => {
    // Signal that the app is ready to be displayed
    WebApp.ready();

    // Expand to full available height
    WebApp.expand();

    // Mark as ready
    setIsReady(true);

    // Listen for theme changes from Telegram
    const handleThemeChange = () => {
      setColorScheme((WebApp.colorScheme as ThemeValue) || 'light');
    };

    // Subscribe to theme changes
    WebApp.onEvent('themeChanged', handleThemeChange);

    // Cleanup on unmount
    return () => {
      WebApp.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  // Memoized haptic methods - created once
  const haptic = createHapticMethods();

  // Close the Mini App
  const close = useCallback(() => {
    try {
      WebApp.close();
    } catch {
      // Silently fail if close not available (e.g., in browser testing)
    }
  }, []);

  // Expand the Mini App to full height
  const expand = useCallback(() => {
    try {
      WebApp.expand();
    } catch {
      // Silently fail if expand not available
    }
  }, []);

  // Disable vertical swipes (prevents swipe-to-close during scroll interactions)
  const disableVerticalSwipes = useCallback(() => {
    try {
      if (typeof WebApp.disableVerticalSwipes === 'function') {
        WebApp.disableVerticalSwipes();
      }
    } catch {
      // Silently fail if not supported (e.g., in browser testing)
    }
  }, []);

  // Re-enable vertical swipes (restore normal swipe-to-close behavior)
  const enableVerticalSwipes = useCallback(() => {
    try {
      if (typeof WebApp.enableVerticalSwipes === 'function') {
        WebApp.enableVerticalSwipes();
      }
    } catch {
      // Silently fail if not supported (e.g., in browser testing)
    }
  }, []);

  // Context value with all Telegram functionality
  const value: TelegramContextValue = {
    isReady,
    colorScheme,
    haptic,
    close,
    expand,
    disableVerticalSwipes,
    enableVerticalSwipes,
    user: WebApp.initDataUnsafe?.user,
    platform: WebApp.platform || 'unknown',
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access Telegram context
 *
 * Must be used within a TelegramProvider. Throws an error if used outside.
 *
 * @returns The Telegram context value
 *
 * @example
 * function MyComponent() {
 *   const { colorScheme, haptic } = useTelegramContext();
 *
 *   const handleComplete = () => {
 *     haptic.success();
 *     // ... complete task logic
 *   };
 *
 *   return (
 *     <button onClick={handleComplete}>
 *       Complete
 *     </button>
 *   );
 * }
 */
export function useTelegramContext(): TelegramContextValue {
  const context = useContext(TelegramContext);

  if (context === undefined) {
    throw new Error('useTelegramContext must be used within a TelegramProvider');
  }

  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { TelegramContextValue, HapticMethods, TelegramProviderProps };
