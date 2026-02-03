/**
 * Router - State-based module routing for the ЩА (SHA) Mini App
 *
 * Manages module switching between Planner, Sleep, and Timer.
 * Uses state-based routing (not URL) for Telegram Mini App compatibility.
 *
 * Features:
 * - Persists last opened module to localStorage
 * - Smooth transitions between modules with AnimatePresence
 * - Renders BottomNavigation at bottom, module content above
 * - Lazy renders modules to optimize initial load
 *
 * @example
 * // Basic usage in App.tsx
 * <Router />
 *
 * @example
 * // With custom default module
 * <Router defaultModule="sleep" />
 */

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ModuleId } from '@/types';
import { BottomNavigation, getLastModule } from '@/shared/components/BottomNavigation';
import { Planner } from '@/modules/planner';
import { Sleep } from '@/modules/sleep';
import { Timer } from '@/modules/timer';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default module to show when no persisted preference exists
 */
const DEFAULT_MODULE: ModuleId = 'planner';

/**
 * Animation configuration for module transitions
 * Using custom easing as specified in design tokens
 */
const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for module content transitions
 * Subtle opacity and vertical movement for minimal but visible transitions
 */
const moduleVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Router component
 */
interface RouterProps {
  /** Default module to show when no persisted preference exists */
  defaultModule?: ModuleId;
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Router component for module switching
 *
 * Manages the current active module and renders the appropriate content.
 * BottomNavigation is fixed at the bottom, with module content above.
 *
 * @param props - Component props
 * @param props.defaultModule - Default module when no persisted preference
 * @param props.className - Additional CSS class name
 */
export function Router({ defaultModule = DEFAULT_MODULE, className = '' }: RouterProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /**
   * Current active module
   * Initialized from localStorage or falls back to default
   */
  const [currentModule, setCurrentModule] = useState<ModuleId>(() => {
    const lastModule = getLastModule();
    return lastModule ?? defaultModule;
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle module change from BottomNavigation
   * BottomNavigation component handles persistence to localStorage
   */
  const handleModuleChange = useCallback((module: ModuleId) => {
    setCurrentModule(module);
  }, []);

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------

  /**
   * Render the current module content
   * Memoized to prevent unnecessary re-renders
   */
  const moduleContent = useMemo(() => {
    switch (currentModule) {
      case 'planner':
        return <Planner key="planner" />;
      case 'sleep':
        return <Sleep key="sleep" />;
      case 'timer':
        return <Timer key="timer" />;
      default:
        // TypeScript exhaustive check - should never reach here
        return null;
    }
  }, [currentModule]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={`flex flex-col min-h-screen ${className}`}
      style={{
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Module Content Area */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          paddingBottom: 'calc(var(--height-bottom-nav) + var(--safe-area-bottom))',
        }}
        role="tabpanel"
        id={`panel-${currentModule}`}
        aria-labelledby={`tab-${currentModule}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModule}
            variants={moduleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={ANIMATION_CONFIG}
            className="flex-1 flex flex-col overflow-auto"
          >
            {moduleContent}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BottomNavigation - fixed at screen bottom */}
      <BottomNavigation
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
      />
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Router;
export type { RouterProps };
