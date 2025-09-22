import { PrismaClient } from '@prisma/client';
import { configuration, getAllConfigurations } from './configuration';

const prisma = new PrismaClient();

async function testConfigurations() {
  try {
    console.log('=== Testing Configuration Helper ===\n');

    // First, let's see what clients exist
    const clients = await prisma.clients.findMany();
    console.log('Available clients:');
    clients.forEach(client => {
      console.log(`  - ${client.name} (ID: ${client.id})`);
    });

    // Get the first client ID
    const clientId = clients.length > 0 ? clients[0].id : null;
    console.log(`\nUsing client ID: ${clientId}\n`);

    // Check all configurations in database
    console.log('All configurations in database:');
    const allConfigs = await prisma.configurations.findMany({
      where: { status_id: 0 }
    });
    
    allConfigs.forEach(config => {
      console.log(`  - ${config.key} = ${config.value} (client: ${config.client_id})`);
    });

    console.log('\n=== Testing Helper Functions ===\n');

    // Test with client_id
    const jwtExpiryWithClient = await configuration('security.jwt.expiry', '1h', clientId);
    console.log(`JWT Expiry (with client): ${jwtExpiryWithClient}`);

    // Test without client_id (global)
    const jwtExpiryGlobal = await configuration('security.jwt.expiry', '1h', null);
    console.log(`JWT Expiry (global): ${jwtExpiryGlobal}`);

    // Test rate limit
    const rateLimitWithClient = await configuration('api.rate_limit.default', '60', clientId);
    console.log(`Rate Limit (with client): ${rateLimitWithClient}`);

    const rateLimitGlobal = await configuration('api.rate_limit.default', '60', null);
    console.log(`Rate Limit (global): ${rateLimitGlobal}`);

    // Test swagger enabled
    const swaggerWithClient = await configuration('features.swagger.enabled', 'false', clientId);
    console.log(`Swagger Enabled (with client): ${swaggerWithClient}`);

    const swaggerGlobal = await configuration('features.swagger.enabled', 'false', null);
    console.log(`Swagger Enabled (global): ${swaggerGlobal}`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConfigurations();