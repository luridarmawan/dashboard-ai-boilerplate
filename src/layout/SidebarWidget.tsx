export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03] hidex`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        AI-Powered<br />Admin Dashboard
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Modern, AI-Powered Admin Dashboard Template — Free, Open-Source, Built with React & Tailwind CSS by CARIK.id
      </p>
      <a
        href="https://github.com/luridarmawan/dashboard-ai-boilerplate"
        target="_blank"
        rel="nofollow"
        className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
      >
        Show More
      </a>
    </div>
  );
}
