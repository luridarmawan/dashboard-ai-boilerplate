import React from 'react';

// TODO: format permission guide

const PermissionGuide: React.FC = () => {
  return null;


  return (
    <div className='note py-4 text-sm'>
    <article className={`prose prose-zinc dark:prose-invert max-w-none`}>
      <h1>PERMISSION</h1>

      <section>
        <h2>Concepts and Conventions</h2>
        <ol>
          <li>
            <strong>Resource Name</strong>
            <ul>
              <li>
                Use the format <code>module.feature</code> (e.g., <code>sales.pipeline</code>, <code>sales.invoice</code>, <code>user.profile</code>).
              </li>
              <li>This convention helps maintain consistency and simplifies searching.</li>
            </ul>
          </li>
          <li>
            <strong>Supported Wildcards</strong> (according to the <code>matchesResource</code> function):
            <ul>
              <li><code>*.*</code> → matches all resources.</li>
              <li>
                <code>module.*</code> → matches all features within a specific module.
                <ul>
                  <li>Example: <code>sales.*</code> includes <code>sales.pipeline</code>, <code>sales.invoice</code>, etc.</li>
                </ul>
              </li>
              <li>
                <code>module.feature</code> → specific to a feature within a certain module.
                <ul>
                  <li>Example: <code>sales.pipeline</code> applies only to the pipeline feature in the sales module.</li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <strong>Action</strong>
            <ul>
              <li><strong>read</strong> → only for reading/accessing data.</li>
              <li><strong>write</strong> → for creating, updating, or deleting data.</li>
              <li><strong>manage</strong> → super-action, granting full rights over related resources (including read &amp; write).</li>
            </ul>
          </li>
        </ol>
      </section>

      <section>
        <h2>Permission Examples</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Access Name</th>
                <th>Resource</th>
                <th>Action</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Full All Access</td>
                <td><code>*.*</code></td>
                <td>manage</td>
                <td>Can manage all resources</td>
              </tr>
              <tr>
                <td>Read All Access</td>
                <td><code>*.*</code></td>
                <td>read</td>
                <td>Can read all resources</td>
              </tr>
              <tr>
                <td>Write All Access</td>
                <td><code>*.*</code></td>
                <td>write</td>
                <td>Can write all resources</td>
              </tr>
              <tr>
                <td>Payroll Reader</td>
                <td><code>payroll.*</code></td>
                <td>read</td>
                <td>Can read all payroll resources</td>
              </tr>
              <tr>
                <td>Payroll Admin</td>
                <td><code>payroll.*</code></td>
                <td>manage</td>
                <td>Can fully manage payroll resources (read, write, delete)</td>
              </tr>
              <tr>
                <td>User Profile RW</td>
                <td><code>user.profile</code></td>
                <td>write</td>
                <td>Can create/update user profiles</td>
              </tr>
              <tr>
                <td>User Profile R</td>
                <td><code>user.profile</code></td>
                <td>read</td>
                <td>Can read user profiles</td>
              </tr>
              <tr>
                <td>Sales Pipeline R</td>
                <td><code>sales.pipeline</code></td>
                <td>read</td>
                <td>Can read pipeline data in the sales module</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>Use <code>manage</code> only for roles with full responsibility (e.g., admin).</li>
          <li>Use a combination of <code>read</code> and <code>write</code> to limit access rights as needed.</li>
          <li>Apply wildcards for efficient permission configuration at the module level.</li>
          <li>Ensure resource naming is consistent to avoid confusion when scaling.</li>
        </ul>
      </section>
    </article>

    </div>
  )
}

export default PermissionGuide;
