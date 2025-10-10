# Module Generator

The **Module Generator** is a feature designed to accelerate the creation of new modules within the application.  
It automatically generates the required file and folder structure, provides default configurations, and integrates the module into the main application.

---

## Key Features
- Automatically creates module **files** and **folders**.
- Generates a default **menu** and sets **permission** to `Regular User`.
- Provides template **field configuration** (JSON & Prisma schema).
- Automatically integrates the module into the main app (`App.tsx`).
- Includes boilerplate for **API**, **Frontend**, and **Database (Prisma)**.

---

## Usage

Run the following command at the project root:

```bash
bun run module:generator
```

### CLI Interaction Example

```bash
$ bun run module:generator

=== 🔧 Module Generator ===

🔍 Module Name: Customer
🔍 Table name: customers
❓ Install in main app? (y/n): y

🔧 Creating module: Customer
📋 Table name: customers
 ✓ Created directory: modules/Customer
 ✓ Created directory: modules/Customer/api
 ...
 ✓ Created file: modules/Customer/version.json
 ✓ Created file: modules/Customer/prisma.config.ts
 ✓ Created file: modules/Customer/api/index.ts
 ...
 ✓ Created file: modules/Customer/prisma/customers.json
 ✓ Created file: modules/Customer/prisma/configuration.json
 ✓ Created file: modules/Customer/prisma/migrations/.migrations

📦 Installing module in main app...
✓ Added import for CustomerMain to App.tsx
✓ Added route for /customer to App.tsx

🎉 Module "Customer" created successfully!

✅ Next steps:
 1. Review the generated files in `modules/Customer/`
 2. Adjust database configuration if needed
 3. Run database migration:
     `bun run module:migrate Customer`
 4. Access the module in your browser at: `/customer`
```

---

## Folder & File Structure

The following structure will be generated:

```
modules/Customer/
├── README.md
├── api
│   ├── index.ts          # Module API entry point
│   ├── menu.ts           # Module menu configuration
│   ├── routes
│   │   └── customer.ts   # Module routing definition
│   └── seed.ts           # Initial seed data
├── frontend
│   ├── CustomerMain.tsx  # Main React/Next.js component
│   └── types
│       └── customer.ts   # Types/DTO definition
├── prisma
│   ├── configuration.json # Field configuration
│   ├── customers.json     # Table definition
│   ├── db.sql             # Base SQL schema
│   ├── migrations         # Prisma migrations folder
│   └── schema
│       └── schema.prisma  # Prisma schema file
├── prisma.config.ts       # Module Prisma configuration
└── version.json           # Module version info
```

---

## Migration

```bash
# Run migration for Customer module
bun run module:migrate Customer

# Run migration for Invoice module
bun run module:migrate Invoice
```


## Screenshots

### Customer Landing Page
![customer-page](images/customer-page.png)

### Customer Configuration
![customer-configuration](images/customer-configuration.png)

---

## Best Practices & Guidelines

To ensure consistency across all modules, follow these best practices:

### Naming Conventions
- **Module Name**: Use PascalCase (e.g., `Customer`, `InvoiceReport`).
- **Table Name**: Use plural snake_case (e.g., `customers`, `invoice_reports`).
- **React Components**: Use PascalCase (e.g., `CustomerMain.tsx`).
- **TypeScript Types/DTOs**: Use singular PascalCase with suffix if needed (e.g., `Customer`, `CustomerDTO`).
- **API Routes**: Use lowercase and hyphens (e.g., `/api/customers`, `/api/invoice-reports`).

### File Organization
- Keep API-related logic inside `api/`.
- Define TypeScript types in `frontend/types/` for strong typing.
- Place schema definitions and configurations under `prisma/`.
- Keep `README.md` in each module to describe its purpose.

### Versioning
- Always update `version.json` when a module changes.
- Use semantic versioning (e.g., `1.0.0`, `1.1.0`, `2.0.0`).

### Database & Prisma
- Run migrations after editing schema:
  ```bash
  bunx prisma migrate dev
  ```
- Use `configuration.json` for custom field-level settings.
- Keep migrations version-controlled.

---

## Notes
- Always review generated modules before deploying to production.
- Adjust fields and schema as per requirements.
- Ensure consistent naming and folder structure across modules.
