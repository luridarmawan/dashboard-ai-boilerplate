import React from 'react';

interface DevConsoleProtectionProps {
  children: React.ReactNode;
}

const DevConsoleProtection: React.FC<DevConsoleProtectionProps> = ({ children }) => {
  // No-op implementation - just pass through children
  if (import.meta.env.DEV) {
    // console.log("[noopSecurity] DevConsoleProtection rendered, noop.");
  }
  
  return <>{children}</>;
};

export default DevConsoleProtection;