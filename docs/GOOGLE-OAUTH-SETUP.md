# Setup Google OAuth Login

Dokumen ini menjelaskan cara mengatur fitur login dengan Google menggunakan Google OAuth 2.0.

## Langkah-langkah Setup

### 1. Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan Google+ API atau Google Identity API

### 2. Konfigurasi OAuth Consent Screen

1. Di Google Cloud Console, buka **APIs & Services** > **OAuth consent screen**
2. Pilih **External** untuk user type (atau Internal jika untuk organisasi)
3. Isi informasi aplikasi:
   - App name: `AI-Powered Admin Dashboard`
   - User support email: email Anda
   - Developer contact information: email Anda
4. Tambahkan scope yang diperlukan:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Simpan konfigurasi

### 3. Buat OAuth 2.0 Client ID

1. Buka **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **OAuth 2.0 Client ID**
3. Pilih **Web application**
4. Isi konfigurasi:
   - Name: `Admin Dashboard Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (untuk development)
     - `https://yourdomain.com` (untuk production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (untuk development)
     - `https://yourdomain.com` (untuk production)
5. Simpan dan copy **Client ID**

### 4. Konfigurasi Environment Variables

Tambahkan Google Client ID ke file `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### 5. Update Database Schema

Schema database sudah diupdate untuk mendukung Google OAuth dengan kolom:
- `google_id`: Menyimpan Google user ID
- `avatar`: Menyimpan URL foto profil dari Google

## Cara Kerja

### Frontend (React)

1. **GoogleOAuthProvider**: Membungkus aplikasi dengan provider OAuth
2. **useGoogleLogin**: Hook untuk menangani proses login Google
3. **SignInForm**: Komponen form login yang sudah terintegrasi dengan tombol Google

### Backend (Express)

1. **Endpoint `/api/auth/google-login`**: Menerima credential dari Google
2. **User Creation/Update**: Membuat user baru atau update user existing
3. **JWT Token**: Generate token untuk autentikasi session

### Flow Login Google

1. User klik tombol "Sign in with Google"
2. Google OAuth popup terbuka
3. User login dan memberikan permission
4. Google mengembalikan access token
5. Frontend mengambil user info dari Google API
6. Frontend mengirim credential ke backend
7. Backend memproses dan membuat/update user
8. Backend mengembalikan JWT token
9. User berhasil login dan diarahkan ke dashboard

## Testing

Untuk testing fitur Google OAuth:

1. Pastikan environment variable `VITE_GOOGLE_CLIENT_ID` sudah diset
2. Jalankan aplikasi: `npm run dev`
3. Buka halaman login: `http://localhost:5173/signin`
4. Klik tombol "Sign in with Google"
5. Login dengan akun Google Anda
6. Verifikasi bahwa Anda berhasil login dan diarahkan ke dashboard

## Troubleshooting

### Error: "Invalid Client ID"
- Pastikan `VITE_GOOGLE_CLIENT_ID` sudah benar
- Pastikan domain sudah ditambahkan ke Authorized JavaScript origins

### Error: "Redirect URI Mismatch"
- Pastikan URL aplikasi sudah ditambahkan ke Authorized redirect URIs
- Pastikan tidak ada trailing slash di URL

### Error: "Access Blocked"
- Pastikan OAuth consent screen sudah dikonfigurasi
- Untuk testing, tambahkan email Anda ke test users

### User Tidak Terbuat di Database
- Cek log server untuk error
- Pastikan database connection berjalan
- Pastikan migration sudah dijalankan

## Security Notes

1. **Client ID**: Aman untuk diexpose di frontend
2. **Client Secret**: Jangan pernah diexpose di frontend, hanya untuk server-side
3. **HTTPS**: Gunakan HTTPS di production
4. **Domain Validation**: Google akan memvalidasi domain yang terdaftar
5. **Token Validation**: Backend harus memvalidasi token dari Google

## Production Deployment

Untuk deployment production:

1. Update Authorized JavaScript origins dengan domain production
2. Update Authorized redirect URIs dengan domain production
3. Set environment variable `VITE_GOOGLE_CLIENT_ID` di production
4. Pastikan menggunakan HTTPS
5. Test login Google di production environment