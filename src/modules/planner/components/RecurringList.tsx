/**
 * RecurringList - List component for all recurring tasks
 *
 * Displays all recurring task subscriptions with:
 * - Grouped by status (active/paused)
 * - AnimatePresence for smooth add/remove animations
 * - Empty state when no recurring tasks exist
 * - "Add new" button for creating recurring tasks
 *
 * Visual design follows subscription management UI patterns:
 * - Clear distinction between active and paused items
 * - Quick access to add new subscriptions
 * - Minimal, calm interface
 *
 * @example
 * // Basic usage - displays all recurring tasks
 * <RecurringList />
 *
 * @example
 * // With callbacks for navigation/editing
 * <RecurringList
 *   onAddNew={() => openCreateModal()}
 *   onEdit={(id) => openEditModal(id)}
 * />
 *
 * @example
 * // With back button callback
 * <RecurringList
 *   onBack={() => navigateToPlanner()}
 * />
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/utils/storage';
import type { RecurringTask } from '@/types';
import { RecurringItem } from '@/modules/planner/components/RecurringItem';
import { EmptyState } from '@/shared/components/EmptyState';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation variants for list items
 */
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

/**
 * Animation variants for section headers
 */
const sectionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Animation configuration
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the RecurringList component
 */
interface RecurringListProps {
  /** Optional callback when "Add new" is clicked */
  onAddNew?: () => void;
  /** Optional callback when a recurring task is edited */
  onEdit?: (taskId: string) => void;
  /** Optional callback when back navigation is triggered */
  onBack?: () => void;
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get all recurring tasks from IndexedDB
 * @returns Array of recurring tasks or undefined while loading
 */
function useRecurringTasks(): RecurringTask[] | undefined {
  return useLiveQuery(
    async () => {
      const tasks = await db.recurringTasks.toArray();
      // Sort by active status first (active before paused), then by creation date
      return tasks.sort((a, b) => {
        if (a.active !== b.active) {
          return a.active ? -1 : 1; // Active first
        }
        // Most recently created first within each group
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    []
  );
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Section header component
 */
function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={ANIMATION_CONFIG}
      style={{
        padding: 'var(--space-md) var(--space-md) var(--space-sm)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-secondary)',
        letterSpacing: 'var(--letter-spacing-wide)',
        textTransform: 'uppercase',
      }}
    >
      {title}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: 'var(--space-xs)',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--color-text-muted)',
          }}
        >
          {count}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Add new button component
 */
function AddNewButton({ onClick }: { onClick?: () => void }) {
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    haptic.light();
    onClick?.();
  }, [onClick, haptic]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-[var(--space-sm)]"
      style={{
        minHeight: 'var(--min-touch-target)',
        padding: 'var(--space-md)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-base)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-text-secondary)',
        backgroundColor: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
        marginTop: 'var(--space-md)',
        marginLeft: 'var(--space-md)',
        marginRight: 'var(--space-md)',
      }}
      aria-label="Добавить повторяющуюся задачу"
    >
      <span
        style={{
          fontSize: 'var(--font-lg)',
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        +
      </span>
      <span>Добавить</span>
    </button>
  );
}

/**
 * Header with back button
 */
function ListHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title: string;
}) {
  const haptic = useHaptic();

  const handleBack = useCallback(() => {
    haptic.light();
    onBack?.();
  }, [onBack, haptic]);

  return (
    <div
      className="flex items-center gap-[var(--space-sm)]"
      style={{
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--color-border-thin)',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center"
          style={{
            width: 'var(--min-touch-target)',
            height: 'var(--min-touch-target)',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'var(--transition-colors)',
          }}
          aria-label="Назад"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <h2
        style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * RecurringList component for displaying all recurring tasks
 *
 * Renders recurring tasks organized by status (active/paused) with smooth animations.
 * Shows empty state when no recurring tasks exist.
 *
 * @param props - Component props
 */
export function RecurringList({
  onAddNew,
  onEdit,
  onBack,
  className = '',
}: RecurringListProps) {
  // Fetch recurring tasks from IndexedDB
  const recurringTasks = useRecurringTasks();

  // Separate into active and paused
  const { activeTasks, pausedTasks } = useMemo(() => {
    if (!recurringTasks) return { activeTasks: [], pausedTasks: [] };
    return {
      activeTasks: recurringTasks.filter((rt) => rt.active),
      pausedTasks: recurringTasks.filter((rt) => !rt.active),
    };
  }, [recurringTasks]);

  // Check if data is still loading
  const isLoading = recurringTasks === undefined;

  // Check if there are any recurring tasks
  const hasAnyTasks = !isLoading && recurringTasks.length > 0;

  // Loading state - render nothing (app should feel instant per design philosophy)
  if (isLoading) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <ListHeader onBack={onBack} title="Повторяющиеся" />

      {/* Content */}
      {!hasAnyTasks ? (
        // Empty state
        <div style={{ paddingTop: 'var(--space-xl)' }}>
          <EmptyState message="Нет повторяющихся задач" />
          {onAddNew && <AddNewButton onClick={onAddNew} />}
        </div>
      ) : (
        <div style={{ paddingBottom: 'var(--space-2xl)' }}>
          {/* Active recurring tasks */}
          {activeTasks.length > 0 && (
            <div>
              <SectionHeader title="Активные" count={activeTasks.length} />
              <AnimatePresence mode="popLayout">
                {activeTasks.map((recurringTask) => (
                  <motion.div
                    key={recurringTask.id}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={ANIMATION_CONFIG}
                    layout
                  >
                    <RecurringItem
                      recurringTask={recurringTask}
                      onEdit={onEdit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paused recurring tasks */}
          {pausedTasks.length > 0 && (
            <div style={{ marginTop: activeTasks.length > 0 ? 'var(--space-md)' : 0 }}>
              <SectionHeader title="Приостановлены" count={pausedTasks.length} />
              <AnimatePresence mode="popLayout">
                {pausedTasks.map((recurringTask) => (
                  <motion.div
                    key={recurringTask.id}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={ANIMATION_CONFIG}
                    layout
                  >
                    <RecurringItem
                      recurringTask={recurringTask}
                      onEdit={onEdit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add new button */}
          {onAddNew && <AddNewButton onClick={onAddNew} />}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { RecurringListProps };
export { useRecurringTasks };
