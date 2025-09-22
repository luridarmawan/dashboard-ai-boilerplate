# Example API Output


## Get Group Permissions

```json
{
  "success": true,
  "message": "Group retrieved successfully",
  "data": {
    "group_permissions": [
      {
        "id": "caeee992-cec3-4c29-821f-1a1a63d530dd",
        "name": "Can Create All",
        "resource": "*.*",
        "action": "create",
        "order": 0
      },
      {
        "id": "2dbda323-f5ec-4321-b815-3d9d0d5d919c",
        "name": "Can Edit All",
        "resource": "*.*",
        "action": "edit",
        "order": 0
      }
    ]
  }
}
```