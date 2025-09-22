/**
 * Client-side configuration utilities
 * USAGE:
 *   const apiStream = await getConfigurationAsBoolean('ai.stream', import.meta.env.VITE_CHAT_API_STREAM === 'true', token);
 */

/**
 * Fetches a specific configuration value from the server
 * @param key - Configuration key (e.g., "ai.stream")
 * @param defaultValue - Default value if configuration not found
 * @returns Configuration value or default value
 */
export const getConfiguration = async (key: string, defaultValue: any = null, token?: any): Promise<any> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';
  
  try {
    const configResponse = await fetch(`${API_BASE_URL}/configuration/key/${key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const configData = await configResponse.json();

    if (configData.success && configData.data) {
      return configData.data.value;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error fetching configuration for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Fetches a configuration value as a boolean
 * @param key - Configuration key
 * @param defaultValue - Default value if configuration not found
 * @returns Configuration value as boolean
 */
export const getConfigurationAsBoolean = async (key: string, defaultValue: boolean = false, token?: any): Promise<boolean> => {
  const value = await getConfiguration(key, defaultValue.toString(), token);

  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
};

/**
 * Fetches a configuration value as a number
 * @param key - Configuration key
 * @param defaultValue - Default value if configuration not found
 * @returns Configuration value as number
 */
export const getConfigurationAsNumber = async (key: string, defaultValue: number = 0, token?: any): Promise<number> => {
  const value = await getConfiguration(key, defaultValue.toString(), token);

  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }
  return defaultValue;
};
