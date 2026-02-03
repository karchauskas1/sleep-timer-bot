/**
 * Navigation - Horizontal tab navigation component
 *
 * Provides tab-based module switching for the ЩА (SHA) Mini App.
 * Tabs: Сегодня (Planner), Сон (Sleep), Таймер (Timer)
 *
 * Features:
 * - Persists last selected module to localStorage
 * - Minimal transition animation
 * - Haptic feedback on tab change
 * - Bold active tab, muted inactive tabs
 *
 * @example
 * // Basic usage
 * <Navigation
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
import type { ModuleId } from '@/types';
import { useHaptic } from '@/shared/hooks/useHaptic';

// =============================================================================
// Constants
// =============================================================================

/**
 * Storage key for persisting last opened module
 */
const STORAGE_KEY = 'sha_last_module';

/**
 * Tab configuration - order matters for display
 */
const TABS: Array<{ id: ModuleId; label: string }> = [
  { id: 'planner', label: 'Сегодня' },
  { id: 'sleep', label: 'Сон' },
  { id: 'timer', label: 'Таймер' },
];

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Navigation component
 */
interface NavigationProps {
  /** Currently active module */
  currentModule: ModuleId;
  /** Callback when a different module is selected */
  onModuleChange: (module: ModuleId) => void;
}

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
  return value === 'planner' || value === 'sleep' || value === 'timer';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Navigation component for module switching
 *
 * Renders horizontal tabs for switching between app modules.
 * Automatically persists the last selected module to localStorage.
 *
 * @param props - Component props
 * @param props.currentModule - Currently active module
 * @param props.onModuleChange - Callback for module changes
 */
export function Navigation({ currentModule, onModuleChange }: NavigationProps) {
  const haptic = useHaptic();

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
      className="flex items-center justify-center gap-[var(--space-lg)]"
      style={{
        height: 'var(--height-nav)',
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border-thin)',
      }}
      role="tablist"
      aria-label="Module navigation"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === currentModule;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            className="relative py-[var(--space-sm)] px-[var(--space-xs)] transition-colors"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-sm)',
              fontWeight: isActive
                ? 'var(--font-weight-semibold)'
                : 'var(--font-weight-normal)',
              color: isActive
                ? 'var(--color-text-primary)'
                : 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              minHeight: 'var(--min-touch-target)',
              transition: 'var(--transition-colors)',
            }}
          >
            {tab.label}
            {/* Active indicator - subtle underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: 'var(--radius-full)',
                }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// =============================================================================
// Exports
// =============================================================================

export type { NavigationProps };
