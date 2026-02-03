/**
 * Settings Module - Main entry point for application settings
 *
 * Provides a clean interface for configuring app behavior preferences:
 * - Sleep onset time (time to fall asleep) - affects bedtime calculations
 *
 * Design principles:
 * - Silence through minimalism - no unnecessary explanations
 * - Calm surface - clean interface for quick adjustments
 * - Instant feedback - settings apply immediately
 * - Lots of whitespace - centered layout with breathing room
 *
 * Future settings can be added here following the same clean pattern.
 *
 * @example
 * // Basic usage in router
 * <Settings />
 */

import { useCallback } from 'react';
import { SleepOnsetSetting } from '@/modules/settings/components/SleepOnsetSetting';
import { useSettingsStore } from '@/modules/settings/store/settingsStore';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the Settings module
 */
interface SettingsProps {
  /** Additional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Settings module component
 *
 * Main entry point for the settings functionality.
 * Manages application settings with persistence to IndexedDB.
 *
 * @param props - Component props
 */
export function Settings({ className = '' }: SettingsProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /**
   * Current sleep onset time in minutes from the store
   */
  const sleepOnsetMinutes = useSettingsStore((state) => state.sleepOnsetMinutes);

  /**
   * Function to update sleep onset time in the store
   */
  const setSleepOnsetMinutes = useSettingsStore((state) => state.setSleepOnsetMinutes);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle sleep onset time change
   * Updates the store which automatically persists to IndexedDB
   */
  const handleSleepOnsetChange = useCallback(
    (minutes: number) => {
      setSleepOnsetMinutes(minutes);
    },
    [setSleepOnsetMinutes]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={`flex flex-col min-h-full ${className}`}
      style={{
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Content container with vertical centering */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          padding: 'var(--space-lg)',
          paddingTop: 'var(--space-xl)',
          paddingBottom: 'var(--space-2xl)',
        }}
      >
        {/* Settings Section */}
        <div
          className="w-full max-w-sm"
          style={{
            marginBottom: 'var(--space-2xl)',
          }}
        >
          {/* Sleep Onset Setting */}
          <div
            className="w-full"
            style={{
              marginBottom: 'var(--space-xl)',
            }}
          >
            {/* Section Title */}
            <h2
              className="text-center"
              style={{
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-family)',
              }}
            >
              Время засыпания
            </h2>

            {/* Sleep Onset Input */}
            <SleepOnsetSetting
              value={sleepOnsetMinutes}
              onChange={handleSleepOnsetChange}
            />

            {/* Helper Text */}
            <p
              className="text-center"
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-md)',
                fontFamily: 'var(--font-family)',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              Сколько времени вам нужно, чтобы заснуть
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Settings;
export type { SettingsProps };
