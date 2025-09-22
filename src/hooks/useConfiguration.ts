import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCSRF } from "../utils";
import { useClient } from "../context/ClientContext";
import { ConfigurationCreateRequest, ConfigurationUpdateRequest } from "../types/configuration";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

export const useConfiguration = () => {
  const { selectedClient } = useClient();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveConfiguration = async (id: string | null, data: ConfigurationCreateRequest | ConfigurationUpdateRequest) => {
    if (!token) {
      setError("You must be logged in to save configurations");
      return { success: false, error: "You must be logged in to save configurations" };
    }

    try {
      setLoading(true);
      setError(null);

      const csrfData = await getCSRF();

      const url = id 
        ? `${API_BASE_URL}/configuration/${id}`
        : `${API_BASE_URL}/configuration`;
      
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.csrfToken,
          'X-Session-ID': csrfData.sessionId,
          'X-Client-ID': selectedClient?.id || '',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${id ? 'update' : 'create'} configuration`);
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error ${id ? 'updating' : 'creating'} configuration:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${id ? 'update' : 'create'} configuration`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteConfiguration = async (id: string) => {
    if (!token) {
      setError("You must be logged in to delete configurations");
      return { success: false, error: "You must be logged in to delete configurations" };
    }

    try {
      setLoading(true);
      setError(null);
      const csrfData = await getCSRF();

      const response = await fetch(`${API_BASE_URL}/configuration/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfData.csrfToken,
          'X-Session-ID': csrfData.sessionId,
          'X-Client-ID': selectedClient?.id || '',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete configuration');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error deleting configuration:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    saveConfiguration,
    deleteConfiguration,
    loading,
    error
  };
};