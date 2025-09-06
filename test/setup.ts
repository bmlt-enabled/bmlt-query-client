/**
 * Vitest test setup
 */

// Vitest timeout is configured in vite.config.ts

// Suppress console.warn during tests (for expected warnings)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('Geocoding attempt') || args[0]?.includes?.('Failed to geocode')) {
    return; // Suppress expected geocoding warnings
  }
  originalWarn.apply(console, args);
};

// Global test utilities can be added here
