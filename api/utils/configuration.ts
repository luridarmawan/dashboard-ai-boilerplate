import { PrismaClient } from '@prisma/client';
import { generateUUIDv7, isValidUUIDv7 } from './uuid';
import { readFile } from './files';

const prisma = new PrismaClient();

// Cache for configuration values to avoid repeated database queries
const configCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds


interface DefaultConfiguration {
  section: string;
  key: string;
  value: string;
  type?: string;
  description: string;
  order?: number;
  public?: boolean;
  status_id?: number;
}

/**
 * Get configuration value by key
 * @param key - Configuration key (e.g., "security.jwt.expiry")
 * @param clientId - Optional client ID, if null will get global configuration
 * @param useCache - Whether to use cache (default: true)
 * @returns Configuration value as string, or null if not found
 */
export async function getConfiguration(
  key: string, 
  clientId: string | null = null,
  useCache: boolean = true,
  internal: boolean = false
): Promise<string | null> {
  const cacheKey = `${key}:${clientId || 'global'}`;

  if (!clientId || (clientId == null) || !isValidUUIDv7(clientId)) {
    return null;
  }
  
  // Check cache first
  if (useCache) {
    const cached = configCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.value;
    }
  }

  try {
    let where = {
      key: key,
      client_id: clientId,
      status_id: 0 // Only active configurations
    }
    if (!internal) {
      where = {
        ...where,
        public: true
      }
    }

    const config = await prisma.configurations.findFirst({
      where: where,
      orderBy: {
        order: 'asc'
      }
    });

    if (config) {
      // Cache the result
      if (useCache) {
        configCache.set(cacheKey, {
          value: config.value,
          timestamp: Date.now()
        });
      }
      return config.value;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching configuration for key "${key}":`, error);
    return null;
  }
}

/**
 * Simplified configuration getter function
 * @param key - Configuration key
 * @param defaultValue - Default value if configuration not found
 * @param clientId - Optional client ID
 * @returns Configuration value or default value
 */
export async function configuration(
  key: string, 
  defaultValue: string = '', 
  clientId: string | null = null,
  internal: boolean = false
): Promise<string> {
  const value = await getConfiguration(key, clientId, true, internal);

  return value !== null ? value : defaultValue;
}

/**
 * Get configuration value as number
 * @param key - Configuration key
 * @param defaultValue - Default value if configuration not found or invalid
 * @param clientId - Optional client ID
 * @returns Configuration value as number
 */
export async function configurationAsNumber(
  key: string, 
  defaultValue: number = 0, 
  clientId: string | null = null
): Promise<number> {
  const value = await getConfiguration(key, clientId);
  if (value !== null) {
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }
  return defaultValue;
}

/**
 * Get configuration value as boolean
 * @param key - Configuration key
 * @param defaultValue - Default value if configuration not found
 * @param clientId - Optional client ID
 * @returns Configuration value as boolean
 */
export async function configurationAsBoolean(
  key: string, 
  defaultValue: boolean = false, 
  clientId: string | null = null
): Promise<boolean> {
  const value = await getConfiguration(key, clientId);
  if (value !== null) {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
}

/**
 * Set configuration value
 * @param key - Configuration key
 * @param value - Configuration value
 * @param title - Optional title
 * @param clientId - Optional client ID
 * @returns Created or updated configuration
 */
export async function setConfiguration(
  key: string, 
  value: string, 
  title?: string, 
  clientId: string | null = null
) {
  try {
    // Check if configuration exists
    const existingConfig = await prisma.configurations.findFirst({
      where: {
        key: key,
        client_id: clientId
      }
    });

    const cacheKey = `${key}:${clientId || 'global'}`;
    
    if (existingConfig) {
      // Update existing configuration
      const updatedConfig = await prisma.configurations.update({
        where: { id: existingConfig.id },
        data: {
          value: value,
          title: title || existingConfig.title,
          updated_at: new Date()
        }
      });

      // Update cache
      configCache.set(cacheKey, {
        value: value,
        timestamp: Date.now()
      });

      return updatedConfig;
    } else {
      // Create new configuration
      const newConfig = await prisma.configurations.create({
        data: {
          client_id: clientId,
          key: key,
          value: value,
          title: title || '',
          status_id: 0
        }
      });

      // Update cache
      configCache.set(cacheKey, {
        value: value,
        timestamp: Date.now()
      });

      return newConfig;
    }
  } catch (error) {
    console.error(`Error setting configuration for key "${key}":`, error);
    throw error;
  }
}

/**
 * Clear configuration cache
 * @param key - Optional specific key to clear, if not provided clears all cache
 */
export function clearConfigurationCache(key?: string): void {
  if (key) {
    // Clear specific key for all clients
    for (const cacheKey of configCache.keys()) {
      if (cacheKey.startsWith(`${key}:`)) {
        configCache.delete(cacheKey);
      }
    }
  } else {
    // Clear all cache
    configCache.clear();
  }
}

/**
 * Get all configurations for a client
 * @param clientId - Client ID, null for global configurations
 * @returns Array of configurations
 */
export async function getAllConfigurations(clientId: string | null = null) {
  try {
    return await prisma.configurations.findMany({
      where: {
        client_id: clientId,
        status_id: 0
      },
      orderBy: {
        key: 'asc'
      }
    });
  } catch (error) {
    console.error('Error fetching all configurations:', error);
    return [];
  }
}


export const seedConfiguration = async (client_id: string, configurationFile: string, firstInstall: boolean = true): Promise<void> => {
  let configurations = readFile(configurationFile, true, []);

  console.log(`    👉 Seeding configuration...`);
  try {

    for (const config of configurations) {
      // Check if configuration already exists
      const existingConfig = await prisma.configurations.findFirst({
        where: {
          client_id: client_id,
          key: config.key,
        }
      });

      if (existingConfig) {
        console.log(`       - Configuration with key ${config.key} already exists, skipping...`);
        continue;
      }

      if (!firstInstall) {
        // TODO: not first install
      }

      // Create configuration
      const configId = generateUUIDv7();
      const newConfig = await prisma.configurations.create({
        data: {
          id: configId,
          client_id: client_id,
          section: config.section,
          sub: config.sub || null,
          key: config.key,
          value: config.value,
          type: config.type,
          title: config.title,
          note: config.note,
          order: config.order,
          public: config.public,
          status_id: 0,
        }
      });

      if (newConfig.type == 'text') {
        console.log(`    ⚙️  Created configuration: ${newConfig.key} = ...`);
      } else {
        console.log(`    ⚙️  Created configuration: ${newConfig.key} = ${newConfig.value}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error seeding example configuration: ${error}`);
  }
}
