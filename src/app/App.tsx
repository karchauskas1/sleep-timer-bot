/**
 * App - Main application component with provider hierarchy
 *
 * This is the root component that sets up the application's provider hierarchy
 * and handles initial data hydration from IndexedDB. The provider order is:
 *
 * 1. TelegramProvider - Telegram WebApp SDK initialization and context
 * 2. ThemeProvider - Theme management synced with Telegram colorScheme
 * 3. Store Hydration - Load IndexedDB data into Zustand stores
 * 4. Router - Module navigation and rendering
 *
 * Philosophy note: Per the "silence through minimalism" design philosophy,
 * no loading spinner is shown during hydration. The app should hydrate fast
 * enough (<100ms) that users don't perceive any delay.
 *
 * @example
 * // In main.tsx
 * import { App } from '@/app/App';
 *
 * createRoot(document.getElementById('root')!).render(
 *   <App />
 * );
 */

import { TelegramProvider } from './providers/TelegramProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { Router } from './Router';
import { useStoreHydration } from '@/shared/hooks/useStoreHydration';
import { useOnboarding } from '@/shared/hooks/useOnboarding';
import { Onboarding } from '@/shared/components/Onboarding';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the App component
 */
export interface AppProps {
  /** Optional className for the root element */
  className?: string;
}

// =============================================================================
// Internal Components
// =============================================================================

/**
 * AppContent - Inner component that handles hydration, onboarding, and rendering
 *
 * Separated from main App to ensure hooks are called within provider context.
 * This component checks hydration status, shows onboarding for first-time users,
 * then renders the Router.
 */
function AppContent() {
  // Check if store is hydrated from IndexedDB
  const { isHydrated, hasError } = useStoreHydration();

  // Check if onboarding is completed (persisted in localStorage)
  const { isCompleted: isOnboardingCompleted, completeOnboarding } = useOnboarding();

  // During hydration, render nothing (no loading spinner per design philosophy)
  // Hydration should complete in <100ms
  if (!isHydrated) {
    // Render minimal placeholder to prevent layout shift
    // Uses CSS custom properties for consistent theming
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--color-bg)',
        }}
        aria-busy="true"
        aria-label="Loading application"
      />
    );
  }

  // If hydration failed, render a minimal error state
  // This is rare - would only happen if IndexedDB is corrupted or unavailable
  if (hasError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text-secondary)',
        }}
        role="alert"
      >
        <p className="text-sm">Не удалось загрузить данные</p>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (!isOnboardingCompleted) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  // Render the main application router
  return <Router />;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * App component - Application root with provider hierarchy
 *
 * Sets up the complete provider hierarchy required for the application:
 * - TelegramProvider for Telegram WebApp integration
 * - ThemeProvider for light/dark theme based on Telegram colorScheme
 *
 * @param props - Component props
 * @param props.className - Optional className for customization
 */
export function App({ className = '' }: AppProps) {
  return (
    <TelegramProvider>
      <ThemeProvider>
        <div
          className={`sha-app ${className}`}
          style={{
            // Ensure app fills viewport (dynamic viewport height for mobile, fallback to vh)
            minHeight: '100dvh',
            // Apply background color at root level
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <AppContent />
        </div>
      </ThemeProvider>
    </TelegramProvider>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default App;
