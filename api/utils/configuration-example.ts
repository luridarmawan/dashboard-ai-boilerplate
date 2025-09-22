/**
 * Configuration Helper Usage Examples
 * 
 * This file demonstrates how to use the configuration helper functions
 */

import { configuration, configurationAsNumber, configurationAsBoolean, setConfiguration } from './configuration';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example usage function
export async function configurationExamples() {
  console.log('=== Configuration Helper Examples ===\n');

  try {
    // Get the first client ID for demonstration
    const clients = await prisma.clients.findMany();
    const clientId = clients.length > 0 ? clients[0].id : null;
    console.log(`Using client ID: ${clientId}\n`);

    // Basic usage - get JWT expiry
    const jwtExpiry = await configuration('security.jwt.expiry', '1h', clientId);
    console.log(`JWT Expiry: ${jwtExpiry}`);

    // Get with default value
    const rateLimit = await configuration('api.rate_limit.default', '60', clientId);
    console.log(`Rate Limit: ${rateLimit}`);

    // Get as number
    const minPasswordLength = await configurationAsNumber('security.password.min_length', 6, clientId);
    console.log(`Min Password Length: ${minPasswordLength}`);

    // Get as boolean
    const swaggerEnabled = await configurationAsBoolean('features.swagger.enabled', false, clientId);
    console.log(`Swagger Enabled: ${swaggerEnabled}`);

    const auditEnabled = await configurationAsBoolean('features.audit.enabled', false, clientId);
    console.log(`Audit Enabled: ${auditEnabled}`);

    const maintenanceMode = await configurationAsBoolean('maintenance.mode', false, clientId);
    console.log(`Maintenance Mode: ${maintenanceMode}`);

    // Get logging level
    const loggingLevel = await configuration('logging.level', 'info', clientId);
    console.log(`Logging Level: ${loggingLevel}`);

    // Get database connection pool max
    const dbPoolMax = await configurationAsNumber('database.connection_pool.max', 50, clientId);
    console.log(`DB Pool Max: ${dbPoolMax}`);

    console.log('\n=== Global Configuration Examples ===');
    
    // Example of global configuration (without client_id)
    const globalJwtExpiry = await configuration('security.jwt.expiry', '1h', null);
    console.log(`Global JWT Expiry: ${globalJwtExpiry}`);

    console.log('\n=== Configuration Examples Completed ===');

  } catch (error) {
    console.error('Error in configuration examples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Example of setting a new configuration
export async function setConfigurationExample() {
  try {
    // Set a new configuration
    await setConfiguration(
      'app.version', 
      '1.0.0', 
      'Application version number'
    );
    
    // Get the newly set configuration
    const appVersion = await configuration('app.version');
    console.log(`App Version: ${appVersion}`);
    
  } catch (error) {
    console.error('Error setting configuration:', error);
  }
}

// Run examples automatically when this file is executed
configurationExamples()
  .then(() => setConfigurationExample())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Example execution failed:', error);
    process.exit(1);
  });