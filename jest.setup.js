/**
 * jest.setup.js
 * CommonJS-friendly setup for jest + @testing-library
 */

try {
  // prefer require so this file works regardless of ESM/CommonJS project type
  require('@testing-library/jest-dom/extend-expect');
} catch (e) {
  // if not installed, ignore gracefully
}

// Example global flags/helpers you can use in tests:
globalThis.__TEST__ = true;

// Reset timers and mocks between tests (optional but helpful)
beforeEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
