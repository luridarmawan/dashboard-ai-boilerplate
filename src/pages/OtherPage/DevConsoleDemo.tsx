import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DevConsoleStatus from '../../components/security/DevConsoleStatus';
import ContextMenuStatus from '../../components/security/ContextMenuStatus';
import DevConsoleDetector from '../../utils/devConsoleDetector';
import ContextMenuProtector from '../../utils/contextMenuProtector';

/**
 * Halaman demo untuk fitur Developer Console Protection
 */
const DevConsoleDemo = () => {
  const { isAuthenticated } = useAuth();
  const [isDevConsoleProtectionEnabled, setIsDevConsoleProtectionEnabled] = useState(false);
  const [isContextMenuProtectionEnabled, setIsContextMenuProtectionEnabled] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const detector = DevConsoleDetector.getInstance();
    setIsDevConsoleProtectionEnabled(detector.isFeatureEnabled());
    setIsContextMenuProtectionEnabled(import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true');
  }, [isAuthenticated]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testConsoleLog = () => {
    try {
      console.log('Test console.log');
      addTestResult('console.log executed (protection may be disabled)');
    } catch (error) {
      addTestResult('console.log blocked by protection');
    }
  };

  const testKeyboardShortcuts = () => {
    addTestResult('Try pressing F12, Ctrl+Shift+I, or Ctrl+U to test keyboard protection');
  };

  const testContextMenu = () => {
    addTestResult('Try right-clicking anywhere to test context menu protection');
  };

  const testReinitialize = async () => {
    try {
      const detector = DevConsoleDetector.getInstance();
      await detector.initialize();
      setIsDevConsoleProtectionEnabled(detector.isFeatureEnabled());
      addTestResult('Configuration initialized successfully');
    } catch (error) {
      addTestResult(`Failed to initialize: ${error}`);
    }
  };

  const testResetState = () => {
    try {
      const detector = DevConsoleDetector.getInstance();
      detector.resetInitializationState();
      addTestResult(`State reset - Initialized: ${detector.isInitializedState()}, Initializing: ${detector.isInitializingState()}`);
    } catch (error) {
      addTestResult(`Failed to reset state: ${error}`);
    }
  };

  const checkDetectorState = () => {
    try {
      const detector = DevConsoleDetector.getInstance();
      addTestResult(`Detector State - Initialized: ${detector.isInitializedState()}, Initializing: ${detector.isInitializingState()}, Enabled: ${detector.isFeatureEnabled()}`);
    } catch (error) {
      addTestResult(`Failed to check state: ${error}`);
    }
  };

  const testContextMenuReinitialize = async () => {
    try {
      // const ContextMenuProtector = (await import('../../utils/contextMenuProtector')).default;
      const protector = ContextMenuProtector.getInstance();
      await protector.initialize();
      setIsContextMenuProtectionEnabled(protector.isProtectionEnabled());
      addTestResult('Context menu configuration initialized successfully');
    } catch (error) {
      addTestResult(`Failed to initialize context menu: ${error}`);
    }
  };

  const checkContextMenuState = async () => {
    try {
      // const ContextMenuProtector = (await import('../../utils/contextMenuProtector')).default;
      const protector = ContextMenuProtector.getInstance();
      addTestResult(`Context Menu State - Initialized: ${protector.isInitializedState()}, Initializing: ${protector.isInitializingState()}, Enabled: ${protector.isProtectionEnabled()}`);
    } catch (error) {
      addTestResult(`Failed to check context menu state: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Security Protection Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Halaman ini mendemonstrasikan fitur proteksi keamanan aplikasi termasuk developer console dan context menu protection. 
          Jika proteksi aktif, berbagai aksi akan diblokir atau mengalihkan ke halaman dev-support.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              Developer Console Protection
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isDevConsoleProtectionEnabled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isDevConsoleProtectionEnabled ? 'Aktif' : 'Nonaktif'}
            </span>
            <div className="mt-2 space-y-1">
              <div>
                <code className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                  ENV: {import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE}
                </code>
              </div>
              {isAuthenticated && (
                <div>
                  <code className="text-xs bg-blue-300 dark:bg-blue-700 px-2 py-1 rounded">
                    API: developer.console.protection
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
              Context Menu Protection
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isContextMenuProtectionEnabled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isContextMenuProtectionEnabled ? 'Aktif' : 'Nonaktif'}
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
            Test Proteksi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={testConsoleLog}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Console.log
            </button>
            
            <button
              onClick={testKeyboardShortcuts}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Keyboard Shortcuts
            </button>
            
            <button
              onClick={testContextMenu}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Test Right-Click Here
            </button>

            {isAuthenticated && (
              <button
                onClick={testReinitialize}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reinitialize Config
              </button>
            )}
          </div>

          {/* Debug buttons */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Developer Console Debug</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={testResetState}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🔧 Reset Init State
              </button>
              <button
                onClick={checkDetectorState}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📊 Check Detector State
              </button>
            </div>

            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Context Menu Debug</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAuthenticated && (
                <button
                  onClick={testContextMenuReinitialize}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  🔄 Reinit Context Menu
                </button>
              )}
              <button
                onClick={checkContextMenuState}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                📋 Check Context Menu State
              </button>
            </div>
          </div>

          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Test Results
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DevConsoleStatus />
      
      <ContextMenuStatus />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Instruksi Testing
        </h3>
        
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
              ⚠️ Jika Proteksi Aktif:
            </h4>
            <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
              <li>• Tekan F12 → Akan diblokir atau redirect ke /dev-support</li>
              <li>• Tekan Ctrl+Shift+I → Akan diblokir</li>
              <li>• Right-click → Context menu diblokir</li>
              <li>• console.log() → Method dinonaktifkan</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
              ✅ Jika Proteksi Nonaktif:
            </h4>
            <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
              <li>• Semua keyboard shortcuts berfungsi normal</li>
              <li>• Context menu tersedia</li>
              <li>• console.log() berfungsi normal</li>
              <li>• Developer tools dapat dibuka</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevConsoleDemo;