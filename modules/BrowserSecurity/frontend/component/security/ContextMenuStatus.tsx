import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../src/context/AuthContext';
import useContextMenuProtection from '../../hook/useContextMenuProtection';
import ContextMenuProtector from '../../utils/contextMenuProtector';

/**
 * Komponen untuk menampilkan status proteksi context menu
 */
const ContextMenuStatus = () => {
  const { isAuthenticated } = useAuth();
  const { isProtectionEnabled, toggleProtection, getStatus } = useContextMenuProtection();
  const [status, setStatus] = useState(() => getStatus());
  const [configSource, setConfigSource] = useState<'env' | 'api' | 'mixed'>('env');

  useEffect(() => {
    const protector = ContextMenuProtector.getInstance();
    const envEnabled = import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true';
    
    setStatus(getStatus());
    
    // Determine configuration source
    if (isAuthenticated) {
      if (protector.isProtectionEnabled() && !envEnabled) {
        setConfigSource('api');
      } else if (protector.isProtectionEnabled() && envEnabled) {
        setConfigSource('mixed');
      } else {
        setConfigSource('env');
      }
    } else {
      setConfigSource('env');
    }
  }, [isProtectionEnabled, isAuthenticated, getStatus]);

  const handleToggle = useCallback(() => {
    toggleProtection();
    setStatus(getStatus());
  }, [toggleProtection, getStatus]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Context Menu Protection
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Proteksi untuk mencegah akses context menu (right-click) di browser
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {status.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                status.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Status Saat Ini:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Environment: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">{status.environmentSetting}</code></li>
            <li>• Enabled: {status.isEnabled ? 'Ya' : 'Tidak'}</li>
            <li>• Active: {status.isActive ? 'Ya' : 'Tidak'}</li>
            {isAuthenticated && (
              <li>• Config Source: <span className="font-medium">
                {configSource === 'api' ? 'API Override' : configSource === 'mixed' ? 'Both Active' : 'Environment Only'}
              </span></li>
            )}
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
            Yang Diblokir:
          </h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
            <li>• Right-click context menu</li>
            <li>• Long press pada mobile</li>
            <li>• Inspect element via context menu</li>
            <li>• Copy/paste via context menu</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
          Konfigurasi:
        </h4>
        <div className="space-y-2">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Environment Variable:</strong> 
            <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded ml-1">
              VITE_APP_DISABLE_CONTEXT_MENU={import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU}
            </code>
          </div>
          
          {isAuthenticated && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>API Configuration:</strong> 
              <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded ml-1">
                context.menu.protection
              </code>
              <span className="ml-2 text-xs">
                ({configSource === 'api' ? 'API Override' : configSource === 'mixed' ? 'Both Active' : 'Using Env'})
              </span>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <em>Login untuk melihat konfigurasi API</em>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-2">
          ⚠️ Catatan Penting:
        </h4>
        <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
          <li>• Input fields (input, textarea) tetap memiliki context menu untuk UX yang lebih baik</li>
          <li>• Toggle di atas hanya berlaku untuk sesi saat ini</li>
          <li>• Untuk perubahan permanen, ubah file .env dan restart aplikasi</li>
        </ul>
      </div>
    </div>
  );
};

export default ContextMenuStatus;