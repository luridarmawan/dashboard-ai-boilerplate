# Seed Functions Testing Documentation

## Overview

This document describes the comprehensive TypeScript testing suite for the refactored seed database functions. The tests ensure that each seeding operation works correctly both individually and as part of the complete seeding workflow.

## Test Structure

### 1. Unit Tests (`seed.test.ts`)

**Location**: `api/database/seed.test.ts`

**Purpose**: Test individual seed functions in isolation

**Functions Tested**:
- `seedClient()` - Tests client creation and existing client handling
- `seedGroup()` - Tests group creation with proper permissions
- `seedUser()` - Tests user creation with mappings and relationships
- `seedCategory()` - Tests category creation
- `seedConfiguration()` - Tests configuration creation with environment variable handling

**Key Test Scenarios**:
- ✅ New entity creation
- ✅ Existing entity detection and skipping
- ✅ Error handling for database failures
- ✅ Proper relationship creation (client-user maps, group permissions)
- ✅ Environment variable integration
- ✅ Special case handling (e.g., unknown@example.com user)

### 2. Integration Tests (`seedDatabase.integration.test.ts`)

**Location**: `api/database/seedDatabase.integration.test.ts`

**Purpose**: Test the main `seedDatabase` function and workflow orchestration

**Test Scenarios**:
- ✅ Correct execution order of all seed functions
- ✅ Proper client_id propagation between functions
- ✅ Error handling and database disconnection
- ✅ Performance and async operation handling
- ✅ Environment variable dependency management

## Test Configuration

### Vitest Configuration

**Client-side tests**: `vitest.config.ts` (React/Frontend)
```typescript
environment: 'jsdom'
setupFiles: ['./src/setupTests.ts']
```

**Server-side tests**: `vitest.server.config.ts` (Node.js/Backend)
```typescript
environment: 'node'
setupFiles: ['./api/test-setup.ts']
include: ['api/**/*.test.ts']
```

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:seed` | Run all seed function tests (unit + integration) |
| `npm run test:seed:unit` | Run only unit tests for individual functions |
| `npm run test:seed:integration` | Run only integration tests for main workflow |
| `npm run test:seed:watch` | Run tests in watch mode for development |
| `npm run test:server` | Run all server-side tests |
| `npm run test:server:watch` | Run server tests in watch mode |
| `npm run test:server:coverage` | Run server tests with coverage report |

## Mock Strategy

### Database Mocking
```typescript
// Prisma Client is mocked to avoid actual database operations
vi.mock('@prisma/client');

const mockPrisma = {
  clients: { findFirst: vi.fn(), create: vi.fn() },
  groups: { findFirst: vi.fn(), create: vi.fn() },
  users: { findUnique: vi.fn(), create: vi.fn() },
  // ... other models
};
```

### Dependency Mocking
```typescript
// External dependencies are mocked
vi.mock('bcryptjs');
vi.mock('../utils/uuid');
vi.mock('fs');
vi.mock('dotenv');
```

## Test Coverage Areas

### 1. Function Behavior
- ✅ Correct data insertion
- ✅ Duplicate detection and skipping
- ✅ Error propagation
- ✅ Return value validation

### 2. Database Interactions
- ✅ Proper Prisma queries
- ✅ Relationship creation
- ✅ Transaction handling (implicit)

### 3. Business Logic
- ✅ Permission assignment based on group types
- ✅ User-group mapping logic
- ✅ Configuration value processing
- ✅ Environment variable integration

### 4. Error Scenarios
- ✅ Database connection failures
- ✅ Invalid input handling
- ✅ Missing dependencies
- ✅ Partial failure recovery

## Running Tests

### Development Workflow
```bash
# Run tests during development
npm run test:seed:watch

# Run specific test suite
npm run test:seed:unit

# Run with coverage
npm run test:server:coverage
```

### CI/CD Integration
```bash
# Run all tests (recommended for CI)
npm run test:seed

# Run with coverage for reporting
npm run test:server:coverage
```

## Test Data Management

### Mock Data
Tests use predefined mock data that mirrors the actual seed data structure:
- Default clients
- Default groups with permissions
- Default users with various statuses
- Default categories
- Default configurations

### Environment Variables
Tests handle environment variables through the test setup:
```typescript
process.env.VITE_SUPERADMIN = 'test-admin@example.com';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
```

## Benefits of This Testing Approach

### 1. **Reliability**
- Each function is tested independently
- Integration tests ensure workflow correctness
- Comprehensive error handling validation

### 2. **Maintainability**
- Tests are organized by function responsibility
- Clear separation between unit and integration tests
- Well-documented test scenarios

### 3. **Development Speed**
- Fast test execution with mocked dependencies
- Watch mode for continuous development
- Specific test commands for targeted testing

### 4. **Quality Assurance**
- High test coverage for critical seeding operations
- Performance testing for async operations
- Environment variable dependency validation

## Future Enhancements

### Potential Additions
1. **E2E Tests**: End-to-end tests with real database
2. **Performance Benchmarks**: Measure seeding operation speed
3. **Data Validation**: Verify seeded data integrity
4. **Rollback Testing**: Test cleanup and rollback scenarios

### Testing Best Practices
1. Always use TypeScript for type safety
2. Mock external dependencies consistently
3. Test both success and failure scenarios
4. Maintain clear test descriptions
5. Keep tests independent and isolated

## Conclusion

The comprehensive TypeScript testing suite ensures that the refactored seed functions are reliable, maintainable, and robust. The tests provide confidence in the seeding operations and facilitate safe refactoring and feature additions.