/**
 * EmptyState - Minimal empty state display component
 *
 * Displays centered 'Пусто' text when there's no content to show.
 * Philosophy: empty state is normal. No motivation to fill. Just calm presence.
 *
 * Features:
 * - Minimal centered text
 * - No motivational messaging
 * - No icons or decorations
 * - Respects theme colors
 *
 * @example
 * // Basic usage
 * {tasks.length === 0 && <EmptyState />}
 *
 * @example
 * // With custom message
 * <EmptyState message="Нет задач" />
 *
 * @example
 * // Full height variant
 * <EmptyState fullHeight />
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the EmptyState component
 */
interface EmptyStateProps {
  /** Custom message to display (default: 'Пусто') */
  message?: string;
  /** Whether to take full available height */
  fullHeight?: boolean;
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * EmptyState component for displaying empty content
 *
 * Renders a minimal, centered message indicating no content.
 * Designed to feel like a calm surface, not a call to action.
 *
 * @param props - Component props
 * @param props.message - Optional custom message (default: 'Пусто')
 * @param props.fullHeight - Whether to fill available height
 * @param props.className - Additional CSS classes
 */
export function EmptyState({
  message = 'Пусто',
  fullHeight = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        minHeight: fullHeight ? '100%' : 'var(--space-4xl)',
        padding: 'var(--space-2xl) var(--space-md)',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-sm)',
          fontWeight: 'var(--font-weight-normal)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--letter-spacing-wide)',
        }}
      >
        {message}
      </span>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { EmptyStateProps };
