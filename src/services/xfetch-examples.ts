/**
 * Contoh penggunaan XFetch Service
 * File ini berisi berbagai contoh implementasi xfetch
 */

import { xfetch, setXFetchContext } from './xfetch';

// Setup context (biasanya dilakukan di component utama atau context provider)
export const setupXFetchContext = (token: string, selectedClient: { id: string }) => {
  setXFetchContext({
    token,
    selectedClient,
  });
};

// Contoh 1: GET Request sederhana
export const getUsers = async () => {
  try {
    const response = await xfetch('/api/users', {
      skipCSRF: true, // GET request tidak memerlukan CSRF
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Contoh 2: POST Request dengan body JSON
export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}) => {
  try {
    const response = await xfetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Contoh 3: PUT Request untuk update
export const updateUser = async (userId: string, userData: Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  statusId: number;
}>) => {
  try {
    const response = await xfetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Contoh 4: DELETE Request
export const deleteUser = async (userId: string) => {
  try {
    const response = await xfetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Contoh 5: File Upload (skip Content-Type untuk multipart/form-data)
export const uploadFile = async (file: File, additionalData?: Record<string, string>) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Tambahkan data tambahan jika ada
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await xfetch('/api/upload', {
      method: 'POST',
      body: formData,
      skipContentType: true, // Biarkan browser set multipart/form-data
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Contoh 6: Request ke endpoint publik (skip auth)
export const getPublicData = async () => {
  try {
    const response = await xfetch('/api/public/stats', {
      skipAuth: true,
      skipCSRF: true,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch public data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching public data:', error);
    throw error;
  }
};

// Contoh 7: Request dengan custom headers
export const getDataWithCustomHeaders = async () => {
  try {
    const response = await xfetch('/api/special-endpoint', {
      headers: {
        'X-Custom-Header': 'custom-value',
        'X-API-Version': '2.0',
      },
      skipCSRF: true,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Contoh 8: Streaming response
export const getStreamingData = async (onData: (chunk: string) => void) => {
  try {
    const response = await xfetch('/api/stream', {
      skipCSRF: true,
    });
    
    if (!response.ok) {
      throw new Error('Failed to start stream');
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }
    
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      onData(chunk);
    }
  } catch (error) {
    console.error('Error streaming data:', error);
    throw error;
  }
};

// Contoh 9: Batch operations dengan Promise.all
export const batchUpdateUsers = async (updates: Array<{ id: string; data: any }>) => {
  try {
    const promises = updates.map(({ id, data }) =>
      xfetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    );
    
    const responses = await Promise.all(promises);
    
    // Check if all requests were successful
    const results = await Promise.all(
      responses.map(async (response, index) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update user ${updates[index].id}: ${errorData.message}`);
        }
        return response.json();
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

// Contoh 10: Error handling yang comprehensive
export const robustApiCall = async (endpoint: string, options: any = {}) => {
  try {
    const response = await xfetch(endpoint, options);
    
    // Handle different HTTP status codes
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
      return;
    }
    
    if (response.status === 403) {
      // Forbidden - show permission error
      throw new Error('You do not have permission to perform this action');
    }
    
    if (response.status === 404) {
      // Not found
      throw new Error('Resource not found');
    }
    
    if (response.status >= 500) {
      // Server error
      throw new Error('Server error. Please try again later.');
    }
    
    if (!response.ok) {
      // Other client errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};