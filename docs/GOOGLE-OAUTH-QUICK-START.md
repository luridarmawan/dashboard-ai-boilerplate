# Quick Start: Google OAuth Login

Panduan cepat untuk menjalankan aplikasi dengan fitur login Google.

## Prerequisites

1. Node.js dan npm terinstall
2. PostgreSQL database berjalan
3. Google Cloud Project dengan OAuth 2.0 Client ID

## Setup Cepat

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Generate schema dan migration
npm run prefix:generate

# Generate Prisma client
npx prisma generate --schema prisma/schema.generated

# Jalankan migration
npx prisma migrate dev --schema prisma/schema.generated

# Seed database (opsional)
npm run db:seed
```

### 3. Konfigurasi Environment

Copy file `.env.example` ke `.env` dan isi konfigurasi:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dashboard_nyerah"

# JWT
JWT_SECRET="your_jwt_secret_here"

# Google OAuth (WAJIB untuk fitur Google login)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### 4. Dapatkan Google Client ID

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Buka **APIs & Services** > **Credentials**
4. Buat **OAuth 2.0 Client ID** dengan konfigurasi:
   - Type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
5. Copy Client ID dan masukkan ke `.env`

### 5. Jalankan Aplikasi

```bash
# Terminal 1: Jalankan server
npm run api:dev

# Terminal 2: Jalankan frontend
npm run dev
```

### 6. Test Google Login

1. Buka browser: `http://localhost:5173/signin`
2. Klik tombol "Sign in with Google"
3. Login dengan akun Google
4. Verifikasi berhasil masuk ke dashboard

## Fitur Google OAuth

### Yang Sudah Diimplementasi

✅ **Frontend Integration**
- GoogleOAuthProvider wrapper
- useGoogleLogin hook
- Tombol Google login di SignInForm
- Error handling

✅ **Backend Integration**
- Endpoint `/api/auth/google-login`
- User creation/update otomatis
- JWT token generation
- Database schema dengan kolom `google_id` dan `avatar`

✅ **Database Schema**
- Kolom `google_id` untuk menyimpan Google user ID
- Kolom `avatar` untuk foto profil
- Unique constraint pada `google_id`

### Flow Login Google

1. **User klik tombol Google** → Popup Google OAuth terbuka
2. **User login di Google** → Google memberikan access token
3. **Frontend ambil user info** → Dari Google API menggunakan access token
4. **Frontend kirim ke backend** → Credential berisi user info
5. **Backend proses user** → Buat user baru atau update existing
6. **Backend return JWT** → Token untuk session management
7. **User masuk dashboard** → Redirect ke halaman utama

### User Management

- **User Baru**: Otomatis dibuat dengan data dari Google
- **User Existing**: Update Google ID dan avatar jika belum ada
- **Status User**: Otomatis aktif (status_id = 0)
- **Password**: Tidak diperlukan untuk user Google

## Troubleshooting

### Error: "Google Client ID not found"
```bash
# Pastikan environment variable sudah diset
echo $VITE_GOOGLE_CLIENT_ID
```

### Error: "Invalid Client ID"
- Cek apakah Client ID benar di file `.env`
- Pastikan domain `localhost:5173` sudah ditambahkan di Google Console

### Error: "Database connection failed"
```bash
# Cek status PostgreSQL
# Pastikan DATABASE_URL benar di .env
npm run db:status
```

### Error: "Migration failed"
```bash
# Reset dan jalankan ulang migration
npm run db:reset
npm run db:init
```

## Development Tips

### Testing dengan Multiple Accounts
- Gunakan incognito mode untuk test dengan akun berbeda
- Atau logout dari Google di browser

### Database Inspection
```bash
# Lihat data user di database
npm run prisma:studio
```

### Log Debugging
- Server log akan menampilkan error Google OAuth
- Browser console akan menampilkan error frontend

### Production Deployment
- Update Authorized JavaScript origins dengan domain production
- Set environment variables di production server
- Gunakan HTTPS untuk production

## Next Steps

Setelah Google OAuth berjalan, Anda bisa:

1. **Customize User Profile**: Tambah field tambahan dari Google
2. **Role Management**: Assign role default untuk user Google
3. **Social Login Lain**: Implementasi Facebook, GitHub, dll
4. **Account Linking**: Link Google account dengan existing account
5. **Admin Panel**: Manage user yang login via Google

## Support

Jika mengalami masalah:

1. Cek dokumentasi lengkap di `docs/GOOGLE-OAUTH-SETUP.md`
2. Lihat log error di terminal server dan browser console
3. Pastikan semua environment variables sudah benar
4. Test dengan akun Google yang berbeda