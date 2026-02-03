/**
 * ThemeProvider - Theme management provider based on Telegram colorScheme
 *
 * This provider applies CSS custom properties by setting the `data-theme`
 * attribute on the document root element. It syncs with Telegram's
 * colorScheme to provide light/dark theme support.
 *
 * The provider works in conjunction with tokens.css which defines
 * CSS variables for both themes using:
 * - :root { ... } for light theme (default)
 * - [data-theme="dark"] { ... } for dark theme
 *
 * @example
 * // Wrap your app with ThemeProvider (inside TelegramProvider)
 * <TelegramProvider>
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * </TelegramProvider>
 *
 * @example
 * // Use the hook in components
 * const { theme, isDark } = useTheme();
 */

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useTelegramContext } from './TelegramProvider';
import type { ThemeValue } from '@/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Theme context value provided to consumers
 */
interface ThemeContextValue {
  /** Current theme ('light' | 'dark') */
  theme: ThemeValue;
  /** Whether the current theme is dark */
  isDark: boolean;
  /** Whether the current theme is light */
  isLight: boolean;
}

/**
 * Props for ThemeProvider component
 */
interface ThemeProviderProps {
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

/**
 * React context for theme functionality
 * Default value is undefined - must be used within ThemeProvider
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// Theme Application Helper
// =============================================================================

/**
 * Apply theme to the document root element
 *
 * Sets the data-theme attribute which triggers CSS custom property changes
 * defined in tokens.css. Also sets color-scheme for browser defaults.
 *
 * @param theme - The theme to apply ('light' | 'dark')
 */
function applyTheme(theme: ThemeValue): void {
  const root = document.documentElement;

  // Set data-theme attribute for CSS variable switching
  root.setAttribute('data-theme', theme);

  // Set color-scheme for browser defaults (scrollbars, form controls, etc.)
  root.style.colorScheme = theme;

  // Set meta theme-color for browser chrome
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    // Use background color from design tokens
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#0A0A0A' : '#FAFAFA'
    );
  }
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * ThemeProvider component
 *
 * Syncs the application theme with Telegram's colorScheme setting.
 * Applies theme by setting the data-theme attribute on document.documentElement.
 *
 * Must be used within a TelegramProvider to access colorScheme.
 *
 * Features:
 * - Automatically syncs with Telegram theme changes
 * - Sets data-theme attribute for CSS custom property switching
 * - Sets color-scheme CSS property for browser defaults
 * - Updates meta theme-color for browser chrome
 *
 * @param props - Component props
 * @param props.children - Child components to render
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Get colorScheme from Telegram context
  const { colorScheme } = useTelegramContext();

  // Apply theme whenever colorScheme changes
  useEffect(() => {
    applyTheme(colorScheme);
  }, [colorScheme]);

  // Apply initial theme on mount (before first render paint)
  // This prevents flash of wrong theme
  useEffect(() => {
    applyTheme(colorScheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value with theme information
  const value: ThemeContextValue = {
    theme: colorScheme,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access theme context
 *
 * Must be used within a ThemeProvider. Throws an error if used outside.
 *
 * @returns The theme context value
 *
 * @example
 * function MyComponent() {
 *   const { theme, isDark } = useTheme();
 *
 *   return (
 *     <div className={isDark ? 'text-white' : 'text-black'}>
 *       Current theme: {theme}
 *     </div>
 *   );
 * }
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { ThemeContextValue, ThemeProviderProps };
