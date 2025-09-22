import { useEffect } from 'react';
import useContextMenuProtection from '../../hook/useContextMenuProtection';

interface ContextMenuProtectionProps {
  children: React.ReactNode;
}

/**
 * Komponen wrapper untuk proteksi context menu
 */
const ContextMenuProtection: React.FC<ContextMenuProtectionProps> = ({ children }) => {
  const { isProtectionEnabled } = useContextMenuProtection();

  useEffect(() => {
    if (isProtectionEnabled) {
      // Additional protection styles using proper CSS properties
      const bodyStyle = document.body.style as any;
      bodyStyle.webkitTouchCallout = 'none';
      bodyStyle.webkitUserSelect = 'none';
      bodyStyle.khtmlUserSelect = 'none';
      bodyStyle.mozUserSelect = 'none';
      bodyStyle.msUserSelect = 'none';
      document.body.style.userSelect = 'none';

      // Cleanup
      return () => {
        bodyStyle.webkitTouchCallout = '';
        bodyStyle.webkitUserSelect = '';
        bodyStyle.khtmlUserSelect = '';
        bodyStyle.mozUserSelect = '';
        bodyStyle.msUserSelect = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isProtectionEnabled]);

  return <>{children}</>;
};

export default ContextMenuProtection;