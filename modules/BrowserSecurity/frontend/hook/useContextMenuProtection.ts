import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../../src/context/AuthContext';
import ContextMenuProtector from '../utils/contextMenuProtector';
import { logs } from '../../../../src/utils';

/**
 * Hook untuk proteksi context menu
 */
export const useContextMenuProtection = () => {
  const { isAuthenticated } = useAuth();
  const protector = ContextMenuProtector.getInstance();
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(protector.isProtectionEnabled());
  const lastAuthState = useRef<boolean | null>(null);
  const isInitializing = useRef(false);

  // Effect untuk initialize ketika authentication status berubah
  useEffect(() => {
    // Skip if auth state hasn't changed or protector is already initializing
    if (lastAuthState.current === isAuthenticated || protector.isInitializingState()) {
      return;
    }

    // Debounce the initialize call
    const timeoutId = setTimeout(async () => {
      // Double check if still not initializing
      if (protector.isInitializingState() || isInitializing.current) return;

      isInitializing.current = true;
      try {
        logs('Hook: Calling protector.initialize()');
        await protector.initialize();
        setIsProtectionEnabled(protector.isProtectionEnabled());
        lastAuthState.current = isAuthenticated;
      } finally {
        isInitializing.current = false;
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, protector]);

  useEffect(() => {
    if (protector.isProtectionEnabled()) {
      protector.enableProtection();
    }

    // Cleanup saat component unmount
    return () => {
      protector.disableProtection();
    };
  }, [protector, isProtectionEnabled]);

  const toggleProtection = useCallback(() => {
    protector.toggleProtection();
    setIsProtectionEnabled(protector.isProtectionEnabled());
  }, [protector]);

  const setProtectionStatus = useCallback((enabled: boolean) => {
    protector.setProtectionStatus(enabled);
    setIsProtectionEnabled(enabled);
  }, [protector]);

  const getStatus = useCallback(() => protector.getProtectionStatus(), [protector]);

  return {
    isProtectionEnabled,
    toggleProtection,
    setProtectionStatus,
    getStatus,
  };
};

export default useContextMenuProtection;