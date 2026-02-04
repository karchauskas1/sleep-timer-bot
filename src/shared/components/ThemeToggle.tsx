/**
 * ThemeToggle - Day/night mode toggle button component
 *
 * A compact toggle button for switching between light and dark themes.
 * Designed to be placed in the top-right corner of screens (like HomeScreen).
 *
 * Features:
 * - Sun/moon icons indicating current theme
 * - Smooth rotation animation on toggle
 * - Haptic feedback on interaction
 * - Persists theme preference to localStorage
 * - Applies theme immediately via data-theme attribute
 * - Falls back to system/Telegram preference on first load
 *
 * @example
 * // Basic usage in a header
 * <header style={{ display: 'flex', justifyContent: 'flex-end' }}>
 *   <ThemeToggle />
 * </header>
 *
 * @example
 * // With custom styling
 * <ThemeToggle className="my-toggle" />
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';
import type { ThemeValue } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Storage key for persisting theme preference
 */
const THEME_STORAGE_KEY = 'sha_theme_override';

/**
 * Animation configuration for the toggle
 */
const ANIMATION_CONFIG = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1] as const,
};

// =============================================================================
// Icons
// =============================================================================

/**
 * Sun icon for light theme indication
 * Shows when the theme is currently dark (click to switch to light)
 */
function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark theme indication
 * Shows when the theme is currently light (click to switch to dark)
 */
function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the ThemeToggle component
 */
interface ThemeToggleProps {
  /** Optional additional CSS class name */
  className?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the stored theme preference from localStorage
 * Returns null if no preference is stored
 */
function getStoredTheme(): ThemeValue | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage might not be available
  }
  return null;
}

/**
 * Save theme preference to localStorage
 */
function saveTheme(theme: ThemeValue): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Get the current theme from the document
 * Falls back to 'light' if not set
 */
function getCurrentDocumentTheme(): ThemeValue {
  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme === 'dark') return 'dark';
  return 'light';
}

/**
 * Apply theme to the document root element
 * Mirrors the logic from ThemeProvider
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
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#0A0A0A' : '#FAFAFA'
    );
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * ThemeToggle component for day/night mode switching
 *
 * A minimal button that toggles between light and dark themes.
 * Displays a sun icon when in dark mode (click for light),
 * and a moon icon when in light mode (click for dark).
 *
 * The toggle persists the user's preference to localStorage,
 * allowing it to override the system/Telegram theme on return visits.
 *
 * @param props - Component props
 * @param props.className - Optional CSS class name
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();

  // Initialize theme from stored preference or current document theme
  const [theme, setTheme] = useState<ThemeValue>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    return getCurrentDocumentTheme();
  });

  // Sync theme state with document on mount
  // This handles the case where ThemeProvider sets the theme before this component mounts
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      // User has a stored preference, apply it
      applyTheme(stored);
      setTheme(stored);
    } else {
      // No stored preference, sync with current document theme
      setTheme(getCurrentDocumentTheme());
    }
  }, []);

  // Handle theme toggle
  const handleToggle = useCallback(() => {
    const newTheme: ThemeValue = theme === 'light' ? 'dark' : 'light';

    // Apply theme immediately
    applyTheme(newTheme);

    // Update state
    setTheme(newTheme);

    // Persist preference
    saveTheme(newTheme);

    // Haptic feedback
    haptic.light();
  }, [theme, haptic]);

  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'var(--min-touch-target)',
        height: 'var(--min-touch-target)',
        padding: 0,
        border: 'none',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
      }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
          scale: 1,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : ANIMATION_CONFIG
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </motion.div>
    </motion.button>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { ThemeToggleProps };

/**
 * Export utility for clearing stored theme preference
 * Useful for testing or resetting to system default
 */
export function clearStoredTheme(): void {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // localStorage might not be available
  }
}
