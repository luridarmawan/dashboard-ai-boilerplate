# Example Module

Ini adalah module contoh penerapan multi modul di platform ini.

tree modules/Example:
```
Example
├───frontend
│   └───types
├───prisma
│   ├───migrations
│   └───schema
└───api
    └───routes
```


| Function        | File Location                                 |
|-----------------|-----------------------------------------------|
| **Schema**      | `modules/Example/prisma/schema/schema.prisma` |
| **Migration**   | `modules/Example/prisma/migrations/`          |
| **Data**        | `modules/Example/prisma/example.json`         |
| **Configuration** | `modules/Example/prisma/configuration.json` |
| **Seed**        | `modules/Example/api/seed.ts`                 |
| **Menu**        | `modules/Example/api/menu.ts`                 |
| **Route**       | `modules/Example/api/route/`                  |


## Frontend

### React Component

## Server API

Endpoint: `/example/test`
Method: `GET`
Description: Test API
Response:
```json
{
  "success": true,
  "message": "Test successful",
  "data": {}
}
```


Endpoint: `/example/`
Method: `GET/POST/PUT/DELETE`
Description: CRUD table example
Response:
```json
{
  "success": true,
  "message": "Example retrieved successfully",
  "data": {
    "examples": [
      {
        "id": "01991ec0-ee4a-7030-8403-44033d0a2e81",
        "client_id": "01991ec0-e27f-799f-b215-7215a9fb0255",
        "name": "Example Name",
        "description": "Example Description",
        "external": false,
        "metadata": null,
        "status_id": 0
      },

      // and more ...

    ],
    "requestedBy": {
      "id": "01991ec0-e49f-747d-8d0f-0d0f067b5d74",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "System",
      "clientId": "01991ec0-e27f-799f-b215-7215a9fb0255"
    },
    "permissions": {
      "canManage": true,
      "canCreate": true,
      "canEdit": true,
      "canRead": true
    }
  }
}
```

### Development

*CEK DULU*

jika diperlukan bisa menjalankan perintah berikut:

```bash
npx prisma migrate deploy
npx prisma db execute --file modules/example/sql/module_1.sql
npx prisma db execute --file modules/example/sql/module_2.sql


npm exec prisma -- --config ./modules/example/prisma.config.ts migrate dev --name init_example
```

