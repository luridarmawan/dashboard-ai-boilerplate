import { getCSRF } from '../utils';

// Interface untuk opsi xfetch yang extends dari RequestInit
interface XFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipCSRF?: boolean;
  skipContentType?: boolean;
}

// Interface untuk context yang diperlukan xfetch
interface XFetchContext {
  token?: string | null;
  selectedClient?: { id: string } | null;
}

// Global context untuk xfetch
let xfetchContext: XFetchContext = {};

// Fungsi untuk mengatur context xfetch
export const setXFetchContext = (context: XFetchContext) => {
  xfetchContext = { ...xfetchContext, ...context };
};

// Fungsi xfetch yang merupakan wrapper dari fetch dengan header otomatis
export const xfetch = async (
  url: string | URL,
  options: XFetchOptions = {}
): Promise<Response> => {
  const {
    headers: customHeaders = {},
    skipAuth = false,
    skipCSRF = false,
    skipContentType = false,
    ...restOptions
  } = options;

  // Siapkan headers default
  const defaultHeaders: Record<string, string> = {};

  // Tambahkan Authorization header jika tidak di-skip dan token tersedia
  if (!skipAuth && xfetchContext.token) {
    defaultHeaders['Authorization'] = `Bearer ${xfetchContext.token}`;
  }

  // Tambahkan Content-Type header jika tidak di-skip
  if (!skipContentType) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Tambahkan X-Client-ID header jika selectedClient tersedia
  if (xfetchContext.selectedClient?.id) {
    defaultHeaders['X-Client-ID'] = xfetchContext.selectedClient.id;
  }

  // Dapatkan CSRF token dan session ID jika tidak di-skip
  if (!skipCSRF) {
    try {
      const csrfData = await getCSRF(defaultHeaders);
      defaultHeaders['X-CSRF-Token'] = csrfData.csrfToken;
      defaultHeaders['X-Session-ID'] = csrfData.sessionId;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      // Jika CSRF gagal, tetap lanjutkan tanpa CSRF token
    }
  }

  // Gabungkan headers default dengan custom headers
  const finalHeaders = {
    ...defaultHeaders,
    ...customHeaders,
  };

  // Panggil fetch dengan headers yang sudah digabungkan
  return fetch(url, {
    ...restOptions,
    headers: finalHeaders,
  });
};

// Export default untuk kemudahan import
export default xfetch;
/*
CONTOH PENGGUNAAN XFETCH:

1. Penggunaan dasar (sama seperti fetch biasa):
   const response = await xfetch('/api/users');

2. Dengan method POST dan body:
   const response = await xfetch('/api/users', {
     method: 'POST',
     body: JSON.stringify({ name: 'John', email: 'john@example.com' })
   });

3. Dengan custom headers tambahan:
   const response = await xfetch('/api/users', {
     method: 'POST',
     headers: {
       'X-Custom-Header': 'custom-value'
     },
     body: JSON.stringify(data)
   });

4. Skip beberapa header otomatis:
   const response = await xfetch('/api/public', {
     skipAuth: true,      // Skip Authorization header
     skipCSRF: true,      // Skip CSRF token (untuk GET request)
     skipContentType: true // Skip Content-Type header
   });

5. Untuk file upload (skip Content-Type agar browser set multipart/form-data):
   const formData = new FormData();
   formData.append('file', file);
   const response = await xfetch('/api/upload', {
     method: 'POST',
     body: formData,
     skipContentType: true
   });

HEADER YANG DITAMBAHKAN OTOMATIS:
- Authorization: Bearer ${token}
- Content-Type: application/json
- X-CSRF-Token: ${csrfToken}
- X-Session-ID: ${sessionId}
- X-Client-ID: ${selectedClient.id}

CATATAN:
- Pastikan untuk memanggil setXFetchContext() dengan token dan selectedClient
- CSRF token akan diambil secara otomatis dari getCSRF() utility
- Semua header dapat di-override dengan menyediakan header custom
*/