# Permission Middleware

Middleware untuk mengatur permission user terhadap suatu module/fitur berdasarkan group membership.

## Cara Kerja

Permission middleware bekerja dengan cara:

1. **Membaca table `group_user_maps`** untuk mencari info seorang user tergabung pada group apa saja
2. **Dari table `group_permissions`** akan diketahui akses dari group tersebut
3. **Field `resource`** refer ke nama module dan item di dalam modul tersebut

## Format Resource dan Action

### Resource Examples:
- `user` - Module user
- `payroll` - Module payroll  
- `reports` - Module reports
- `user.create` - Specific action dalam module user
- `payroll.salary` - Specific item dalam module payroll

### Action Types:
- `read` - Dapat membaca/melihat data
- `edit` - Dapat mengedit data yang sudah ada
- `create` - Dapat membuat data baru
- `manage` - Dapat melakukan semua operasi (read, edit, create, delete)

### Wildcard Patterns:
- `*.*` dengan action `read` - User bisa membaca semua module
- `user.*` dengan action `manage` - User bisa manage semua dalam module user
- `*.salary` dengan action `read` - User bisa membaca salary di semua module

## Penggunaan

### 1. Setup Middleware

```typescript
import { authenticateToken } from './middleware/auth';
import { permissionMiddleware, requirePermission, PermissionAction } from './middleware/permission';

// Gunakan setelah authentication middleware
app.use('/api', authenticateToken, permissionMiddleware);
```

### 2. Manual Permission Check

```typescript
router.get('/users', authenticateToken, permissionMiddleware, async (req, res) => {
  // Check permission secara manual
  const canRead = await req.permissions!.canRead('user');
  
  if (!canRead) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Logic untuk fetch users
});
```

### 3. Automatic Permission Check

```typescript
// Otomatis check permission sebelum masuk ke handler
router.post('/users', 
  authenticateToken, 
  permissionMiddleware, 
  requirePermission('user', PermissionAction.CREATE),
  async (req, res) => {
    // Jika sampai sini, user sudah pasti punya permission
    // Logic untuk create user
  }
);
```

### 4. Multiple Permission Check

```typescript
import { checkMultiplePermissions } from './middleware/permission';

router.get('/dashboard', authenticateToken, permissionMiddleware, async (req, res) => {
  const permissions = await checkMultiplePermissions(req, [
    { resource: 'user', action: PermissionAction.READ },
    { resource: 'payroll', action: PermissionAction.READ },
    { resource: 'reports', action: PermissionAction.READ }
  ]);
  
  // Build response berdasarkan permissions
  const data = {};
  if (permissions['user:read']) {
    data.users = await getUserData();
  }
  if (permissions['payroll:read']) {
    data.payroll = await getPayrollData();
  }
  
  res.json({ data, permissions });
});
```

## Available Methods

Setelah menggunakan `permissionMiddleware`, object `req.permissions` akan tersedia dengan methods:

### `canRead(resource: string): Promise<boolean>`
Check apakah user bisa membaca resource tertentu.

```typescript
const canReadUsers = await req.permissions!.canRead('user');
const canReadPayroll = await req.permissions!.canRead('payroll');
```

### `canEdit(resource: string): Promise<boolean>`
Check apakah user bisa mengedit resource tertentu.

```typescript
const canEditUsers = await req.permissions!.canEdit('user');
```

### `canCreate(resource: string): Promise<boolean>`
Check apakah user bisa membuat resource baru.

```typescript
const canCreateUsers = await req.permissions!.canCreate('user');
```

### `canManage(resource: string): Promise<boolean>`
Check apakah user bisa manage (semua operasi) resource tertentu.

```typescript
const canManageUsers = await req.permissions!.canManage('user');
```

## Database Setup

Pastikan database sudah memiliki data di table berikut:

### Table `groups`
```sql
INSERT INTO groups (id, client_id, name, description) VALUES 
('group-admin-id', 'client-id', 'Admin', 'Administrator group'),
('group-operator-id', 'client-id', 'Operator', 'Operator group'),
('group-user-id', 'client-id', 'User', 'Regular user group');
```

### Table `group_permissions`
```sql
-- Admin bisa manage semua
INSERT INTO group_permissions (id, client_id, group_id, name, resource, action) VALUES 
('perm-1', 'client-id', 'group-admin-id', 'All Access', '*.*', 'manage');

-- Operator bisa read semua, create/edit user
INSERT INTO group_permissions (id, client_id, group_id, name, resource, action) VALUES 
('perm-2', 'client-id', 'group-operator-id', 'Read All', '*.*', 'read'),
('perm-3', 'client-id', 'group-operator-id', 'Manage Users', 'user', 'manage');

-- User biasa hanya bisa read user dan payroll
INSERT INTO group_permissions (id, client_id, group_id, name, resource, action) VALUES 
('perm-4', 'client-id', 'group-user-id', 'Read Users', 'user', 'read'),
('perm-5', 'client-id', 'group-user-id', 'Read Payroll', 'payroll', 'read');
```

### Table `group_user_maps`
```sql
-- Assign users ke groups
INSERT INTO group_user_maps (id, client_id, group_id, user_id) VALUES 
('map-1', 'client-id', 'group-admin-id', 'admin-user-id'),
('map-2', 'client-id', 'group-operator-id', 'operator-user-id'),
('map-3', 'client-id', 'group-user-id', 'regular-user-id');
```

### Setup Permission Hieararchy

- Admin: `*.*:manage` (full access)
- Operator: `*.*:read`, `user:manage`, `payroll:edit`
- User: `user:read`, `payroll:read`, `reports:read`

## Error Handling

Middleware akan return error dalam situasi berikut:

- **401 Unauthorized**: Jika user belum login (tidak ada `req.user`)
- **403 Forbidden**: Jika user tidak punya permission yang dibutuhkan
- **500 Internal Server Error**: Jika terjadi error saat check permission

## Examples

Lihat file `permission-example.ts` untuk contoh penggunaan lengkap.