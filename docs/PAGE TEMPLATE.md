
# 📄 Page Template – AI-Powered Admin Dashboard


Each page/module in the **AI-Powered Admin Dashboard** follows a **default layout** to ensure consistency in both appearance and functionality.

This template includes:

- Meta Information (<PageMeta />) for SEO and page details.
- Page Wrapper with maximum width and responsive design.
- Header Section containing:
- Page Title
- Action Buttons (e.g., Refresh) with loading state.
- Content Section (.page-content) to place your module’s content.

💡 Benefits of using this template:
- Consistent design across all pages.
- Built-in dark mode support.
- Ready-to-use, easily customizable components.
- Responsive layout powered by TailwindCSS.

## 📌 Template Structure

```typescript
  return (
    <div>
      <PageMeta title="Your Module Name | AI-Powered Admin Dashboard"
        description="Your module description" />

      <div id="your-page" className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Module Name</h2>
            <div className="flex items-center gap-3">
              <button
                // onClick={refreshConfigurations}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="page-content px-6 py-4">
            <div className="max-w-full overflow-x-auto">
              // your content
            </div>
          </div> {/* page-content */}

        </div>
      </div> {/* your-page */}
  
    </div>
  );
```

🔍 **Reference**: See [`src/pages/Blank.tsx`](../src/pages/Blank.tsx) for a complete example.