/**
 * UUID v7 Generator Library
 * 
 * UUID v7 is a time-ordered UUID that includes a timestamp in the first 48 bits,
 * followed by 12 bits of randomness and a 62-bit random component.
 * 
 * Format: XXXXXXXX-XXXX-7XXX-XXXX-XXXXXXXXXXXX
 * - First 48 bits: Unix timestamp in milliseconds
 * - Next 12 bits: Random data
 * - Version field: 0111 (7)
 * - Variant field: 10
 * - Remaining 62 bits: Random data
 */

/**
 * Generates a cryptographically secure random number
 */
function getRandomValues(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser or Node.js with crypto support
    return crypto.getRandomValues(new Uint8Array(length));
  } else {
    // Fallback for older Node.js versions
    const crypto = require('crypto');
    return new Uint8Array(crypto.randomBytes(length));
  }
}

/**
 * Converts a number to hexadecimal string with padding
 */
function toHex(num: number, length: number): string {
  return num.toString(16).padStart(length, '0');
}

/**
 * Generates a UUID v7
 * @param timestamp Optional timestamp in milliseconds. If not provided, uses current time.
 * @returns UUID v7 string in the format XXXXXXXX-XXXX-7XXX-XXXX-XXXXXXXXXXXX
 */
export function generateUUIDv7(timestamp?: number): string {
  // Use provided timestamp or current time
  const ts = timestamp ?? Date.now();
  
  // Generate random bytes for the random portions
  const randomBytes = getRandomValues(10);
  
  // Extract timestamp components (48 bits = 6 bytes)
  const timestampHex = toHex(ts, 12);
  
  // Extract random components
  const rand12bits = (randomBytes[0] << 4) | (randomBytes[1] >> 4);
  const rand62bits = Array.from(randomBytes.slice(1))
    .map(byte => toHex(byte, 2))
    .join('');
  
  // Build UUID v7 components
  const timeLow = timestampHex.slice(0, 8);
  const timeMid = timestampHex.slice(8, 12);
  const timeHiAndVersion = '7' + toHex(rand12bits & 0xfff, 3);
  const clockSeqAndReserved = toHex(0x80 | (randomBytes[2] & 0x3f), 2) + toHex(randomBytes[3], 2);
  const node = rand62bits.slice(2, 14);
  
  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqAndReserved}-${node}`;
}

/**
 * Generates multiple UUID v7s
 * @param count Number of UUIDs to generate
 * @param baseTimestamp Optional base timestamp. Each subsequent UUID will have timestamp + index
 * @returns Array of UUID v7 strings
 */
export function generateMultipleUUIDv7(count: number, baseTimestamp?: number): string[] {
  const base = baseTimestamp ?? Date.now();
  const uuids: string[] = [];
  
  for (let i = 0; i < count; i++) {
    uuids.push(generateUUIDv7(base + i));
  }
  
  return uuids;
}

/**
 * Extracts timestamp from UUID v7
 * @param uuid UUID v7 string
 * @returns Timestamp in milliseconds
 */
export function extractTimestamp(uuid: string): number {
  // Remove hyphens and extract first 12 hex characters (48 bits)
  const cleanUuid = uuid.replace(/-/g, '');
  const timestampHex = cleanUuid.slice(0, 12);
  return parseInt(timestampHex, 16);
}

/**
 * Validates if a string is a valid UUID v7
 * @param uuid String to validate
 * @returns True if valid UUID v7, false otherwise
 */
export function isValidUUIDv7(uuid: string): boolean {
  // Check basic UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return false;
  }
  
  // Extract timestamp and validate it's reasonable
  try {
    const timestamp = extractTimestamp(uuid);
    const now = Date.now();
    const minValidTimestamp = new Date('2020-01-01').getTime();
    const maxValidTimestamp = now + (365 * 24 * 60 * 60 * 1000); // 1 year in future
    
    return timestamp >= minValidTimestamp && timestamp <= maxValidTimestamp;
  } catch {
    return false;
  }
}

/**
 * Converts UUID v7 to Date object
 * @param uuid UUID v7 string
 * @returns Date object representing the timestamp
 */
export function uuidToDate(uuid: string): Date {
  if (!isValidUUIDv7(uuid)) {
    throw new Error('Invalid UUID v7 format');
  }
  
  const timestamp = extractTimestamp(uuid);
  return new Date(timestamp);
}

/**
 * Compares two UUID v7s chronologically
 * @param uuid1 First UUID v7
 * @param uuid2 Second UUID v7
 * @returns -1 if uuid1 is earlier, 1 if uuid2 is earlier, 0 if same timestamp
 */
export function compareUUIDv7(uuid1: string, uuid2: string): number {
  const timestamp1 = extractTimestamp(uuid1);
  const timestamp2 = extractTimestamp(uuid2);
  
  if (timestamp1 < timestamp2) return -1;
  if (timestamp1 > timestamp2) return 1;
  return 0;
}

/**
 * Sorts an array of UUID v7s chronologically
 * @param uuids Array of UUID v7 strings
 * @returns Sorted array (earliest first)
 */
export function sortUUIDv7(uuids: string[]): string[] {
  return [...uuids].sort(compareUUIDv7);
}

// Default export for convenience
export default {
  generate: generateUUIDv7,
  generateMultiple: generateMultipleUUIDv7,
  extractTimestamp,
  isValid: isValidUUIDv7,
  toDate: uuidToDate,
  compare: compareUUIDv7,
  sort: sortUUIDv7
};