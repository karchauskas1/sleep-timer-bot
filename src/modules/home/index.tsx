/**
 * HomeScreen - Main hub/entry point for the ЩА (SHA) Mini App
 *
 * A beautiful, minimal home screen that serves as the central navigation hub.
 * Displays tool cards for each available module (Planner, Sleep, Timer).
 *
 * Features:
 * - Blue accent theme with calming color palette
 * - Scalable tool card grid for future module additions
 * - Theme toggle in top-right corner
 * - Smooth entrance animations with Framer Motion
 * - Generous whitespace following the app's design philosophy
 * - Safe area handling for iOS devices
 *
 * @example
 * // Basic usage in Router
 * <HomeScreen onNavigate={(moduleId) => setCurrentModule(moduleId)} />
 */

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ModuleId } from '@/types';
import { ToolCard } from '@/modules/home/components/ToolCard';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Animation configuration for smooth transitions
 */
const ANIMATION_CONFIG = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * Animation variants for the container
 */
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/**
 * Animation variants for individual elements
 */
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: ANIMATION_CONFIG,
  },
};

/**
 * Tool configurations for the home screen cards
 */
const TOOLS: Array<{
  id: ModuleId;
  title: string;
  description: string;
}> = [
  {
    id: 'planner',
    title: 'Планы',
    description: 'Задачи на сегодня',
  },
  {
    id: 'sleep',
    title: 'Сон',
    description: 'Калькулятор сна',
  },
  {
    id: 'timer',
    title: 'Таймер',
    description: 'Обратный отсчёт',
  },
];

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the HomeScreen component
 */
interface HomeScreenProps {
  /** Callback when a tool is selected for navigation */
  onNavigate: (moduleId: ModuleId) => void;
  /** Optional additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * HomeScreen component - Main hub of the application
 *
 * Displays the app logo, tool cards for navigation, and theme toggle.
 * Serves as the entry point after onboarding.
 *
 * @param props - Component props
 * @param props.onNavigate - Callback when a tool card is selected
 * @param props.className - Optional CSS class
 */
export function HomeScreen({ onNavigate, className = '' }: HomeScreenProps) {
  const haptic = useHaptic();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle tool card selection
   * Triggers haptic feedback and navigates to the selected module
   */
  const handleToolSelect = useCallback(
    (moduleId: ModuleId) => {
      haptic.light();
      onNavigate(moduleId);
    },
    [haptic, onNavigate]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        fontFamily: 'var(--font-family)',
        overflow: 'auto',
      }}
    >
      {/* Header with Theme Toggle */}
      <motion.header
        variants={itemVariants}
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 'var(--space-md)',
          paddingTop: 'calc(var(--space-md) + var(--safe-area-top))',
        }}
      >
        <ThemeToggle />
      </motion.header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-xl)',
          paddingBottom: 'calc(var(--space-xl) + var(--safe-area-bottom))',
          gap: 'var(--space-2xl)',
        }}
      >
        {/* Logo/Branding */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          {/* App Logo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-2xl)',
              backgroundColor: 'var(--color-home-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-inverse)',
                fontFamily: 'var(--font-family)',
              }}
            >
              ЩА
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--color-text-secondary)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Простые инструменты
          </p>
        </motion.div>

        {/* Tool Cards Grid */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-md)',
            width: '100%',
            maxWidth: 500,
          }}
        >
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              title={tool.title}
              description={tool.description}
              onSelect={() => handleToolSelect(tool.id)}
            />
          ))}
        </motion.div>
      </main>
    </motion.div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default HomeScreen;
export type { HomeScreenProps };
