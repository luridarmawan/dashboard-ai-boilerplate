import { useEffect } from 'react';
import useDevConsoleProtection from '../../hook/useDevConsoleProtection';

interface DevConsoleProtectionProps {
  children: React.ReactNode;
}

/**
 * Komponen wrapper untuk proteksi developer console
 */
const DevConsoleProtection: React.FC<DevConsoleProtectionProps> = ({ children }) => {
  const { isProtectionEnabled } = useDevConsoleProtection();

  useEffect(() => {
    if (isProtectionEnabled) {
      // Tambahan proteksi: disable text selection dan drag
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.ondragstart = () => false;
      document.body.onselectstart = () => false;

      // Cleanup
      return () => {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.ondragstart = null;
        document.body.onselectstart = null;
      };
    }
  }, [isProtectionEnabled]);

  return <>{children}</>;
};

export default DevConsoleProtection;