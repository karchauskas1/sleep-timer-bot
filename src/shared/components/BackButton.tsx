/**
 * BackButton - Navigation button to return to home screen from modules
 *
 * A compact back button for navigating from tool modules back to the home screen.
 * Designed to be placed in the top-left corner of module screens.
 *
 * Features:
 * - Chevron left icon indicating back navigation
 * - Subtle scale animation on tap
 * - Haptic feedback on interaction
 * - Optional label for accessibility
 * - Minimum touch target size for mobile usability
 *
 * @example
 * // Basic usage in a module header
 * <BackButton onBack={() => setCurrentModule('home')} />
 *
 * @example
 * // With custom label
 * <BackButton onBack={handleBack} label="Домой" />
 *
 * @example
 * // In a header layout with ThemeToggle
 * <header style={{ display: 'flex', justifyContent: 'space-between' }}>
 *   <BackButton onBack={() => navigate('home')} />
 *   <ThemeToggle />
 * </header>
 */

import { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Icons
// =============================================================================

/**
 * Chevron left icon for back navigation
 * Uses currentColor for theme compatibility
 */
function ChevronLeftIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the BackButton component
 */
interface BackButtonProps {
  /** Callback when the back button is pressed */
  onBack: () => void;
  /** Optional visible label text (shown next to icon) */
  label?: string;
  /** Optional additional CSS class name */
  className?: string;
  /** Optional aria-label override (defaults to "Go back" or "Go back to {label}") */
  ariaLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * BackButton component for returning to home screen from modules
 *
 * A minimal back button with a chevron icon that provides haptic feedback
 * and subtle animation on tap. Designed for the top-left corner of module screens.
 *
 * @param props - Component props
 * @param props.onBack - Callback function when back is pressed
 * @param props.label - Optional visible text label
 * @param props.className - Optional CSS class name
 * @param props.ariaLabel - Optional accessibility label override
 */
export function BackButton({
  onBack,
  label,
  className,
  ariaLabel,
}: BackButtonProps) {
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();

  // Handle back button press with haptic feedback
  const handleBack = useCallback(() => {
    haptic.light();
    onBack();
  }, [haptic, onBack]);

  // Determine aria-label for accessibility
  const accessibilityLabel = ariaLabel || (label ? `Go back to ${label}` : 'Go back');

  return (
    <motion.button
      type="button"
      onClick={handleBack}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-xs)',
        minWidth: 'var(--min-touch-target)',
        minHeight: 'var(--min-touch-target)',
        padding: label ? '0 var(--space-sm) 0 var(--space-xs)' : '0',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--font-weight-medium)',
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
        WebkitTapHighlightColor: 'transparent',
      }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'var(--color-bg-elevated)' }}
      aria-label={accessibilityLabel}
      title={accessibilityLabel}
    >
      <ChevronLeftIcon />
      {label && (
        <span
          style={{
            // Prevent text from shrinking on small screens
            flexShrink: 0,
          }}
        >
          {label}
        </span>
      )}
    </motion.button>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { BackButtonProps };
