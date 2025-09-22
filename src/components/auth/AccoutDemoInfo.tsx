
import { useState } from 'react';

export default function AccoutDemoInfo() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="mt-3 sm:mt-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-600 rounded-lg p-3 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Demo Accounts
        </h3>
        <button
          onClick={() => setShowPasswords(!showPasswords)}
          className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          {showPasswords ? '👁️‍🗨️ Hide' : '👁️ Show'} Passwords
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="text-red-600 dark:text-red-400 text-base sm:text-lg">🛡️</span>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Administrator</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Full access to all features</p>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-xs">Email:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-200 text-xs">
                  admin@example.com
                </code>
                <button
                  onClick={() => copyToClipboard('admin@example.com', 'admin-email')}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                  title="Copy email"
                >
                  {copiedField === 'admin-email' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-xs">Password:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-200 text-xs">
                  {showPasswords ? 'password' : '••••••••'}
                </code>
                <button
                  onClick={() => copyToClipboard('password', 'admin-password')}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                  title="Copy password"
                >
                  {copiedField === 'admin-password' ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="text-blue-600 dark:text-blue-400 text-base sm:text-lg">👤</span>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">User</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Standard user permissions</p>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-xs">Email:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-200 text-xs">
                  user@example.com
                </code>
                <button
                  onClick={() => copyToClipboard('user@example.com', 'user-email')}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                  title="Copy email"
                >
                  {copiedField === 'user-email' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-xs">Password:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-200 text-xs">
                  {showPasswords ? 'user' : '••••'}
                </code>
                <button
                  onClick={() => copyToClipboard('user', 'user-password')}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                  title="Copy password"
                >
                  {copiedField === 'user-password' ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
          <div>
            <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
              Demo Environment
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-1">
              These are test accounts for demonstration purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
