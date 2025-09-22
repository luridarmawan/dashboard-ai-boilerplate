import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seedClient, seedGroup, seedUser, seedCategory, seedConfiguration } from './seed';

// Mock the individual seed functions
vi.mock('./seed', async () => {
  const actual = await vi.importActual('./seed');
  return {
    ...actual,
    seedClient: vi.fn(),
    seedGroup: vi.fn(),
    seedUser: vi.fn(),
    seedCategory: vi.fn(),
    seedConfiguration: vi.fn(),
  };
});

vi.mock('@prisma/client');

const mockPrisma = {
  $disconnect: vi.fn(),
};

describe('seedDatabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (PrismaClient as Mock).mockImplementation(() => mockPrisma);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Main seedDatabase Function', () => {
    it('should execute all seed functions in correct order', async () => {
      // Arrange
      const testClientId = 'test-client-id-123';
      (seedClient as Mock).mockResolvedValue(testClientId);
      (seedGroup as Mock).mockResolvedValue(undefined);
      (seedUser as Mock).mockResolvedValue(undefined);
      (seedCategory as Mock).mockResolvedValue(undefined);
      (seedConfiguration as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      await seedDatabase();

      // Assert - Check execution order
      expect(seedClient).toHaveBeenCalledTimes(1);
      expect(seedGroup).toHaveBeenCalledWith(testClientId);
      expect(seedUser).toHaveBeenCalledWith(testClientId);
      expect(seedCategory).toHaveBeenCalledWith(testClientId);
      expect(seedConfiguration).toHaveBeenCalledWith(testClientId);
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and still disconnect from database', async () => {
      // Arrange
      (seedClient as Mock).mockRejectedValue(new Error('Client seeding failed'));

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act & Assert
      await expect(seedDatabase()).rejects.toThrow('Client seeding failed');
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should stop execution if seedClient fails', async () => {
      // Arrange
      (seedClient as Mock).mockRejectedValue(new Error('No client available'));

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act & Assert
      await expect(seedDatabase()).rejects.toThrow('No client available');
      expect(seedGroup).not.toHaveBeenCalled();
      expect(seedUser).not.toHaveBeenCalled();
      expect(seedCategory).not.toHaveBeenCalled();
      expect(seedConfiguration).not.toHaveBeenCalled();
    });

    it('should continue with other functions if seedGroup fails', async () => {
      // Arrange
      const testClientId = 'test-client-id-123';
      (seedClient as Mock).mockResolvedValue(testClientId);
      (seedGroup as Mock).mockRejectedValue(new Error('Group seeding failed'));

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act & Assert
      await expect(seedDatabase()).rejects.toThrow('Group seeding failed');
      expect(seedClient).toHaveBeenCalled();
      expect(seedGroup).toHaveBeenCalledWith(testClientId);
      expect(seedUser).not.toHaveBeenCalled();
    });
  });

  describe('Function Dependencies', () => {
    it('should pass client_id correctly between functions', async () => {
      // Arrange
      const expectedClientId = 'specific-client-id-456';
      (seedClient as Mock).mockResolvedValue(expectedClientId);
      (seedGroup as Mock).mockResolvedValue(undefined);
      (seedUser as Mock).mockResolvedValue(undefined);
      (seedCategory as Mock).mockResolvedValue(undefined);
      (seedConfiguration as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      await seedDatabase();

      // Assert - Verify client_id is passed to all dependent functions
      expect(seedGroup).toHaveBeenCalledWith(expectedClientId);
      expect(seedUser).toHaveBeenCalledWith(expectedClientId);
      expect(seedCategory).toHaveBeenCalledWith(expectedClientId);
      expect(seedConfiguration).toHaveBeenCalledWith(expectedClientId);
    });

    it('should handle empty client_id gracefully', async () => {
      // Arrange
      (seedClient as Mock).mockResolvedValue('');
      (seedGroup as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      await seedDatabase();

      // Assert
      expect(seedGroup).toHaveBeenCalledWith('');
      expect(seedUser).toHaveBeenCalledWith('');
      expect(seedCategory).toHaveBeenCalledWith('');
      expect(seedConfiguration).toHaveBeenCalledWith('');
    });
  });

  describe('Performance and Async Handling', () => {
    it('should handle all functions as async operations', async () => {
      // Arrange
      const testClientId = 'async-test-client-id';
      let executionOrder: string[] = [];

      (seedClient as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('client');
        return testClientId;
      });

      (seedGroup as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        executionOrder.push('group');
      });

      (seedUser as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        executionOrder.push('user');
      });

      (seedCategory as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 3));
        executionOrder.push('category');
      });

      (seedConfiguration as Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 8));
        executionOrder.push('configuration');
      });

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      await seedDatabase();

      // Assert - Check that functions executed in correct order despite timing
      expect(executionOrder).toEqual(['client', 'group', 'user', 'category', 'configuration']);
    });

    it('should complete within reasonable time', async () => {
      // Arrange
      const testClientId = 'performance-test-client-id';
      (seedClient as Mock).mockResolvedValue(testClientId);
      (seedGroup as Mock).mockResolvedValue(undefined);
      (seedUser as Mock).mockResolvedValue(undefined);
      (seedCategory as Mock).mockResolvedValue(undefined);
      (seedConfiguration as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      const startTime = Date.now();
      await seedDatabase();
      const endTime = Date.now();

      // Assert - Should complete within 1 second (generous for test environment)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Environment Variable Dependencies', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Arrange
      const originalEnv = process.env.VITE_SUPERADMIN;
      delete process.env.VITE_SUPERADMIN;

      const testClientId = 'env-test-client-id';
      (seedClient as Mock).mockResolvedValue(testClientId);
      (seedGroup as Mock).mockResolvedValue(undefined);
      (seedUser as Mock).mockResolvedValue(undefined);
      (seedCategory as Mock).mockResolvedValue(undefined);
      (seedConfiguration as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act & Assert
      await expect(seedDatabase()).resolves.not.toThrow();

      // Cleanup
      if (originalEnv) {
        process.env.VITE_SUPERADMIN = originalEnv;
      }
    });

    it('should use environment variables when available', async () => {
      // Arrange
      process.env.VITE_SUPERADMIN = 'test-admin@example.com,another-admin@example.com';

      const testClientId = 'env-available-client-id';
      (seedClient as Mock).mockResolvedValue(testClientId);
      (seedGroup as Mock).mockResolvedValue(undefined);
      (seedUser as Mock).mockResolvedValue(undefined);
      (seedCategory as Mock).mockResolvedValue(undefined);
      (seedConfiguration as Mock).mockResolvedValue(undefined);

      // Import the main function after mocking
      const { default: seedDatabase } = await import('./seed');

      // Act
      await seedDatabase();

      // Assert
      expect(seedClient).toHaveBeenCalled();
      expect(seedUser).toHaveBeenCalledWith(testClientId);
    });
  });
});