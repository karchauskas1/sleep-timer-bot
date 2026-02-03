/**
 * Main entry point for ЩА (SHA) Telegram Mini App
 *
 * Initializes the React application with:
 * - React 18 createRoot for concurrent features
 * - Global styles including design tokens and animations
 * - App component with full provider hierarchy
 *
 * Note: StrictMode is disabled in production to ensure clean animations
 * and prevent double-mounting effects common with Telegram WebApp SDK.
 */

import ReactDOM from 'react-dom/client'

// Global styles - order matters: tokens first, then globals, then animations
import './styles/tokens.css'
import './styles/globals.css'
import './styles/animations.css'

// Main application component
import { App } from './app/App'

// =============================================================================
// Application Initialization
// =============================================================================

/**
 * Get the root element for React mounting
 */
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in index.html')
}

/**
 * Create React 18 root and render the application
 *
 * Note: StrictMode is intentionally disabled for production because:
 * 1. It causes double-mounting effects which conflict with Telegram WebApp.ready()
 * 2. It can cause animation jank with Framer Motion in development
 * 3. The app has been thoroughly tested without StrictMode issues
 *
 * If you need StrictMode for development debugging, wrap <App /> with it temporarily.
 */
ReactDOM.createRoot(rootElement).render(<App />)
