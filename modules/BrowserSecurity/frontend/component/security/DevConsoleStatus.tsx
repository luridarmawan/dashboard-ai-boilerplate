import { useState, useEffect } from 'react';
import { useAuth } from '../../../../../src/context/AuthContext';
import DevConsoleDetector from '../../utils/devConsoleDetector';

/**
 * Komponen untuk menampilkan status proteksi developer console
 */
const DevConsoleStatus = () => {
  const { isAuthenticated } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [configSource, setConfigSource] = useState<'env' | 'api' | 'mixed'>('env');

  useEffect(() => {
    const detector = DevConsoleDetector.getInstance();
    const envEnabled = import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE === 'true';
    
    setIsEnabled(detector.isFeatureEnabled());
    
    // Determine configuration source
    if (isAuthenticated) {
      if (detector.isFeatureEnabled() && !envEnabled) {
        setConfigSource('api');
      } else if (detector.isFeatureEnabled() && envEnabled) {
        setConfigSource('mixed');
      } else {
        setConfigSource('env');
      }
    } else {
      setConfigSource('env');
    }
  }, [isAuthenticated]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Developer Console Protection
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Proteksi untuk mencegah akses developer console di browser
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isEnabled 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isEnabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {isEnabled && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Fitur Proteksi yang Aktif:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Deteksi pembukaan developer console</li>
            <li>• Disable keyboard shortcuts (F12, Ctrl+Shift+I, dll)</li>
            <li>• Disable right-click context menu</li>
            <li>• Disable console methods (log, warn, error, dll)</li>
            <li>• Auto redirect ke halaman /dev-support jika terdeteksi</li>
          </ul>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
          Konfigurasi:
        </h4>
        <div className="space-y-2">
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Environment Variable:</strong> 
            <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded ml-1">
              VITE_APP_DISABLE_DEVELOPER_CONSOLE={import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE}
            </code>
          </div>
          
          {isAuthenticated && (
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>API Configuration:</strong> 
              <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded ml-1">
                developer.console.protection
              </code>
              <span className="ml-2 text-xs">
                ({configSource === 'api' ? 'API Override' : configSource === 'mixed' ? 'Both Active' : 'Using Env'})
              </span>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <em>Login untuk melihat konfigurasi API</em>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevConsoleStatus;