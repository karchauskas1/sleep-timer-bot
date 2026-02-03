/**
 * TaskItem - Individual task row component with checkbox, text, and swipe actions
 *
 * Displays a single task with:
 * - Checkbox for completion toggle
 * - Text display (truncated with ellipsis)
 * - Inline editing on long tap
 * - Swipe right to postpone (via SwipeableRow)
 * - Swipe left to delete (via SwipeableRow)
 *
 * States:
 * - Default: normal task display
 * - Completed: muted text with strikethrough
 * - Editing: inline input replaces text
 *
 * @example
 * // Basic usage
 * <TaskItem task={task} />
 *
 * @example
 * // With postpone handler
 * <TaskItem
 *   task={task}
 *   onPostpone={(id) => openDatePicker(id)}
 * />
 *
 * @example
 * // In a list with AnimatePresence
 * <AnimatePresence mode="popLayout">
 *   {tasks.map((task) => (
 *     <motion.div
 *       key={task.id}
 *       initial={{ opacity: 0, y: 20 }}
 *       animate={{ opacity: 1, y: 0 }}
 *       exit={{ opacity: 0, x: -100 }}
 *     >
 *       <TaskItem task={task} />
 *     </motion.div>
 *   ))}
 * </AnimatePresence>
 */

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '@/types';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';
import { SwipeableRow } from '@/shared/components/SwipeableRow';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Long press duration to trigger edit mode (in ms)
 */
const LONG_PRESS_DURATION = 500;

/**
 * Animation configuration for state transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the TaskItem component
 */
interface TaskItemProps {
  /** The task to display */
  task: Task;
  /** Optional callback when postpone action is triggered */
  onPostpone?: (taskId: string) => void;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskItem component for displaying a single task
 *
 * Renders a task row with checkbox, text, and swipe actions.
 * Supports inline editing via long tap.
 *
 * @param props - Component props
 */
export function TaskItem({
  task,
  onPostpone,
  className = '',
  testId,
}: TaskItemProps) {
  const haptic = useHaptic();

  // Store actions
  const completeTask = usePlannerStore((state) => state.completeTask);
  const deleteTask = usePlannerStore((state) => state.deleteTask);
  const editTask = usePlannerStore((state) => state.editTask);

  // Local state for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  // Refs for long press detection
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit text when task text changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditText(task.text);
    }
  }, [task.text, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // -------------------------------------------------------------------------
  // Long Press Handlers
  // -------------------------------------------------------------------------

  /**
   * Start long press timer
   */
  const handlePressStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      haptic.medium();
      setIsEditing(true);
    }, LONG_PRESS_DURATION);
  }, [haptic]);

  /**
   * Cancel long press timer
   */
  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle checkbox toggle
   */
  const handleCheckboxChange = useCallback(() => {
    const wasCompleted = task.completed;
    completeTask(task.id);

    // Haptic feedback - success for completing, light for uncompleting
    if (!wasCompleted) {
      haptic.success();
    } else {
      haptic.light();
    }
  }, [task.id, task.completed, completeTask, haptic]);

  /**
   * Handle swipe left (delete)
   */
  const handleDelete = useCallback(() => {
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  /**
   * Handle swipe right (postpone)
   */
  const handlePostpone = useCallback(() => {
    if (onPostpone) {
      onPostpone(task.id);
    }
  }, [task.id, onPostpone]);

  /**
   * Handle edit submission
   */
  const handleEditSubmit = useCallback(() => {
    const trimmedText = editText.trim();

    if (trimmedText && trimmedText !== task.text) {
      editTask(task.id, trimmedText);
      haptic.light();
    } else {
      // Revert to original text if empty or unchanged
      setEditText(task.text);
    }

    setIsEditing(false);
  }, [editText, task.id, task.text, editTask, haptic]);

  /**
   * Handle edit cancellation
   */
  const handleEditCancel = useCallback(() => {
    setEditText(task.text);
    setIsEditing(false);
  }, [task.text]);

  /**
   * Handle key down in edit input
   */
  const handleEditKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleEditSubmit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleEditCancel();
      }
    },
    [handleEditSubmit, handleEditCancel]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SwipeableRow
      onSwipeLeft={handleDelete}
      onSwipeRight={onPostpone ? handlePostpone : undefined}
      disabled={isEditing}
      className={className}
      testId={testId}
    >
      <div
        className="flex items-center gap-[var(--space-sm)]"
        style={{
          minHeight: 'var(--min-touch-target)',
          padding: 'var(--space-sm) var(--space-md)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxChange}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 'var(--size-checkbox)',
            height: 'var(--size-checkbox)',
            minWidth: 'var(--size-checkbox)',
            minHeight: 'var(--size-checkbox)',
            borderRadius: 'var(--radius-sm)',
            border: task.completed
              ? 'none'
              : '2px solid var(--color-border)',
            backgroundColor: task.completed
              ? 'var(--color-accent)'
              : 'transparent',
            cursor: 'pointer',
            transition: 'var(--transition-colors)',
          }}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          aria-pressed={task.completed}
        >
          {/* Checkmark icon */}
          {task.completed && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={ANIMATION_CONFIG}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 6L5 8.5L9.5 4"
                stroke="var(--color-text-inverse)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </button>

        {/* Task text or edit input */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
            className="flex-1 min-w-0"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-base)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--color-text-primary)',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 'var(--space-xs) 0',
              lineHeight: 'var(--line-height-normal)',
            }}
            aria-label="Edit task text"
          />
        ) : (
          <span
            className="flex-1 min-w-0 select-none"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-base)',
              fontWeight: 'var(--font-weight-normal)',
              color: task.completed
                ? 'var(--color-text-muted)'
                : 'var(--color-text-primary)',
              textDecoration: task.completed ? 'line-through' : 'none',
              lineHeight: 'var(--line-height-normal)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-colors)',
              cursor: 'text',
            }}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.text}. Long press to edit.`}
            onKeyDown={(e) => {
              // Allow Enter or Space to enter edit mode
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                haptic.medium();
                setIsEditing(true);
              }
            }}
          >
            {task.text}
          </span>
        )}
      </div>
    </SwipeableRow>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { TaskItemProps };
