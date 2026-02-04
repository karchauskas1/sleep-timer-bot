/**
 * ToolCard - Interactive card component for displaying tool options on home screen
 *
 * A tappable card that represents a tool/module (Planner, Sleep, Timer).
 * Used on the HomeScreen to provide scalable navigation to different app modules.
 *
 * Features:
 * - Large, accessible touch target (minimum 44px)
 * - Icon with label for each tool
 * - Blue accent theme with subtle gradients
 * - Framer Motion scale animation on tap
 * - Haptic feedback on interaction
 * - Supports reduced motion preferences
 *
 * @example
 * // Basic usage
 * <ToolCard
 *   id="planner"
 *   title="Планы"
 *   icon={<ChecklistIcon />}
 *   onSelect={() => navigateTo('planner')}
 * />
 *
 * @example
 * // With description
 * <ToolCard
 *   id="sleep"
 *   title="Сон"
 *   description="Калькулятор сна"
 *   icon={<MoonIcon />}
 *   onSelect={() => navigateTo('sleep')}
 * />
 */

import { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useHaptic } from '@/shared/hooks/useHaptic';
import type { ModuleId } from '@/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for card interactions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for card hover/tap states
 */
const cardVariants = {
  initial: { scale: 1 },
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

// =============================================================================
// Icons
// =============================================================================

/**
 * Checklist icon for Planner tool
 */
function ChecklistIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

/**
 * Moon icon for Sleep tool
 */
function MoonIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

/**
 * Timer/Clock icon for Timer tool
 */
function TimerIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * Settings/Gear icon for Settings tool (if needed in future)
 */
function SettingsIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  );
}

// =============================================================================
// Types
// =============================================================================

/**
 * Tool configuration for each card type
 */
interface ToolConfig {
  id: ModuleId;
  title: string;
  description?: string;
  Icon: React.FC;
}

/**
 * Props for the ToolCard component
 */
interface ToolCardProps {
  /** Tool module ID */
  id: ModuleId;
  /** Display title for the tool */
  title: string;
  /** Optional description text */
  description?: string;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Callback when the card is tapped */
  onSelect: () => void;
  /** Optional additional CSS class name */
  className?: string;
}

// =============================================================================
// Tool Configurations
// =============================================================================

/**
 * Default tool configurations
 * Used when icon prop is not provided
 */
const TOOL_ICONS: Record<string, React.FC> = {
  planner: ChecklistIcon,
  sleep: MoonIcon,
  timer: TimerIcon,
  settings: SettingsIcon,
};

// =============================================================================
// Component
// =============================================================================

/**
 * ToolCard component for displaying a selectable tool option
 *
 * Renders a card with an icon, title, and optional description.
 * Tapping the card triggers navigation to the corresponding module.
 *
 * @param props - Component props
 * @param props.id - Tool module identifier
 * @param props.title - Display title
 * @param props.description - Optional description text
 * @param props.icon - Optional custom icon (uses default if not provided)
 * @param props.onSelect - Selection callback
 * @param props.className - Optional CSS class
 */
export function ToolCard({
  id,
  title,
  description,
  icon,
  onSelect,
  className,
}: ToolCardProps) {
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();

  // Handle card tap with haptic feedback
  const handleTap = useCallback(() => {
    haptic.light();
    onSelect();
  }, [haptic, onSelect]);

  // Get default icon if not provided
  const IconComponent = TOOL_ICONS[id];
  const iconElement = icon ?? (IconComponent ? <IconComponent /> : null);

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      className={className}
      variants={cardVariants}
      initial="initial"
      whileTap={prefersReducedMotion ? undefined : 'tap'}
      whileHover={prefersReducedMotion ? undefined : 'hover'}
      transition={ANIMATION_CONFIG}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        width: '100%',
        padding: 'var(--space-xl) var(--space-lg)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        fontFamily: 'var(--font-family)',
        transition: 'var(--transition-colors)',
        minHeight: 120,
      }}
      aria-label={`${title}${description ? ` - ${description}` : ''}`}
    >
      {/* Icon Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-home-accent)',
          color: 'var(--color-text-inverse)',
        }}
      >
        {iconElement}
      </div>

      {/* Text Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        {/* Title */}
        <span
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
            letterSpacing: 'var(--letter-spacing-tight)',
          }}
        >
          {title}
        </span>

        {/* Description (optional) */}
        {description && (
          <span
            style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-normal)',
              textAlign: 'center',
            }}
          >
            {description}
          </span>
        )}
      </div>
    </motion.button>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { ToolCardProps, ToolConfig };
export { ChecklistIcon, MoonIcon, TimerIcon, SettingsIcon };
