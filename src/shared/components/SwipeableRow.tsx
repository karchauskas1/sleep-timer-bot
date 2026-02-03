/**
 * SwipeableRow - Swipe gesture component with Framer Motion
 *
 * Provides horizontal swipe actions for task rows:
 * - Swipe right: Postpone action (reveals date options)
 * - Swipe left: Delete action
 *
 * Features:
 * - Smooth drag animation with Framer Motion
 * - Haptic feedback on action trigger
 * - Debounced actions to prevent double-triggers
 * - Visual feedback with action backgrounds
 * - Configurable threshold for action activation
 *
 * @example
 * // Basic usage with task
 * <SwipeableRow
 *   onSwipeLeft={() => deleteTask(task.id)}
 *   onSwipeRight={() => openPostponePicker(task.id)}
 * >
 *   <TaskItem task={task} />
 * </SwipeableRow>
 *
 * @example
 * // With custom labels
 * <SwipeableRow
 *   onSwipeLeft={handleDelete}
 *   onSwipeRight={handlePostpone}
 *   leftLabel="Удалить"
 *   rightLabel="Позже"
 * >
 *   <TaskItem task={task} />
 * </SwipeableRow>
 *
 * @example
 * // Disabled swipe (e.g., during editing)
 * <SwipeableRow
 *   onSwipeLeft={handleDelete}
 *   disabled={isEditing}
 * >
 *   <TaskItem task={task} />
 * </SwipeableRow>
 */

import { useRef, useCallback, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from 'framer-motion';
import type { SwipeAction } from '@/types';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Threshold in pixels to trigger swipe action
 * Based on --swipe-threshold: 80px from tokens.css
 */
const SWIPE_THRESHOLD = 80;

/**
 * Maximum drag distance (prevents over-swiping)
 */
const MAX_DRAG = 150;

/**
 * Animation configuration matching design system
 * Easing: cubic-bezier(0.16, 1, 0.3, 1) = [0.16, 1, 0.3, 1]
 */
const ANIMATION_CONFIG = {
  type: 'tween' as const,
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Debounce time to prevent rapid action triggers
 */
const DEBOUNCE_MS = 300;

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the SwipeableRow component
 */
interface SwipeableRowProps {
  /** Content to render inside the swipeable row */
  children: ReactNode;
  /** Callback when swiped left (delete action) */
  onSwipeLeft?: () => void;
  /** Callback when swiped right (postpone action) */
  onSwipeRight?: () => void;
  /** Label for left action (default: 'Удалить') */
  leftLabel?: string;
  /** Label for right action (default: 'Позже') */
  rightLabel?: string;
  /** Whether swipe is disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

/**
 * Internal state for tracking swipe direction
 */
type SwipeDirection = 'left' | 'right' | 'none';

// =============================================================================
// Component
// =============================================================================

/**
 * SwipeableRow component for swipe gestures
 *
 * Renders content with swipe-to-reveal action backgrounds.
 * Uses Framer Motion for smooth drag animations.
 *
 * @param props - Component props
 */
export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = 'Удалить',
  rightLabel = 'Позже',
  disabled = false,
  className = '',
  testId,
}: SwipeableRowProps) {
  const haptic = useHaptic();
  const controls = useAnimation();
  const x = useMotionValue(0);

  // Track last action time for debouncing
  const lastActionRef = useRef<number>(0);

  // Track if haptic has been triggered for current gesture
  const hapticTriggeredRef = useRef<SwipeDirection>('none');

  // Transform x position to action background opacity
  // Left swipe (negative x) shows delete background
  // Right swipe (positive x) shows postpone background
  const leftOpacity = useTransform(x, [-MAX_DRAG, -SWIPE_THRESHOLD, 0], [1, 0.7, 0]);
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD, MAX_DRAG], [0, 0.7, 1]);

  // Transform x position to scale for action icons/text
  const leftScale = useTransform(x, [-MAX_DRAG, -SWIPE_THRESHOLD, 0], [1, 0.9, 0.5]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD, MAX_DRAG], [0.5, 0.9, 1]);

  /**
   * Get current swipe direction based on x position
   */
  const getSwipeDirection = (xValue: number): SwipeDirection => {
    if (xValue <= -SWIPE_THRESHOLD) return 'left';
    if (xValue >= SWIPE_THRESHOLD) return 'right';
    return 'none';
  };

  /**
   * Handle drag update - trigger haptic when threshold is crossed
   */
  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const currentDirection = getSwipeDirection(info.offset.x);

      // Trigger haptic when crossing threshold (only once per direction)
      if (currentDirection !== hapticTriggeredRef.current) {
        if (currentDirection !== 'none') {
          haptic.light();
        }
        hapticTriggeredRef.current = currentDirection;
      }
    },
    [disabled, haptic]
  );

  /**
   * Handle drag end - trigger action or snap back
   */
  const handleDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const currentX = info.offset.x;
      const direction = getSwipeDirection(currentX);
      const now = Date.now();

      // Reset haptic trigger tracking
      hapticTriggeredRef.current = 'none';

      // Check debounce
      if (now - lastActionRef.current < DEBOUNCE_MS) {
        await controls.start({ x: 0 }, ANIMATION_CONFIG);
        return;
      }

      // Execute action based on direction
      if (direction === 'left' && onSwipeLeft) {
        lastActionRef.current = now;
        haptic.light();
        // Animate out to the left before triggering callback
        await controls.start({ x: -MAX_DRAG, opacity: 0 }, ANIMATION_CONFIG);
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        lastActionRef.current = now;
        haptic.light();
        // Snap back and trigger callback (postpone doesn't remove item)
        await controls.start({ x: 0 }, ANIMATION_CONFIG);
        onSwipeRight();
      } else {
        // Snap back to original position
        await controls.start({ x: 0 }, ANIMATION_CONFIG);
      }
    },
    [disabled, onSwipeLeft, onSwipeRight, controls, haptic]
  );

  /**
   * Get current swipe action for external consumers
   */
  const getCurrentAction = (): SwipeAction => {
    const xValue = x.get();
    if (xValue <= -SWIPE_THRESHOLD) return 'delete';
    if (xValue >= SWIPE_THRESHOLD) return 'postpone';
    return 'none';
  };

  // Determine if actions are available
  const hasLeftAction = Boolean(onSwipeLeft);
  const hasRightAction = Boolean(onSwipeRight);

  // Calculate drag constraints
  const dragConstraints = {
    left: hasLeftAction ? -MAX_DRAG : 0,
    right: hasRightAction ? MAX_DRAG : 0,
  };

  return (
    <div
      className={`swipe-row relative overflow-hidden ${className}`}
      style={{
        touchAction: 'pan-y',
      }}
      data-testid={testId}
    >
      {/* Delete action background (left swipe) */}
      {hasLeftAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end"
          style={{
            backgroundColor: 'var(--color-swipe-delete)',
            paddingRight: 'var(--space-md)',
            opacity: leftOpacity,
          }}
          aria-hidden="true"
        >
          <motion.span
            style={{
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-medium)',
              scale: leftScale,
            }}
          >
            {leftLabel}
          </motion.span>
        </motion.div>
      )}

      {/* Postpone action background (right swipe) */}
      {hasRightAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start"
          style={{
            backgroundColor: 'var(--color-swipe-postpone)',
            paddingLeft: 'var(--space-md)',
            opacity: rightOpacity,
          }}
          aria-hidden="true"
        >
          <motion.span
            style={{
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-medium)',
              scale: rightScale,
            }}
          >
            {rightLabel}
          </motion.span>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        className="relative z-[1]"
        style={{
          x,
          backgroundColor: 'var(--color-surface)',
        }}
        drag={disabled ? false : 'x'}
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        aria-label="Swipeable content"
        role="listitem"
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// Sub-components & Utilities
// =============================================================================

/**
 * Hook to get swipe action from outside the component
 * Useful for parent components that need to know current action
 */
export function useSwipeAction(): {
  action: SwipeAction;
  isActive: boolean;
} {
  // This would be implemented with context if needed across components
  // For now, return default values
  return {
    action: 'none',
    isActive: false,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { SwipeableRowProps, SwipeDirection };
