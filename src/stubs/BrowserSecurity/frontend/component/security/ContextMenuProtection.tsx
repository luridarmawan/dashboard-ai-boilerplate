import React from 'react';

interface ContextMenuProtectionProps {
  children: React.ReactNode;
}

const ContextMenuProtection: React.FC<ContextMenuProtectionProps> = ({ children }) => {
  // No-op implementation - just pass through children
  if (import.meta.env.DEV) {
    // console.log("[noopSecurity] ContextMenuProtection rendered, noop.");
  }
  
  return <>{children}</>;
};

export default ContextMenuProtection;