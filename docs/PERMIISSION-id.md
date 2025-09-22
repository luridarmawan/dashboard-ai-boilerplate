# PERMISSION

## Konsep dan Konvensi

1. **Resource Name**
   - Gunakan format `module.feature` (misalnya: `sales.pipeline`, `sales.invoice`, `user.profile`).
   - Konvensi ini membantu menjaga konsistensi dan mempermudah pencarian.

2. **Wildcard yang Didukung** (sesuai fungsi `matchesResource`):
   - `*.*` → cocok dengan semua resource.
   - `module.*` → cocok dengan semua fitur dalam modul tertentu.
     - Contoh: `sales.*` mencakup `sales.pipeline`, `sales.invoice`, dll.
   - `module.feature` → spesifik pada fitur dalam modul tertentu.
     - Contoh: `sales.pipeline` hanya berlaku untuk pipeline di modul sales.

3. **Action**
   - **read** → hanya untuk membaca/mengakses data.
   - **write** → untuk membuat, mengubah, atau menghapus data.
   - **manage** → super-action, memiliki hak penuh terhadap resource terkait (termasuk read & write).

---

## Contoh Permission

| Nama Akses       | Resource | Action  | Keterangan |
|------------------|----------|---------|------------|
| Full All Access  | \*.\*      | manage  | Boleh memanage semua resource |
| Read All Access  | \*.\*      | read    | Boleh membaca semua resource |
| Write All Access | \*.\*      | write   | Boleh menulis semua resource |
| Payroll Reader   | payroll.*| read    | Boleh membaca semua resource payroll |
| Payroll Admin    | payroll.*| manage  | Boleh mengelola penuh resource payroll (read, write, delete) |
| User Profile RW  | user.profile | write | Boleh membuat/mengubah profil user |
| User Profile R   | user.profile | read  | Boleh membaca profil user |
| Sales Pipeline R | sales.pipeline | read | Boleh membaca data pipeline pada modul sales |

---

## Best Practices

- Gunakan `manage` hanya untuk role dengan tanggung jawab penuh (misalnya admin).
- Gunakan kombinasi `read` dan `write` untuk membatasi hak akses sesuai kebutuhan.
- Terapkan wildcard untuk efisiensi pengaturan permission pada level modul.
- Pastikan penamaan resource konsisten agar tidak membingungkan saat scaling.
