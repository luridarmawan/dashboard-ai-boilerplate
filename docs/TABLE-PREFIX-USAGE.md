# Table Prefix Implementation

This document explains how to use the table prefix functionality in the admin dashboard application.

## Overview

The table prefix functionality allows you to add a custom prefix to all database table names. This is particularly useful during initial application installation when you need to avoid table name conflicts or organize tables with a specific naming convention.

## Configuration

### Environment Variable

The table prefix is configured using the `TABLE_PREFIX` environment variable in the `.env` file:

```env
TABLE_PREFIX="app_"
```

### Examples

- `TABLE_PREFIX="app_"` → Tables: `app_users`, `app_clients`, `app_configurations`, etc.
- `TABLE_PREFIX="prod_"` → Tables: `prod_users`, `prod_clients`, `prod_configurations`, etc.
- `TABLE_PREFIX=""` → Tables: `users`, `clients`, `configurations`, etc. (no prefix)

## How It Works

1. **Schema Generation Script**: The [`scripts/generate-schema.js`](../scripts/generate-schema.js) script reads the `TABLE_PREFIX` from the `.env` file and generates the Prisma schema with the appropriate `@@map()` directives.

2. **Migration Generation Script**: The [`scripts/generate-migration.js`](../scripts/generate-migration.js) script reads the `TABLE_PREFIX` from the `.env` file and updates the existing migration file with prefixed table names.

3. **Dynamic Table Names**: All models in the Prisma schema use the `@@map()` directive to map to prefixed table names:
   ```prisma
   model users {
     // ... fields
     @@map("app_users")
   }
   ```

4. **Dynamic Migration SQL**: The migration file creates tables with prefixed names:
   ```sql
   CREATE TABLE "public"."app_users" (
     -- ... columns
   );
   ```

5. **Automatic Integration**: The npm scripts automatically run both schema and migration generation before Prisma operations.

## Usage

### Available Scripts

- `npm run schema:generate` - Generate Prisma schema with current TABLE_PREFIX
- `npm run migration:generate` - Generate migration file with current TABLE_PREFIX
- `npm run prefix:generate` - Generate both schema and migration files
- `npm run prisma:generate` - Generate schema, migration, and Prisma client
- `npm run db:init` - Initialize database with prefixed tables
- `npm run db:reset` - Reset database with prefixed tables
- `npm run db:migration` - Create migration with prefixed tables

### Workflow

1. **Set Table Prefix**: Update `TABLE_PREFIX` in your `.env` file
   ```env
   TABLE_PREFIX="myapp_"
   ```

2. **Generate Schema and Migration**: Run the prefix generation
   ```bash
   npm run prefix:generate
   ```

3. **Generate Prisma Client**: Generate the Prisma client
   ```bash
   npm run prisma:generate
   ```

4. **Run Migrations**: Apply database migrations
   ```bash
   npm run db:migration
   ```

### Example: Changing Table Prefix

If you want to change from `app_` to `prod_`:

1. Update `.env`:
   ```env
   TABLE_PREFIX="prod_"
   ```

2. Regenerate schema, migration, and client:
   ```bash
   npm run prisma:generate
   ```

3. Create and apply migration:
   ```bash
   npm run db:migration
   ```

## Affected Tables

The following tables will be prefixed:

- `users` → `{PREFIX}users`
- `clients` → `{PREFIX}clients`
- `outbox_email` → `{PREFIX}outbox_email`
- `client_user_maps` → `{PREFIX}client_user_maps`
- `groups` → `{PREFIX}groups`
- `group_permissions` → `{PREFIX}group_permissions`
- `group_user_maps` → `{PREFIX}group_user_maps`
- `configurations` → `{PREFIX}configurations`

## Important Notes

1. **No New Migration Files**: As per requirements, no new migration files are created. The existing migration file is dynamically updated with the correct table prefix.

2. **Automatic Regeneration**: Both the Prisma schema and migration file are automatically regenerated when running database commands through the npm scripts.

3. **Environment Consistency**: Ensure all team members use the same `TABLE_PREFIX` value in their `.env` files.

4. **Database Compatibility**: The table prefix works with PostgreSQL as configured in the current setup.

5. **Migration File Updates**: The existing migration file `prisma/migrations/20250730142817_init/migration.sql` is dynamically updated with the correct table prefix, ensuring that when migrations are applied, tables are created with the proper prefix.

## Troubleshooting

### Schema or Migration Generation Issues

If you encounter issues with schema or migration generation:

1. Check that the `.env` file exists and contains `TABLE_PREFIX`
2. Verify that Node.js can read the environment variables
3. Run `npm run prefix:generate` manually to see detailed output
4. Ensure the migration directory exists: `prisma/migrations/20250730142817_init/`

### Migration Issues

If migrations fail after changing the prefix:

1. Ensure the database is accessible
2. Check that the new table names don't conflict with existing tables
3. Consider backing up your database before applying migrations

## Technical Implementation

The implementation consists of:

1. **Schema Generation Script** (`scripts/generate-schema.js`): Reads `TABLE_PREFIX` and generates the complete Prisma schema with `@@map()` directives
2. **Migration Generation Script** (`scripts/generate-migration.js`): Reads `TABLE_PREFIX` and updates the existing migration file with prefixed table names and constraints
3. **Updated Package Scripts**: Modified npm scripts to automatically run both schema and migration generation
4. **Fixed Database Initialization**: Corrected the user creation in `server/database/init.ts`

This approach ensures that both the Prisma schema and migration files are dynamically updated based on the environment configuration, guaranteeing that when tables are created, they will have the correct prefix as defined in the `TABLE_PREFIX` environment variable.