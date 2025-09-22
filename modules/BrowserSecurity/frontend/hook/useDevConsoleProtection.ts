import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../../../src/context/AuthContext';
import DevConsoleDetector from '../utils/devConsoleDetector';
import { logs } from '../../../../src/utils';

/**
 * Hook untuk proteksi developer console
 */
export const useDevConsoleProtection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const detector = DevConsoleDetector.getInstance();
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(detector.isFeatureEnabled());
  const lastAuthState = useRef<boolean | null>(null);
  const isInitializing = useRef(false);

  const handleConsoleDetected = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Cek apakah sudah berada di halaman dev-support untuk menghindari infinite redirect
      if (location.pathname !== '/dev-support') {
        // Redirect ke halaman dev-support
        navigate('/dev-support');
      }
    }
  }, [navigate, location.pathname]);

  // Effect untuk initialize ketika authentication status berubah
  useEffect(() => {
    // Skip if auth state hasn't changed or detector is already initializing
    if (lastAuthState.current === isAuthenticated || detector.isInitializingState()) {
      return;
    }

    // Debounce the initialize call
    const timeoutId = setTimeout(async () => {
      // Double check if still not initializing
      if (detector.isInitializingState() || isInitializing.current) return;

      isInitializing.current = true;
      try {
        logs('Hook: Calling detector.initialize()');
        await detector.initialize();
        setIsProtectionEnabled(detector.isFeatureEnabled());
        lastAuthState.current = isAuthenticated;
      } finally {
        isInitializing.current = false;
      }
    }, 300); // Increased debounce to 300ms

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, detector]);

  useEffect(() => {
    if (!detector.isFeatureEnabled()) {
      return; // Jika fitur tidak enabled, tidak perlu setup
    }

    // Setup proteksi
    detector.disableConsoleMethods();
    detector.disableKeyboardShortcuts();

    // Tambah callback untuk deteksi
    detector.addCallback(handleConsoleDetected);

    // Mulai monitoring
    detector.startMonitoring();

    // Cleanup
    return () => {
      detector.removeCallback(handleConsoleDetected);
      detector.stopMonitoring();
    };
  }, [detector, handleConsoleDetected, isProtectionEnabled]);

  return {
    isProtectionEnabled,
  };
};

export default useDevConsoleProtection;