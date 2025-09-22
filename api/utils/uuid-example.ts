/**
 * UUID v7 Usage Examples
 * 
 * This file shows practical examples of how to use the UUID v7 library
 * in your server application.
 */

import { generateUUIDv7, isValidUUIDv7, extractTimestamp } from './uuid';

// Example 1: Using UUID v7 for database records
export function createUserRecord(userData: any) {
  const userId = generateUUIDv7();
  
  return {
    id: userId,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Example 2: Using UUID v7 for API request tracking
export function generateRequestId(): string {
  return generateUUIDv7();
}

// Example 3: Using UUID v7 for session management
export function createSession(userId: string) {
  const sessionId = generateUUIDv7();
  
  return {
    sessionId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
}

// Example 4: Validating UUID v7 in middleware
export function validateUUIDParam(uuid: string): boolean {
  if (!uuid) return false;
  return isValidUUIDv7(uuid);
}

// Example 5: Extracting creation time from UUID
export function getRecordAge(uuid: string): number {
  try {
    const timestamp = extractTimestamp(uuid);
    return Date.now() - timestamp;
  } catch {
    return -1; // Invalid UUID
  }
}

// Example 6: Batch operations with sequential UUIDs
export function createBatchRecords(count: number, baseData: any): any[] {
  const baseTimestamp = Date.now();
  const records: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = generateUUIDv7(baseTimestamp + i);
    records.push({
      id,
      ...baseData,
      sequence: i
    });
  }
  
  return records;
}

// Example usage in Express route
/*
import express from 'express';
import { generateUUIDv7, validateUUIDParam } from './utils/uuid';

const app = express();

// Create new resource with UUID v7
app.post('/api/users', (req, res) => {
  const userId = generateUUIDv7();
  
  // Save to database with the generated ID
  const user = {
    id: userId,
    ...req.body,
    createdAt: new Date()
  };
  
  res.json(user);
});

// Validate UUID parameter
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  if (!validateUUIDParam(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  
  // Proceed with database lookup
  res.json({ message: `User ${id} found` });
});
*/