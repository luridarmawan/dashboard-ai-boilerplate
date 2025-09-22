/**
 * UUID v7 Library Test File
 * 
 * This file demonstrates usage and tests the UUID v7 library functionality.
 * Run with: npx tsx server/utils/uuid.test.ts
 */

import {
  generateUUIDv7,
  generateMultipleUUIDv7,
  extractTimestamp,
  isValidUUIDv7,
  uuidToDate,
  compareUUIDv7,
  sortUUIDv7
} from './uuid';

console.log('=== UUID v7 Library Test ===\n');

// Test 1: Basic UUID generation
console.log('1. Basic UUID Generation:');
const uuid1 = generateUUIDv7();
const uuid2 = generateUUIDv7();
console.log(`UUID 1: ${uuid1}`);
console.log(`UUID 2: ${uuid2}`);
console.log(`Valid UUID 1: ${isValidUUIDv7(uuid1)}`);
console.log(`Valid UUID 2: ${isValidUUIDv7(uuid2)}`);
console.log();

// Test 2: UUID with specific timestamp
console.log('2. UUID with Specific Timestamp:');
const specificTime = new Date('2024-01-01T00:00:00Z').getTime();
const uuidWithTime = generateUUIDv7(specificTime);
console.log(`UUID with timestamp: ${uuidWithTime}`);
console.log(`Extracted timestamp: ${extractTimestamp(uuidWithTime)}`);
console.log(`Original timestamp: ${specificTime}`);
console.log(`Timestamps match: ${extractTimestamp(uuidWithTime) === specificTime}`);
console.log();

// Test 3: Multiple UUID generation
console.log('3. Multiple UUID Generation:');
const multipleUuids = generateMultipleUUIDv7(5);
multipleUuids.forEach((uuid, index) => {
  console.log(`UUID ${index + 1}: ${uuid} (${uuidToDate(uuid).toISOString()})`);
});
console.log();

// Test 4: UUID comparison and sorting
console.log('4. UUID Comparison and Sorting:');
const unsortedUuids = [
  generateUUIDv7(Date.now() + 3000),
  generateUUIDv7(Date.now() + 1000),
  generateUUIDv7(Date.now() + 2000),
];
console.log('Unsorted UUIDs:');
unsortedUuids.forEach((uuid, index) => {
  console.log(`  ${index + 1}: ${uuid} (${uuidToDate(uuid).toISOString()})`);
});

const sortedUuids = sortUUIDv7(unsortedUuids);
console.log('Sorted UUIDs (chronological):');
sortedUuids.forEach((uuid, index) => {
  console.log(`  ${index + 1}: ${uuid} (${uuidToDate(uuid).toISOString()})`);
});
console.log();

// Test 5: Validation tests
console.log('5. Validation Tests:');
const validTests = [
  uuid1,
  uuid2,
  uuidWithTime
];

const invalidTests = [
  'invalid-uuid',
  '123e4567-e89b-12d3-a456-426614174000', // UUID v1
  '550e8400-e29b-41d4-a716-446655440000', // UUID v4
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // UUID v1
  ''
];

console.log('Valid UUIDs:');
validTests.forEach(uuid => {
  console.log(`  ${uuid}: ${isValidUUIDv7(uuid)}`);
});

console.log('Invalid UUIDs:');
invalidTests.forEach(uuid => {
  console.log(`  ${uuid}: ${isValidUUIDv7(uuid)}`);
});
console.log();

// Test 6: Performance test
console.log('6. Performance Test:');
const startTime = Date.now();
const performanceUuids = generateMultipleUUIDv7(1000);
const endTime = Date.now();
console.log(`Generated 1000 UUIDs in ${endTime - startTime}ms`);
console.log(`Average: ${(endTime - startTime) / 1000}ms per UUID`);
console.log();

// Test 7: Uniqueness test
console.log('7. Uniqueness Test:');
const uniquenessTest = generateMultipleUUIDv7(10000);
const uniqueSet = new Set(uniquenessTest);
console.log(`Generated: ${uniquenessTest.length} UUIDs`);
console.log(`Unique: ${uniqueSet.size} UUIDs`);
console.log(`All unique: ${uniquenessTest.length === uniqueSet.size}`);

console.log('\n=== Test Complete ===');