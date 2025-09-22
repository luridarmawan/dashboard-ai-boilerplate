# PERMISSION

## Concepts and Conventions

1. **Resource Name**
   - Use the format `module.feature` (e.g., `sales.pipeline`, `sales.invoice`, `user.profile`).
   - This convention helps maintain consistency and simplifies searching.

2. **Supported Wildcards** (according to the `matchesResource` function):
   - `*.*` → matches all resources.
   - `module.*` → matches all features within a specific module.
     - Example: `sales.*` includes `sales.pipeline`, `sales.invoice`, etc.
   - `module.feature` → specific to a feature within a certain module.
     - Example: `sales.pipeline` applies only to the pipeline feature in the sales module.

3. **Action**
   - **read** → only for reading/accessing data.
   - **write** → for creating, updating, or deleting data.
   - **manage** → super-action, granting full rights over related resources (including read & write).

---

## Permission Examples

| Access Name       | Resource | Action  | Description |
|-------------------|----------|---------|-------------|
| Full All Access   | *.*      | manage  | Can manage all resources |
| Read All Access   | *.*      | read    | Can read all resources |
| Write All Access  | *.*      | write   | Can write all resources |
| Payroll Reader    | payroll.*| read    | Can read all payroll resources |
| Payroll Admin     | payroll.*| manage  | Can fully manage payroll resources (read, write, delete) |
| User Profile RW   | user.profile | write | Can create/update user profiles |
| User Profile R    | user.profile | read  | Can read user profiles |
| Sales Pipeline R  | sales.pipeline | read | Can read pipeline data in the sales module |

---

## Best Practices

- Use `manage` only for roles with full responsibility (e.g., admin).
- Use a combination of `read` and `write` to limit access rights as needed.
- Apply wildcards for efficient permission configuration at the module level.
- Ensure resource naming is consistent to avoid confusion when scaling.
