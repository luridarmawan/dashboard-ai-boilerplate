import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Client } from '../types/client';

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider = ({ children }: ClientProviderProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
    // Try to initialize from localStorage if available
    const savedClientId = localStorage.getItem('selectedClientId');
    if (savedClientId) {
      return { id: savedClientId, name: 'Loading...' } as Client;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(() => {
    // Initialize from localStorage to maintain state across page navigations
    return localStorage.getItem('hasRestoredClientFromStorage') === 'true';
  });
  const { token, isLoading: authLoading, isAuthenticated } = useAuth();

  // Save selected client to localStorage whenever it changes
  useEffect(() => {
    if (selectedClient?.id) {
      // console.log('Saving client to localStorage:', selectedClient.id);
      localStorage.setItem('selectedClientId', selectedClient.id);
    }
  }, [selectedClient]);

  // Fetch clients when auth is ready
  useEffect(() => {
    const handleReloadClientList = () => {
      fetchClients();
    }

    // console.log('ClientContext useEffect:', { authLoading, isAuthenticated, token: !!token });
    // Only fetch clients when auth is not loading and user is authenticated with token
    if (!authLoading && isAuthenticated && token) {
      // console.log('Fetching clients...');
      fetchClients();
      window.addEventListener('reloadClientList', handleReloadClientList);
    }
    return () => {
      window.removeEventListener('reloadClientList', handleReloadClientList);
    };

  }, [token, authLoading, isAuthenticated]);

  // Restore selected client from localStorage after clients are loaded (only once)
  useEffect(() => {
    if (clients.length > 0 && !hasRestoredFromStorage) {
      const savedClientId = localStorage.getItem('selectedClientId');
      // console.log('Restoring client from localStorage:', { savedClientId, clientsCount: clients.length });

      let clientToSelect: Client | null = null;

      if (savedClientId) {
        const savedClient = clients.find(client => client.id === savedClientId);
        // console.log('Found saved client:', savedClient);
        if (savedClient) {
          clientToSelect = savedClient;
        } else {
          // console.log('Saved client not found in available clients, will use first client');
        }
      }

      // If no saved client or saved client not found, use first client
      if (!clientToSelect && clients.length > 0) {
        clientToSelect = clients[0];
        // console.log('Using first client:', clientToSelect);
      }

      if (clientToSelect) {
        setSelectedClient(clientToSelect);
      }

      setHasRestoredFromStorage(true);
      localStorage.setItem('hasRestoredClientFromStorage', 'true');
    }
  }, [clients, hasRestoredFromStorage]);

  const fetchClients = async () => {
    if (!token) {
      console.warn('No token available for fetching clients');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/client/scope`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch clients');
      }

      const clientsData = result.data.clients || [];
      // Transform API response to match our Client type
      const transformedClients = clientsData.map((client: any) => ({
        id: client.id,
        name: client.name,
        description: client.description,
        status_id: client.statusId,
        created_at: new Date(client.createdAt),
        parentId: client.parentId,
        metadata: client.metadata,
      }));
      setClients(transformedClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear client data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setClients([]);
      setSelectedClient(null);
      setHasRestoredFromStorage(false);
      // moved to src\context\AuthContext.tsx
      // localStorage.removeItem('selectedClientId');
      // localStorage.removeItem('hasRestoredClientFromStorage');
    }
  }, [isAuthenticated]);

  const refetch = () => {
    if (!authLoading && isAuthenticated && token) {
      fetchClients();
    }
  };

  const handleSetSelectedClient = (client: Client) => {
    // console.log('Setting selected client:', client);
    setSelectedClient(client);
    // Ensure we mark restoration as complete when client is manually selected
    if (!hasRestoredFromStorage) {
      setHasRestoredFromStorage(true);
      localStorage.setItem('hasRestoredClientFromStorage', 'true');
    }
    // localStorage will be updated by the useEffect above
  };

  const value = {
    clients,
    selectedClient,
    setSelectedClient: handleSetSelectedClient,
    loading: loading || authLoading,
    error,
    refetch,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};