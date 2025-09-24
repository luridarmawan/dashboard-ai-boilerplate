import React from 'react';
import { toast } from 'react-hot-toast';
import Badge from '../../../components/ui/badge/Badge';
import { useI18n } from '../../../context/I18nContext';
import { Link } from 'react-router';

const DevConsoleCheck: React.FC = () => {
  const { t } = useI18n();

  const testConsoleLog = () => {
    toast.error("PRO mode only.\nDeveloper Console Protection is disabled.");
  }

  return (
    <div className="p-2 space-y-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Security Protection Test <Badge variant="light" color="error">Pro</Badge>
        </h1>
        <h3 className='text-red-500'>Security Protection: Disabled</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6 whitespace-pre-line">
          {t('security.intro')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              Developer Console Protection
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
              Inactive
            </span>
            <div className="mt-2 space-y-1">
              <div>
                <code className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                  VITE_APP_DISABLE_DEVELOPER_CONSOLE: {import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
              Context Menu Protection
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
              Inactive
            </span>
            <div className="mt-2">
              <code className="text-xs bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">
                VITE_APP_DISABLE_CONTEXT_MENU={import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU}
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Protection Test
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={testConsoleLog}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Console.log
            </button>
            
            <button
              onClick={testConsoleLog}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Keyboard Shortcuts
            </button>
            
            <button
              onClick={testConsoleLog}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Right-Click Here
            </button>

            <button
              onClick={testConsoleLog}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reinitialize Config
            </button>
          </div>

          {/* Debug buttons */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Developer Console Debug</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={testConsoleLog}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🔧 Reset Init State
              </button>
              <button
                onClick={testConsoleLog}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📊 Check Detector State
              </button>
            </div>

            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Context Menu Debug</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testConsoleLog}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🔄 Reinit Context Menu
              </button>
              <button
                onClick={testConsoleLog}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📋 Check Context Menu State
              </button>
            </div>
          </div>

          <button
            onClick={testConsoleLog}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

      </div>

      {/* <DevConsoleStatus /> */}
      
      {/* <ContextMenuStatus /> */}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Protection Test Instructions
        </h3>
        
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
              ⚠️ If Protection is Active:
            </h4>
            <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
              <li>• Press F12 → Will be blocked or redirected to /dev-support</li>
              <li>• Press Ctrl+Shift+I → Will be blocked</li>
              <li>• Right-click → Context menu will be disabled</li>
              <li>• console.log() → Method will be disabled</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
              ✅ If Protection is Inactive:
            </h4>
            <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
              <li>• All keyboard shortcuts work normally</li>
              <li>• Context menu is available</li>
              <li>• console.log() works normally</li>
              <li>• Developer tools can be opened</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 text-center text-xs text-gray-500 mb-10">
        <Link to="https://carik.id/browser-security" target='_blank'>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-4 rounded-lg transition-colors"
        >
          Buy Browser Security Package <sup className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-xxs font-semibold bg-red-100 text-red-800 border border-red-200">Pro</sup>
        </button>
        </Link>
      </div>
    </div>
  );
};

export default DevConsoleCheck;
