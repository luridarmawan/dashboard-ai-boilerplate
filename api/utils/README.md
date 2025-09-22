# Server Utils

This directory contains utility libraries for the server application.

## UUID v7 Library

A comprehensive UUID v7 generator library that creates time-ordered UUIDs for better database performance and natural sorting.

### Features

- **Time-ordered**: UUIDs are naturally sortable by creation time
- **High performance**: Optimized for bulk generation
- **Cryptographically secure**: Uses secure random number generation
- **Validation**: Built-in validation and parsing utilities
- **TypeScript**: Full TypeScript support with type definitions

### UUID v7 Format

```
XXXXXXXX-XXXX-7XXX-XXXX-XXXXXXXXXXXX
│        │    │    │    │
│        │    │    │    └─ 48-bit random data
│        │    │    └─ 16-bit random data (with variant bits)
│        │    └─ 16-bit random data (with version 7)
│        └─ 16-bit timestamp (mid)
└─ 32-bit timestamp (high)
```

### Basic Usage

```typescript
import { generateUUIDv7, isValidUUIDv7, extractTimestamp } from './api/utils/uuid';

// Generate a new UUID v7
const uuid = generateUUIDv7();
console.log(uuid); // e.g., "01234567-89ab-7def-8123-456789abcdef"

// Generate with specific timestamp
const specificUuid = generateUUIDv7(Date.now());

// Validate UUID
const isValid = isValidUUIDv7(uuid);
console.log(isValid); // true

// Extract timestamp
const timestamp = extractTimestamp(uuid);
console.log(new Date(timestamp)); // Original creation time
```

### Advanced Usage

```typescript
import { 
  generateMultipleUUIDv7, 
  sortUUIDv7, 
  compareUUIDv7,
  uuidToDate 
} from './api/utils/uuid';

// Generate multiple UUIDs
const uuids = generateMultipleUUIDv7(10);

// Sort UUIDs chronologically
const sorted = sortUUIDv7(uuids);

// Compare two UUIDs
const comparison = compareUUIDv7(uuid1, uuid2);
// Returns: -1 (uuid1 earlier), 0 (same time), 1 (uuid2 earlier)

// Convert UUID to Date
const date = uuidToDate(uuid);
console.log(date.toISOString());
```

### Default Export Usage

```typescript
import uuid from './api/utils/uuid';

const newUuid = uuid.generate();
const isValid = uuid.isValid(newUuid);
const timestamp = uuid.extractTimestamp(newUuid);
const date = uuid.toDate(newUuid);
```

### API Reference

#### Functions

- **`generateUUIDv7(timestamp?: number): string`**
  - Generates a new UUID v7
  - Optional timestamp parameter (defaults to current time)

- **`generateMultipleUUIDv7(count: number, baseTimestamp?: number): string[]`**
  - Generates multiple UUIDs with sequential timestamps
  - Useful for bulk operations

- **`isValidUUIDv7(uuid: string): boolean`**
  - Validates if a string is a valid UUID v7
  - Checks format and timestamp reasonableness

- **`extractTimestamp(uuid: string): number`**
  - Extracts timestamp from UUID v7
  - Returns milliseconds since Unix epoch

- **`uuidToDate(uuid: string): Date`**
  - Converts UUID v7 to Date object
  - Throws error if invalid UUID

- **`compareUUIDv7(uuid1: string, uuid2: string): number`**
  - Compares two UUIDs chronologically
  - Returns -1, 0, or 1

- **`sortUUIDv7(uuids: string[]): string[]`**
  - Sorts array of UUIDs chronologically
  - Returns new sorted array

### Use Cases

1. **Database Primary Keys**: Time-ordered for better B-tree performance
2. **Event Logging**: Natural chronological ordering
3. **Distributed Systems**: Conflict-free identifier generation
4. **API Resources**: Sortable resource identifiers

### Performance

- Single UUID generation: ~0.1ms
- Bulk generation (1000 UUIDs): ~100ms
- Validation: ~0.01ms per UUID

### Testing

Run the test file to verify functionality:

```bash
# Using npm script (recommended)
npm run test:uuid

# Or directly with tsx
npx tsx server/utils/uuid.test.ts
```

**Note**: Use `tsx` instead of `ts-node` because this project uses ES modules (`"type": "module"` in package.json).

The test file includes:
- Basic generation tests
- Validation tests
- Performance benchmarks
- Uniqueness verification
- Sorting and comparison tests

### Integration Example

```typescript
// In your route handler
import { generateUUIDv7 } from '../utils/uuid';

app.post('/api/users', async (req, res) => {
  const userId = generateUUIDv7();
  
  const user = await db.user.create({
    data: {
      id: userId,
      ...req.body
    }
  });
  
  res.json(user);
});
```

### Notes

- UUID v7 is designed for database efficiency with time-based sorting
- The first 48 bits contain the timestamp, making UUIDs naturally ordered
- Remaining bits are cryptographically random for uniqueness
- Compatible with standard UUID libraries and databases