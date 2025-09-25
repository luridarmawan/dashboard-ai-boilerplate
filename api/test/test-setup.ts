/**
 * Test setup for server-side tests
 * This file is loaded before running server tests
 */

import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env.test' });

// Mock console methods for cleaner test output
const originalConsole = console;

beforeEach(() => {
  // Suppress console output during tests unless VITE_APP_DEBUG is true
  if (!process.env.VITE_APP_DEBUG) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterEach(() => {
  // Restore console methods
  vi.restoreAllMocks();
});

// Global test environment setup
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Mock environment variables commonly used in tests
process.env.NODE_ENV = 'test';
process.env.VITE_API_PORT = '3001';
process.env.VITE_API_PREFIX = '/v1';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.VITE_SUPERADMIN = 'test-admin@example.com';

// Override console for test debugging when needed
if (process.env.TEST_DEBUG === 'true') {
  global.console = originalConsole;
}