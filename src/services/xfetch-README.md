# XFetch Service

XFetch adalah wrapper dari native `fetch` API yang secara otomatis menambahkan header-header yang diperlukan untuk autentikasi dan keamanan.

## Fitur

- 100% kompatibel dengan native `fetch` API
- Otomatis menambahkan header Authorization dengan Bearer token
- Otomatis menambahkan CSRF token dan Session ID
- Otomatis menambahkan Client ID
- Otomatis menambahkan Content-Type: application/json
- Opsi untuk skip header tertentu sesuai kebutuhan

## Instalasi

```typescript
import { xfetch, setXFetchContext } from '../services';
```

## Setup Context

Sebelum menggunakan xfetch, pastikan untuk mengatur context:

```typescript
import { setXFetchContext } from '../services';

// Set context dengan token dan client yang aktif
setXFetchContext({
  token: userToken,
  selectedClient: { id: 'client-123' }
});
```

## Penggunaan

### GET Request
```typescript
const response = await xfetch('/api/users');
```

### POST Request
```typescript
const response = await xfetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  })
});
```

### PUT Request
```typescript
const response = await xfetch('/api/users/123', {
  method: 'PUT',
  body: JSON.stringify(updatedData)
});
```

### DELETE Request
```typescript
const response = await xfetch('/api/users/123', {
  method: 'DELETE'
});
```

### Custom Headers
```typescript
const response = await xfetch('/api/users', {
  method: 'POST',
  headers: {
    'X-Custom-Header': 'custom-value'
  },
  body: JSON.stringify(data)
});
```

### Skip Headers
```typescript
// Skip Authorization header untuk endpoint publik
const response = await xfetch('/api/public', {
  skipAuth: true
});

// Skip CSRF token untuk GET request
const response = await xfetch('/api/users', {
  skipCSRF: true
});

// Skip Content-Type untuk file upload
const formData = new FormData();
formData.append('file', file);
const response = await xfetch('/api/upload', {
  method: 'POST',
  body: formData,
  skipContentType: true
});
```

## Header yang Ditambahkan Otomatis

| Header | Nilai | Kondisi |
|--------|-------|---------|
| Authorization | `Bearer ${token}` | Jika token tersedia dan tidak di-skip |
| Content-Type | `application/json` | Jika tidak di-skip |
| X-CSRF-Token | `${csrfToken}` | Jika tidak di-skip dan berhasil mendapat CSRF |
| X-Session-ID | `${sessionId}` | Jika tidak di-skip dan berhasil mendapat session |
| X-Client-ID | `${selectedClient.id}` | Jika selectedClient tersedia |

## Opsi Skip

| Opsi | Deskripsi |
|------|-----------|
| `skipAuth` | Skip header Authorization |
| `skipCSRF` | Skip CSRF token dan Session ID |
| `skipContentType` | Skip header Content-Type |

## Error Handling

XFetch akan tetap berjalan meskipun gagal mendapatkan CSRF token. Error akan di-log ke console tetapi tidak akan menghentikan request.

```typescript
try {
  const response = await xfetch('/api/users');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  // Handle success
} catch (error) {
  console.error('Request error:', error);
  // Handle error
}
```