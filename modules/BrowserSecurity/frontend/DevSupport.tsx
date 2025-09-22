import { useEffect } from 'react';
import { useNavigate } from 'react-router';

const DevSupport = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect ke home setelah 5 detik
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Developer Console Terdeteksi
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Untuk keamanan aplikasi, akses developer console telah dinonaktifkan.
            Silakan tutup developer console untuk melanjutkan.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Cara menutup Developer Console:
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 text-left">
              <li>• Tekan <kbd className="px-1 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">F12</kbd> untuk toggle</li>
              <li>• Atau tekan <kbd className="px-1 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-xs">Ctrl+Shift+I</kbd></li>
              <li>• Atau klik kanan → Inspect Element (tutup tab)</li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Halaman ini akan otomatis redirect dalam 5 detik
        </div>
      </div>
    </div>
  );
};

export default DevSupport;