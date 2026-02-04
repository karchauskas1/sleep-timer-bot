/**
 * TaskInput - Minimal input component for adding new tasks
 *
 * Provides a clean, minimal interface for creating new tasks:
 * - Single text field with "Новая" placeholder
 * - Enter to add task for the currently selected date from store
 * - Optional date expansion for selecting different dates
 * - Haptic feedback on task creation
 *
 * Design principles:
 * - Silence through minimalism - no labels or explanations
 * - Quick entry - Enter immediately adds task
 * - Calm surface - no prompts or encouragement
 *
 * @example
 * // Basic usage - adds tasks to currently selected date in store
 * <TaskInput />
 *
 * @example
 * // With date expansion enabled
 * <TaskInput showDatePicker />
 *
 * @example
 * // With callback on task creation
 * <TaskInput onTaskAdded={(task) => scrollToTask(task.id)} />
 */

import { useState, useRef, useCallback, type KeyboardEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/types';
import { usePlannerStore } from '@/modules/planner/store/plannerStore';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for UI elements
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Quick date selection options
 */
const DATE_OPTIONS = [
  { label: 'Сегодня', getDays: () => 0 },
  { label: 'Завтра', getDays: () => 1 },
  { label: 'Послезавтра', getDays: () => 2 },
] as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the TaskInput component
 */
interface TaskInputProps {
  /** Whether to show the date picker button */
  showDatePicker?: boolean;
  /** Optional callback when a task is added */
  onTaskAdded?: (task: Task) => void;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format date for display in date picker button
 */
function formatDateLabel(date: string): string {
  const dateObj = new Date(date);
  if (isToday(dateObj)) return 'Сегодня';
  if (isTomorrow(dateObj)) return 'Завтра';
  return format(dateObj, 'd MMM');
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaskInput component for adding new tasks
 *
 * Renders a minimal input field that adds tasks on Enter.
 * Optionally shows a date picker for selecting task date.
 *
 * @param props - Component props
 */
export function TaskInput({
  showDatePicker = false,
  onTaskAdded,
  className = '',
  testId,
}: TaskInputProps) {
  const haptic = useHaptic();
  const addTask = usePlannerStore((state) => state.addTask);
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  const setSelectedDate = usePlannerStore((state) => state.setSelectedDate);

  // Local state
  const [text, setText] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle form submission (Enter key or form submit)
   */
  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const trimmedText = text.trim();
      if (!trimmedText) return;

      // Add the task for the currently selected date from store
      const newTask = addTask({
        text: trimmedText,
        date: selectedDate,
      });

      // Haptic feedback for task creation
      haptic.light();

      // Clear input
      setText('');

      // Close date picker if open
      setIsDatePickerOpen(false);

      // Notify parent
      onTaskAdded?.(newTask);

      // Keep focus on input for quick entry
      inputRef.current?.focus();
    },
    [text, selectedDate, addTask, haptic, onTaskAdded]
  );

  /**
   * Handle key down in input
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setText('');
        setIsDatePickerOpen(false);
      }
    },
    [handleSubmit]
  );

  /**
   * Toggle date picker
   */
  const handleToggleDatePicker = useCallback(() => {
    setIsDatePickerOpen((prev) => !prev);
    haptic.light();
  }, [haptic]);

  /**
   * Select a date from quick options
   */
  const handleSelectDate = useCallback(
    (daysFromToday: number) => {
      const date = format(addDays(new Date(), daysFromToday), 'yyyy-MM-dd');
      setSelectedDate(date);
      setIsDatePickerOpen(false);
      haptic.light();
      inputRef.current?.focus();
    },
    [haptic, setSelectedDate]
  );

  /**
   * Handle custom date input change
   */
  const handleCustomDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const date = event.target.value;
      if (date) {
        setSelectedDate(date);
        haptic.selectionChanged();
      }
    },
    [haptic, setSelectedDate]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={className}
      data-testid={testId}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border-thin)',
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-[var(--space-sm)]"
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            minHeight: 'var(--min-touch-target)',
          }}
        >
          {/* Main input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Новая"
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
            aria-label="Новая задача"
            autoComplete="off"
          />

          {/* Date picker toggle button (optional) */}
          {showDatePicker && (
            <button
              type="button"
              onClick={handleToggleDatePicker}
              className="flex-shrink-0"
              style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: isDatePickerOpen
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-colors)',
              }}
              aria-label="Выбрать дату"
              aria-expanded={isDatePickerOpen}
            >
              {formatDateLabel(selectedDate)}
            </button>
          )}
        </div>
      </form>

      {/* Date picker dropdown */}
      <AnimatePresence>
        {showDatePicker && isDatePickerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={ANIMATION_CONFIG}
            style={{
              overflow: 'hidden',
              borderTop: '1px solid var(--color-border-thin)',
            }}
          >
            <div
              className="flex flex-wrap items-center gap-[var(--space-sm)]"
              style={{
                padding: 'var(--space-sm) var(--space-md)',
              }}
            >
              {/* Quick date options */}
              {DATE_OPTIONS.map((option) => {
                const isSelected =
                  selectedDate === format(addDays(new Date(), option.getDays()), 'yyyy-MM-dd');
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelectDate(option.getDays())}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: isSelected
                        ? 'var(--font-weight-medium)'
                        : 'var(--font-weight-normal)',
                      color: isSelected
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                      backgroundColor: isSelected
                        ? 'var(--color-border-thin)'
                        : 'transparent',
                      border: 'none',
                      padding: 'var(--space-xs) var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'var(--transition-colors)',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}

              {/* Divider */}
              <span
                style={{
                  width: '1px',
                  height: '16px',
                  backgroundColor: 'var(--color-border)',
                }}
              />

              {/* Custom date input */}
              <input
                type="date"
                value={selectedDate}
                onChange={handleCustomDateChange}
                min={getTodayDate()}
                style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: 'var(--space-xs)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                aria-label="Выбрать другую дату"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { TaskInputProps };
