/**
 * BottomNavigation - iOS-style bottom tab bar navigation component
 *
 * Provides fixed bottom tab navigation for the ЩА (SHA) Mini App.
 * Tabs: Планы (Planner), Сон (Sleep), Таймер (Timer), Настройки (Settings)
 *
 * Features:
 * - Fixed position at screen bottom
 * - Safe-area padding for iOS devices (home indicator)
 * - Icons with labels for each tab
 * - Haptic feedback on tab change
 * - Active state with accent color
 * - Persists last selected module to localStorage
 *
 * @example
 * // Basic usage
 * <BottomNavigation
 *   currentModule="planner"
 *   onModuleChange={(module) => setCurrentModule(module)}
 * />
 *
 * @example
 * // With automatic persistence
 * const [currentModule, setCurrentModule] = useState<ModuleId>(
 *   getLastModule() || 'planner'
 * );
 */

import { useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ModuleId } from '@/types';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Animation Variants
// =============================================================================

/**
 * Indicator position variants for each tab
 * Each tab occupies 25% width, so positions are 0%, 100%, 200%, 300%
 */
const indicatorVariants = {
  planner: { x: '0%' },
  sleep: { x: '100%' },
  timer: { x: '200%' },
  settings: { x: '300%' },
};

// =============================================================================
// Constants
// =============================================================================

/**
 * Storage key for persisting last opened module
 */
const STORAGE_KEY = 'sha_last_module';

// =============================================================================
// Icons
// =============================================================================

/**
 * Checklist icon for Planner tab
 */
function ChecklistIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
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
 * Moon icon for Sleep tab
 */
function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

/**
 * Timer/Clock icon for Timer tab
 */
function TimerIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
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
 * Settings/Gear icon for Settings tab
 */
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
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
 * Tab configuration
 */
interface Tab {
  id: ModuleId;
  label: string;
  Icon: React.FC<{ active: boolean }>;
}

/**
 * Props for the BottomNavigation component
 */
interface BottomNavigationProps {
  /** Currently active module */
  currentModule: ModuleId;
  /** Callback when a different module is selected */
  onModuleChange: (module: ModuleId) => void;
}

// =============================================================================
// Tab Configuration
// =============================================================================

/**
 * Tab configuration - order matters for display
 * Labels updated for clarity: "Планы" instead of "Сегодня"
 */
const TABS: Tab[] = [
  { id: 'planner', label: 'Планы', Icon: ChecklistIcon },
  { id: 'sleep', label: 'Сон', Icon: MoonIcon },
  { id: 'timer', label: 'Таймер', Icon: TimerIcon },
  { id: 'settings', label: 'Настройки', Icon: SettingsIcon },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the last opened module from localStorage
 * Returns null if no stored value or invalid value
 */
export function getLastModule(): ModuleId | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidModule(stored)) {
      return stored as ModuleId;
    }
  } catch {
    // localStorage might not be available
  }
  return null;
}

/**
 * Save the current module to localStorage
 */
function saveLastModule(module: ModuleId): void {
  try {
    localStorage.setItem(STORAGE_KEY, module);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Type guard to check if a string is a valid ModuleId
 */
function isValidModule(value: string): value is ModuleId {
  return value === 'planner' || value === 'sleep' || value === 'timer' || value === 'settings';
}

// =============================================================================
// Component
// =============================================================================

/**
 * BottomNavigation component for module switching
 *
 * Renders iOS-style bottom tab bar for switching between app modules.
 * Automatically persists the last selected module to localStorage.
 * Includes safe-area padding for iOS devices with home indicator.
 *
 * @param props - Component props
 * @param props.currentModule - Currently active module
 * @param props.onModuleChange - Callback for module changes
 */
export function BottomNavigation({
  currentModule,
  onModuleChange,
}: BottomNavigationProps) {
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();

  // Persist module changes to localStorage
  useEffect(() => {
    saveLastModule(currentModule);
  }, [currentModule]);

  // Handle tab selection with haptic feedback
  const handleTabClick = useCallback(
    (module: ModuleId) => {
      if (module !== currentModule) {
        haptic.light();
        onModuleChange(module);
      }
    },
    [currentModule, haptic, onModuleChange]
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around"
      style={{
        height: `calc(var(--height-bottom-nav) + env(safe-area-inset-bottom, 34px) + 20px)`,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 20px)',
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderTop: '1px solid var(--glass-border)',
        zIndex: 'var(--z-fixed)',
      }}
      role="tablist"
      aria-label="Module navigation"
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute rounded-lg"
        style={{
          width: '25%',
          height: 'calc(100% - env(safe-area-inset-bottom, 34px) - 20px - 8px)',
          top: 4,
          left: 0,
          backgroundColor: 'var(--nav-indicator-bg)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
        variants={indicatorVariants}
        animate={currentModule}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }
        }
      />
      {TABS.map((tab) => {
        const isActive = tab.id === currentModule;
        const Icon = tab.Icon;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            className="relative z-10 flex flex-col items-center justify-center gap-[var(--space-0-5)] flex-1"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-2xs)',
              fontWeight: isActive
                ? 'var(--font-weight-semibold)'
                : 'var(--font-weight-normal)',
              color: isActive
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              border: 'none',
              cursor: 'pointer',
              minHeight: 'var(--min-touch-target)',
              paddingTop: 'var(--space-sm)',
              paddingBottom: 'var(--space-xs)',
              transition: 'var(--transition-colors)',
            }}
          >
            <Icon active={isActive} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { BottomNavigationProps };
