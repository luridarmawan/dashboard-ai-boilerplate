/**
 * Utility functions for the application
 */

/**
 * Fetches a CSRF token from the server
 * @returns {Promise<{csrfToken: string, sessionId: string}>} The CSRF token and session ID
 * @throws {Error} If the CSRF token could not be fetched
 */
export const getCSRF = async (headers: Record<string, string> = {}): Promise<{csrfToken: string, sessionId: string}> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';
  // console.log('00----', headers)
  
  try {
    const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf-token`,{headers: headers});
    const csrfData = await csrfResponse.json();

    if (csrfData.success && csrfData.data.csrfToken && csrfData.data.sessionId) {
      return {
        csrfToken: csrfData.data.csrfToken,
        sessionId: csrfData.data.sessionId
      };
    } else {
      throw new Error('Failed to get CSRF token');
    }
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw new Error('Failed to get CSRF token');
  }
};

export function isJSON(value: string): boolean {
  if (typeof value !== "string") return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function formatDate(dateAsString: string){
  const date = new Date(dateAsString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export * from './configuration';
export * from './datetime';
export * from './logs';
export * from './number';
