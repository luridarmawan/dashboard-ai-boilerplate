import { Page } from "../page/Page";
import { PageHeader } from "../page/Header";
import { Content } from "../page/Content";
import { ToolbarButton } from "../page/ToolbarButton";
import { UniversalTable } from "./UniversalTable";
import { UniversalModal } from "./UniversalModal";
import Loading from "../common/Loading";

import { ArrowPathIcon as RefreshIcon, MagnifyingGlassIcon as SearchIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { FieldConfig } from "../../types/form";
import { Table } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useClient } from "../../context/ClientContext";
import { useI18n } from "../../context/I18nContext";
import { xfetch, setXFetchContext } from "../../services";
import toast from "react-hot-toast";

import { ucwords } from "../../utils/string";

interface UniversalPageProps<T = any> {
  module?: string;
  endpoint: string;
  title: string;
  fields: ReadonlyArray<FieldConfig<T>>;
  table: Table<T>;
  data: T[];
  setData: (data: T[]) => void;
  modalDescription?: string;
  dataKey?: string; // Key untuk mengakses data dari response (default: 'data')
  loading?: boolean; // Loading state dari parent
  setLoading?: (loading: boolean) => void; // Function untuk update loading state
  enableAdd?: boolean;
  enableSearch?: boolean;
  onRowClick?: (rowData: T, columnInfo?: { id: string, name: string }) => void;
  customButton?: React.ReactNode;
  skipCSRF?: boolean;
  children?: React.ReactNode;
  onPermissionsChange?: (permissions: any) => void; // Callback untuk permissions
}

export const UniversalPage = <T extends { id?: any } = any>({
  module = '',
  endpoint,
  title,
  fields,
  table,
  data,
  setData,
  modalDescription = "",
  dataKey = 'data',
  loading = false,
  setLoading,
  enableAdd = true,
  enableSearch = true,
  onRowClick,
  customButton,
  skipCSRF = false,
  children,
  onPermissionsChange
}: UniversalPageProps<T>) => {
  const { t } = useI18n();
  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  // Internal states
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingData, setIsAddingData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<T | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch data function
  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial && setLoading) {
        setLoading(true);
      }

      const url = new URL(endpoint);
      if (searchQuery.trim()) {
        url.searchParams.append('q', searchQuery.trim());
      }

      const response = await xfetch(url.toString(), {
        skipCSRF,
      });
      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Access data using dataKey path (e.g., 'data.examples' or just 'data')
        const keys = dataKey.split('.');
        let extractedData = responseData;
        for (const key of keys) {
          extractedData = extractedData?.[key];
        }
        setData(extractedData || []);

        // get permission info
        const permissions = responseData?.permissions || {};

        // Pass permissions to parent component
        if (onPermissionsChange) {
          onPermissionsChange(permissions);
        }
      } else {
        // throw new Error(responseData.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!isInitial) {
        toast.error(t('general.fetchError'));
      }
    } finally {
      if (isInitial && setLoading) {
        setLoading(false);
      }
    }
  };

  // Delete data function
  const deleteData = async (item: T) => {
    try {
      const response = await xfetch(`${endpoint}/${item.id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      if (response.ok && responseData.success) {
        // Remove item from local state
        setData(data.filter(d => d.id !== item.id));
        toast.success(t('general.deleteSuccess'));
      } else {
        alert(responseData.message || t('general.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert(t('general.deleteError'));
    }
  };

  // Create/Update data function
  const handleCreateUpdateData = async (formData: Partial<T>) => {
    const method = (formData?.id == null) ? 'POST' : 'PUT';
    const param = (formData?.id == null) ? '' : `/${formData.id}`;

    try {
      setEditLoading(true);
      setErrorMessage(null);

      const response = await xfetch(`${endpoint}${param}`, {
        method: method,
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      if (response.ok && responseData.success) {
        // Update local state
        if (isEditing) {
          setData(data.map(d => d.id === responseData.data.id ? responseData.data : d));
        } else {
          setData([...data, responseData.data]);
        }
        handleCloseModal();
        toast.success(t('general.saveSuccess'));
      } else {
        throw new Error(responseData.message || t('general.saveError'));
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setErrorMessage(t('general.saveError') + ".\n" + error);
      toast.error(t('general.saveError'));
    } finally {
      setEditLoading(false);
    }
  };

  // Modal handlers
  const addDataModal = () => {
    setIsAddingData(true);
    setIsEditing(false);
    setEditingData(null);
    setErrorMessage(null);
  };

  const editDataModal = (item: T) => {
    setIsAddingData(false);
    setIsEditing(true);
    setEditingData(item);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    setIsAddingData(false);
    setIsEditing(false);
    setEditingData(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (formData: Partial<T>) => {
    if (isEditing) {
      formData.id = editingData?.id;
    }
    await handleCreateUpdateData(formData);
  };

  // Refresh handler
  const refreshData = () => {
    setRefreshing(true);
    fetchData(false).finally(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle Enter key press in search input
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      refreshData();
    }
  };

  useEffect(() => {
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      setXFetchContext({
        token,
        selectedClient
      });
      fetchData(true);
    } else if (!selectedClient || !selectedClient.id) {
      // setLoading(false);
    }
  }, [token, isAuthenticated, selectedClient])

  // Expose edit, delete, and refresh functions to parent through table actions
  useEffect(() => {
    // Store functions in window object so they can be accessed by action buttons
    (window as any)[`${module}_editDataModal`] = editDataModal;
    (window as any)[`${module}_deleteData`] = deleteData;
    (window as any)[`${module}_refreshData`] = refreshData;

    return () => {
      delete (window as any)[`${module}_editDataModal`];
      delete (window as any)[`${module}_deleteData`];
      delete (window as any)[`${module}_refreshData`];
    };
  }, [module, data]);

  // Show loading state if data is being fetched initially
  // if (loading && data.length === 0) {
  //   return (
  //
  //     ....
  //
  //   );
  // }

  return (
    <>
      <Page id={module ? `${module}-page` : 'universal-page'} className="h-full">
        <PageHeader title={title}>

          {enableSearch && (
            <ToolbarButton id="btn-search" disabled={refreshing}>
              <input
                id="q"
                name="q"
                type="text"
                value={searchQuery}
                placeholder="Search ..."
                className="border-0 outline-none bg-transparent w-45 md:w-50 placeholder:text-gray-400 text-sm focus:ring-0"
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
              <SearchIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </ToolbarButton>
          )}
          <ToolbarButton id="btn-refresh" tooltip="Refresh data" onClick={refreshData} disabled={refreshing}>
            <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : ''}
          </ToolbarButton>
          {enableAdd && (
            <ToolbarButton id="btn-add" tooltip="Add data ..." onClick={addDataModal} disabled={refreshing}>
              <UserPlusIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </ToolbarButton>
          )}
          {customButton}
        </PageHeader>

        <Content>
          {loading ? (
            <Loading
              title={`Loading | ${import.meta.env.VITE_APP_NAME}`}
              message={t('general.loading')}
            />
          ) : (
            <UniversalTable table={table} onRowClick={onRowClick} />
          )}
        </Content>

        <Content>
          {children}
        </Content>

      </Page>

      {/* Universal Modal */}
      {(isAddingData || isEditing) && (
        <UniversalModal<T>
          isOpen={isAddingData || isEditing}
          fields={fields}
          data={editingData}
          title={isEditing ? `Edit ${ucwords(module)}` : `Add ${ucwords(module)}`}
          description={modalDescription}
          loading={editLoading}
          error={errorMessage || ''}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        >
        </UniversalModal>
      )}
    </>
  );
};