// PermissionContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useClient } from './ClientContext';
// import { logs } from '../utils/logs';
import { xfetch, setXFetchContext } from '../services';

interface PermissionContextType {
  isPermissionLoaded: boolean;
  permissionRaw: object | null;
  permissions: any[];
  hasPermission: (resource: string, action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

// export function PermissionProvider({ perms, children }:{ perms: Permission[], children: React.ReactNode }) {
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isPermissionLoaded, setPermissionLoaded] = useState(false);
  const [permissionRaw, setPermissionRaw] = useState<object | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const { selectedClient } = useClient();

  const fetchPermission = async () => {
    if (!token) {
      console.warn('No token available for fetching permissions');
      setPermissionLoaded(false);
      return;
    }

    try {
      setPermissionLoaded(false);
      const response = await xfetch(`${API_BASE_URL}/user/scope`, {});

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch permissions');
      }

      // Store the permission data
      setPermissionRaw(result);
      setPermissions(result.data?.permissions || []);
      setPermissionLoaded(true);
    } catch (err) {
      console.error('Error fetching permission:', err);
      setPermissionRaw(null);
      setPermissions([]);
      setPermissionLoaded(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && token && selectedClient) {
      setXFetchContext({
        token,
        selectedClient,
      });
      fetchPermission();
    }
  }, [token, authLoading, isAuthenticated, selectedClient]);

  // Helper function to check permissions
  const hasPermission = (resource: string, action: string): boolean => {
    if (!isPermissionLoaded || !permissions.length) {
      return false;
    }

    // Check if user has the specific permission
    return permissions.some(permission => {
      // Exact match
      if (permission.resource === resource && permission.action === action) {
        return true;
      }

      // Wildcard patterns
      if (permission.resource === '*.*' ||
        (permission.resource.endsWith('.*') && resource.startsWith(permission.resource.slice(0, -2) + '.')) ||
        (permission.resource.startsWith('*.') && resource.endsWith('.' + permission.resource.slice(2)))) {
        return permission.action === action || permission.action === '*' || permission.action === 'manage';
      }

      return false;
    });
  };

  const refreshPermissions = async () => {
    await fetchPermission();
  };

  const value: PermissionContextType = {
    isPermissionLoaded,
    permissionRaw,
    permissions,
    hasPermission,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );

}

export const usePermission = () => {
  // console.log('user permission context');
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within an PermissionProvider');
  }
  return context;
};