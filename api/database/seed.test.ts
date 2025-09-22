import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import bcrypt from 'bcryptjs';
import { generateUUIDv7 } from '../utils/uuid';

// Mock all external dependencies before importing the module under test
vi.mock('@prisma/client', () => {
  const mockPrismaInstance = {
    clients: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    groups: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    group_permissions: {
      create: vi.fn(),
    },
    users: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    client_user_maps: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    group_user_maps: {
      create: vi.fn(),
    },
    categories: {
      createMany: vi.fn(),
    },
    configurations: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaInstance)
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn()
  }
}));

vi.mock('../utils/uuid', () => ({
  generateUUIDv7: vi.fn()
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn()
  }
}));

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  }
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn(),
    dirname: vi.fn()
  }
}));

vi.mock('url', () => ({
  default: {
    fileURLToPath: vi.fn()
  },
  fileURLToPath: vi.fn()
}));

vi.mock('../utils', () => ({
  removeCommentLines: vi.fn((text: string) => text),
  readFile: vi.fn((path: string, isJson: boolean, defaultValue: any) => {
    if (path && path.includes && path.includes('configuration.json')) {
      return [
        {
          section: 'app',
          key: 'test.key',
          value: 'test-value',
          type: 'string',
          title: 'Test Configuration',
          note: 'Test note',
          order: 1,
          public: true,
          status_id: 0,
        }
      ];
    }
    return defaultValue || [];
  })
}));

vi.mock('../utils/logs', () => ({
  logs: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Now import the functions to test
import { seedClient, seedGroup, seedUser, seedCategory, seedConfiguration } from './seed';
import { PrismaClient } from '@prisma/client';

// Get the mocked Prisma instance
const MockedPrismaClient = vi.mocked(PrismaClient);
const mockPrisma = new MockedPrismaClient() as any;



// Mock environment variables
process.env.VITE_SUPERADMIN = 'admin@example.com,test@example.com';

describe('Seed Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock functions in mockPrisma
    Object.values(mockPrisma).forEach(table => {
      if (typeof table === 'object' && table !== null) {
        Object.values(table).forEach(method => {
          if (typeof method === 'function') {
            method.mockReset();
          }
        });
      }
    });

    (generateUUIDv7 as Mock).mockReturnValue('test-uuid-123');
    (bcrypt.hash as Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('seedClient', () => {
    it('should create a new client when none exists', async () => {
      // Arrange
      mockPrisma.clients.findFirst.mockResolvedValue(null);
      mockPrisma.clients.create.mockResolvedValue({
        id: 'test-client-id',
        name: 'Internal',
        description: 'Internal Company',
      });

      // Act
      const clientId = await seedClient();

      // Assert
      expect(mockPrisma.clients.findFirst).toHaveBeenCalledWith({
        where: { name: 'Internal' }
      });
      expect(mockPrisma.clients.create).toHaveBeenCalledWith({
        data: {
          id: 'test-uuid-123',
          name: 'Internal',
          description: 'Internal Company',
          parent_id: null,
          metadata: undefined,
          status_id: 0,
        }
      });
      expect(clientId).toBe('test-client-id');
    });

    it('should return existing client id when client already exists', async () => {
      // Arrange
      mockPrisma.clients.findFirst.mockResolvedValue({
        id: 'existing-client-id',
        name: 'Internal',
      });

      // Act
      const clientId = await seedClient();

      // Assert
      expect(mockPrisma.clients.findFirst).toHaveBeenCalled();
      expect(mockPrisma.clients.create).not.toHaveBeenCalled();
      expect(clientId).toBe('existing-client-id');
    });

    it('should throw error when no client is found or created', async () => {
      // Arrange
      mockPrisma.clients.findFirst.mockResolvedValue(null);
      mockPrisma.clients.create.mockResolvedValue(null);

      // Act & Assert
      await expect(seedClient()).rejects.toThrow(
        'Cannot read properties of null (reading \'id\')'
      );
    });
  });

  describe('seedGroup', () => {
    it('should create new groups with proper permissions', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.groups.findFirst.mockResolvedValue(null);
      mockPrisma.groups.create
        .mockResolvedValueOnce({
          id: 'admin-group-id',
          name: 'Administrator',
          client_id: clientId,
        })
        .mockResolvedValueOnce({
          id: 'operator-group-id',
          name: 'Operator',
          client_id: clientId,
        })
        .mockResolvedValueOnce({
          id: 'viewer-group-id',
          name: 'Viewer',
          client_id: clientId,
        })
        .mockResolvedValueOnce({
          id: 'user-group-id',
          name: 'Regular User',
          client_id: clientId,
        });

      // Act
      await seedGroup(clientId);

      // Assert
      expect(mockPrisma.groups.create).toHaveBeenCalledTimes(4);
      expect(mockPrisma.group_permissions.create).toHaveBeenCalledTimes(4); // Admin(1) + Operator(2) + Viewer(1)
    });

    it('should skip existing groups', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.groups.findFirst.mockResolvedValue({
        id: 'existing-group-id',
        name: 'Administrator',
      });

      // Act
      await seedGroup(clientId);

      // Assert
      expect(mockPrisma.groups.create).not.toHaveBeenCalled();
      expect(mockPrisma.group_permissions.create).not.toHaveBeenCalled();
    });
  });

  describe('seedUser', () => {
    it('should create new users with proper mappings', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: 'test-user-id',
        email: 'admin@example.com',
        client_id: clientId,
      });

      // Act
      await seedUser(clientId);

      // Assert
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(mockPrisma.client_user_maps.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should skip creating client_user_maps for unknown@example.com', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: 'unknown-user-id',
        email: 'unknown@example.com',
        client_id: clientId,
      });

      // Act
      await seedUser(clientId);

      // Assert
      expect(mockPrisma.users.create).toHaveBeenCalled();
      // Should not create client_user_maps for unknown user
    });

    it('should handle existing users and create missing client_user_maps', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'admin@example.com',
      });
      mockPrisma.client_user_maps.findFirst.mockResolvedValue(null);

      // Act
      await seedUser(clientId);

      // Assert
      expect(mockPrisma.users.create).not.toHaveBeenCalled();
      expect(mockPrisma.client_user_maps.create).toHaveBeenCalledWith({
        data: {
          client_id: clientId,
          user_id: 'existing-user-id',
          role_id: null,
          ref_id: 0,
          status_id: 0,
        }
      });
    });
  });

  describe('seedCategory', () => {
    it('should create default categories', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.categories.createMany.mockResolvedValue({ count: 1 });

      // Act
      await seedCategory(clientId);

      // Assert
      expect(mockPrisma.categories.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 'test-uuid-123',
            client_id: clientId,
            section: 'general',
            name: 'General',
            description: 'General category',
            status_id: 0,
          },
        ]
      });
    });
  });

  describe('seedConfiguration', () => {
    it('should handle empty configuration array gracefully', async () => {
      // Arrange
      const clientId = 'test-client-id';

      // Act & Assert - should not throw error even with empty configuration array
      await expect(seedConfiguration(clientId)).resolves.not.toThrow();
    });

    it('should skip existing configurations', async () => {
      // Arrange
      const clientId = 'test-client-id';
      mockPrisma.configurations.findFirst.mockResolvedValue({
        id: 'existing-config-id',
        key: 'existing.key',
        client_id: clientId,
      });

      // Act
      await seedConfiguration(clientId);

      // Assert
      expect(mockPrisma.configurations.create).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPrisma.clients.findFirst.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(seedClient()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid client_id in seedGroup', async () => {
      // Arrange
      const invalidClientId = '';
      mockPrisma.groups.findFirst.mockResolvedValue(null);
      mockPrisma.groups.create.mockRejectedValue(new Error('Invalid client_id'));

      // Act & Assert
      await expect(seedGroup(invalidClientId)).rejects.toThrow('Invalid client_id');
    });
  });

  describe('Integration Tests', () => {
    it('should handle the complete seeding workflow', async () => {
      // Arrange
      mockPrisma.clients.findFirst.mockResolvedValue(null);
      mockPrisma.clients.create.mockResolvedValue({
        id: 'test-client-id',
        name: 'Internal',
      });
      mockPrisma.groups.findFirst.mockResolvedValue(null);
      mockPrisma.groups.create.mockResolvedValue({
        id: 'test-group-id',
        name: 'Administrator',
      });
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: 'test-user-id',
        email: 'admin@example.com',
      });
      mockPrisma.categories.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.configurations.findFirst.mockResolvedValue(null);
      mockPrisma.configurations.create.mockResolvedValue({
        id: 'test-config-id',
        key: 'test.key',
      });

      // Act
      const clientId = await seedClient();
      await seedGroup(clientId);
      await seedUser(clientId);
      await seedCategory(clientId);
      await seedConfiguration(clientId);

      // Assert
      expect(clientId).toBe('test-client-id');
      expect(mockPrisma.clients.create).toHaveBeenCalled();
      expect(mockPrisma.groups.create).toHaveBeenCalled();
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(mockPrisma.categories.createMany).toHaveBeenCalled();
    });
  });
});