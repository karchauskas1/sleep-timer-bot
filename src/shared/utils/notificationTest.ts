/**
 * notificationTest - Telegram WebApp SDK notification testing utility
 *
 * This utility helps test and verify the behavior of Telegram notification methods
 * in different app states (foreground, background, closed). Used for investigating
 * notification capabilities and limitations for timer completion alerts.
 *
 * @example
 * // Test all notification methods
 * import { testAllNotifications } from '@/shared/utils/notificationTest';
 * testAllNotifications();
 *
 * @example
 * // Test specific method
 * import { testShowPopup } from '@/shared/utils/notificationTest';
 * testShowPopup('Таймер завершён!');
 */

import WebApp from '@twa-dev/sdk';
import type { PopupParams } from '@twa-dev/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Test result from a notification method
 */
interface NotificationTestResult {
  /** The method that was tested */
  method: 'showAlert' | 'showConfirm' | 'showPopup';
  /** Whether the method executed without errors */
  success: boolean;
  /** Error message if test failed */
  error?: string;
  /** Additional details about the test */
  details?: string;
  /** Timestamp when test was run */
  timestamp: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if running in Telegram environment
 */
function isTelegramEnv(): boolean {
  try {
    return !!(
      WebApp.initData ||
      WebApp.initDataUnsafe?.query_id ||
      (typeof window !== 'undefined' && window.Telegram?.WebApp)
    );
  } catch {
    return false;
  }
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log test result to console with formatting
 */
function logTestResult(result: NotificationTestResult): void {
  const emoji = result.success ? '✅' : '❌';
  const status = result.success ? 'SUCCESS' : 'FAILED';

  /* eslint-disable no-console */
  console.group(`${emoji} Notification Test: ${result.method} - ${status}`);
  console.log('Timestamp:', result.timestamp);
  console.log('Method:', result.method);
  console.log('Success:', result.success);

  if (result.details) {
    console.log('Details:', result.details);
  }

  if (result.error) {
    console.error('Error:', result.error);
  }

  console.groupEnd();
  /* eslint-enable no-console */
}

// =============================================================================
// Test Functions
// =============================================================================

/**
 * Test the showAlert method
 *
 * Shows a simple alert dialog with a 'Close' button.
 * This is the simplest notification method and should work in most cases.
 *
 * @param message - Message to display in the alert
 * @returns Promise that resolves with test result
 */
export async function testShowAlert(message: string = 'Test Alert'): Promise<NotificationTestResult> {
  const result: NotificationTestResult = {
    method: 'showAlert',
    success: false,
    timestamp: getTimestamp(),
  };

  if (!isTelegramEnv()) {
    result.error = 'Not running in Telegram environment';
    result.details = 'This test must be run inside Telegram Mini App';
    logTestResult(result);
    return result;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      try {
        WebApp.showAlert(message, () => {
          result.success = true;
          result.details = 'Alert was shown and closed by user';
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.details = 'showAlert method threw an exception';
  }

  logTestResult(result);
  return result;
}

/**
 * Test the showConfirm method
 *
 * Shows a confirmation dialog with 'OK' and 'Cancel' buttons.
 * Useful when user confirmation is needed.
 *
 * @param message - Message to display in the confirmation
 * @returns Promise that resolves with test result
 */
export async function testShowConfirm(message: string = 'Test Confirm'): Promise<NotificationTestResult> {
  const result: NotificationTestResult = {
    method: 'showConfirm',
    success: false,
    timestamp: getTimestamp(),
  };

  if (!isTelegramEnv()) {
    result.error = 'Not running in Telegram environment';
    result.details = 'This test must be run inside Telegram Mini App';
    logTestResult(result);
    return result;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      try {
        WebApp.showConfirm(message, (confirmed) => {
          result.success = true;
          result.details = confirmed
            ? 'User pressed OK'
            : 'User pressed Cancel';
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.details = 'showConfirm method threw an exception';
  }

  logTestResult(result);
  return result;
}

/**
 * Test the showPopup method
 *
 * Shows a native popup with customizable title, message, and buttons.
 * This is the richest notification method but requires Bot API 6.2+.
 *
 * @param message - Message to display
 * @param title - Optional popup title
 * @returns Promise that resolves with test result
 */
export async function testShowPopup(
  message: string = 'Test Popup',
  title: string = 'Тест'
): Promise<NotificationTestResult> {
  const result: NotificationTestResult = {
    method: 'showPopup',
    success: false,
    timestamp: getTimestamp(),
  };

  if (!isTelegramEnv()) {
    result.error = 'Not running in Telegram environment';
    result.details = 'This test must be run inside Telegram Mini App';
    logTestResult(result);
    return result;
  }

  // Check if showPopup is available (Bot API 6.2+)
  if (!WebApp.showPopup) {
    result.error = 'showPopup method not available';
    result.details = 'Requires Bot API 6.2+. Try using showAlert instead.';
    logTestResult(result);
    return result;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      try {
        const params: PopupParams = {
          title,
          message,
          buttons: [
            { id: 'ok', type: 'ok' },
            { id: 'close', type: 'close' },
          ],
        };

        WebApp.showPopup(params, (buttonId) => {
          result.success = true;
          result.details = buttonId
            ? `User pressed button: ${buttonId}`
            : 'Popup was closed';
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.details = 'showPopup method threw an exception';
  }

  logTestResult(result);
  return result;
}

/**
 * Test timer completion notification
 *
 * Simulates the actual notification that will be shown when a timer completes.
 * Uses showPopup with the Russian message "Таймер завершён!".
 *
 * @returns Promise that resolves with test result
 */
export async function testTimerNotification(): Promise<NotificationTestResult> {
  const result: NotificationTestResult = {
    method: 'showPopup',
    success: false,
    timestamp: getTimestamp(),
  };

  if (!isTelegramEnv()) {
    result.error = 'Not running in Telegram environment';
    result.details = 'This test must be run inside Telegram Mini App';
    logTestResult(result);
    return result;
  }

  // Fallback to showAlert if showPopup not available
  if (!WebApp.showPopup) {
    result.details = 'showPopup not available, falling back to showAlert';
    return testShowAlert('Таймер завершён!');
  }

  try {
    await new Promise<void>((resolve, reject) => {
      try {
        const params: PopupParams = {
          title: 'Таймер',
          message: 'Таймер завершён!',
          buttons: [
            { id: 'ok', type: 'ok' },
          ],
        };

        WebApp.showPopup(params, () => {
          result.success = true;
          result.details = 'Timer completion notification shown successfully';
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.details = 'Failed to show timer notification';
  }

  logTestResult(result);
  return result;
}

/**
 * Test all notification methods sequentially
 *
 * Runs tests for showAlert, showConfirm, and showPopup in sequence.
 * Useful for comprehensive testing of all available notification methods.
 *
 * @returns Promise that resolves with array of test results
 */
export async function testAllNotifications(): Promise<NotificationTestResult[]> {
  /* eslint-disable no-console */
  console.group('🧪 Testing All Notification Methods');
  console.log('Starting comprehensive notification tests...');
  console.log('App State: Run this test with app in different states:');
  console.log('  1. Foreground (app visible)');
  console.log('  2. Background (switched to another chat)');
  console.log('  3. After closing and reopening app');
  console.groupEnd();
  /* eslint-enable no-console */

  const results: NotificationTestResult[] = [];

  // Test showAlert
  results.push(await testShowAlert('Test Alert - 1/3'));

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test showConfirm
  results.push(await testShowConfirm('Test Confirm - 2/3'));

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test showPopup
  results.push(await testShowPopup('Test Popup - 3/3', 'Test'));

  /* eslint-disable no-console */
  console.group('📊 Test Summary');
  console.log('Total Tests:', results.length);
  console.log('Passed:', results.filter(r => r.success).length);
  console.log('Failed:', results.filter(r => !r.success).length);
  console.table(results.map(r => ({
    Method: r.method,
    Success: r.success ? '✅' : '❌',
    Error: r.error || '-',
  })));
  console.groupEnd();
  /* eslint-enable no-console */

  return results;
}

/**
 * Export test results as formatted text for documentation
 *
 * Converts test results into a markdown-formatted string suitable
 * for including in INVESTIGATION.md.
 *
 * @param results - Array of test results
 * @param appState - Description of app state during test (e.g., "Foreground", "Background")
 * @returns Markdown-formatted test report
 */
export function formatTestResults(
  results: NotificationTestResult[],
  appState: string = 'Unknown'
): string {
  const timestamp = new Date().toISOString();
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  let report = `### Test Results - ${appState}\n\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  report += `**Tests Run:** ${results.length}\n`;
  report += `**Passed:** ${passed}\n`;
  report += `**Failed:** ${failed}\n\n`;

  report += '| Method | Result | Details |\n';
  report += '|--------|--------|----------|\n';

  results.forEach(r => {
    const status = r.success ? '✅ Pass' : '❌ Fail';
    const details = r.error || r.details || '-';
    report += `| ${r.method} | ${status} | ${details} |\n`;
  });

  return report;
}

// =============================================================================
// Browser Console Helpers
// =============================================================================

/**
 * Expose test functions to window for easy console access
 * Only available in development mode
 */
if (import.meta.env.DEV) {
  // Make test functions globally available
  (window as any).notificationTest = {
    testAlert: testShowAlert,
    testConfirm: testShowConfirm,
    testPopup: testShowPopup,
    testTimer: testTimerNotification,
    testAll: testAllNotifications,
    formatResults: formatTestResults,
  };

  /* eslint-disable no-console */
  console.log('📱 Notification Test Utility Loaded');
  console.log('Available commands:');
  console.log('  window.notificationTest.testAlert()');
  console.log('  window.notificationTest.testConfirm()');
  console.log('  window.notificationTest.testPopup()');
  console.log('  window.notificationTest.testTimer()');
  console.log('  window.notificationTest.testAll()');
  /* eslint-enable no-console */
}
