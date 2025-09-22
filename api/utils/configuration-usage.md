# Configuration Helper Usage Guide

This guide shows how to use the configuration helper functions to easily retrieve configuration values from the database.

## Basic Usage

```typescript
import { configuration } from '../utils/configuration';

// Simple usage - get JWT expiry
const jwtExpiry = await configuration('security.jwt.expiry');
console.log(jwtExpiry); // "24h"

// With default value
const rateLimit = await configuration('api.rate_limit.default', '60');
console.log(rateLimit); // "120" (from database) or "60" (default if not found)

// With specific client ID
const clientId = 'your-client-id';
const jwtExpiry = await configuration('security.jwt.expiry', '1h', clientId);
```

## Available Helper Functions

### 1. `configuration(key, defaultValue?, clientId?)`
Returns configuration value as string.

```typescript
const jwtExpiry = await configuration('security.jwt.expiry', '1h');
```

### 2. `configurationAsNumber(key, defaultValue?, clientId?)`
Returns configuration value as number.

```typescript
const minLength = await configurationAsNumber('security.password.min_length', 6);
console.log(minLength); // 8 (number)
```

### 3. `configurationAsBoolean(key, defaultValue?, clientId?)`
Returns configuration value as boolean.

```typescript
const swaggerEnabled = await configurationAsBoolean('features.swagger.enabled', false);
console.log(swaggerEnabled); // true (boolean)
```

### 4. `setConfiguration(key, value, description?, clientId?)`
Sets or updates a configuration value.

```typescript
await setConfiguration('app.version', '2.0.0', 'Application version');
```

### 5. `getAllConfigurations(clientId?)`
Gets all configurations for a client.

```typescript
const configs = await getAllConfigurations(clientId);
```

## Available Configuration Keys

The following configuration keys are available by default:

| Key | Default Value | Description |
|-----|---------------|-------------|
| `api.rate_limit.default` | `120` | Default rate limit per minute for API requests |
| `security.jwt.expiry` | `24h` | JWT token expiry duration |
| `security.password.min_length` | `8` | Minimum password length requirement |
| `database.connection_pool.max` | `100` | Maximum database connection pool size |
| `logging.level` | `info` | Application logging level (debug, info, warn, error) |
| `features.swagger.enabled` | `true` | Enable or disable Swagger documentation |
| `features.audit.enabled` | `true` | Enable or disable audit logging |
| `maintenance.mode` | `false` | Enable or disable maintenance mode |

## Real-World Examples

### JWT Token Configuration
```typescript
import { configuration } from '../utils/configuration';
import jwt from 'jsonwebtoken';

// Get JWT expiry from configuration
const jwtExpiry = await configuration('security.jwt.expiry', '24h');

// Use in JWT creation
const token = jwt.sign(payload, secret, { expiresIn: jwtExpiry });
```

### Rate Limiting
```typescript
import { configurationAsNumber } from '../utils/configuration';

// Get rate limit from configuration
const rateLimit = await configurationAsNumber('api.rate_limit.default', 60);

// Use in rate limiter middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: rateLimit
});
```

### Feature Flags
```typescript
import { configurationAsBoolean } from '../utils/configuration';

// Check if Swagger is enabled
const swaggerEnabled = await configurationAsBoolean('features.swagger.enabled', false);

if (swaggerEnabled) {
  // Setup Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}
```

### Password Validation
```typescript
import { configurationAsNumber } from '../utils/configuration';

// Get minimum password length
const minLength = await configurationAsNumber('security.password.min_length', 8);

// Use in validation
if (password.length < minLength) {
  throw new Error(`Password must be at least ${minLength} characters long`);
}
```

## Client-Specific vs Global Configurations

- **Client-specific**: Pass a `clientId` to get configuration for a specific client
- **Global**: Pass `null` or omit `clientId` to get global configuration

```typescript
// Client-specific configuration
const clientConfig = await configuration('security.jwt.expiry', '1h', clientId);

// Global configuration
const globalConfig = await configuration('security.jwt.expiry', '1h', null);
```

## Caching

The configuration helper includes built-in caching with a 5-minute TTL to improve performance:

- Configurations are cached automatically
- Cache is cleared when configurations are updated
- You can manually clear cache using `clearConfigurationCache()`

```typescript
import { clearConfigurationCache } from '../utils/configuration';

// Clear all cache
clearConfigurationCache();

// Clear cache for specific key
clearConfigurationCache('security.jwt.expiry');
```

## Error Handling

The helper functions handle errors gracefully:

```typescript
try {
  const config = await configuration('some.key');
  // Use config
} catch (error) {
  console.error('Configuration error:', error);
  // Fallback to default behavior
}
```

## Testing

Run the configuration examples:

```bash
npm run test:configuration
```

This will demonstrate all the helper functions with real data from your database.