import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Loading from "../../components/common/Loading";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { ArrowPathIcon as RefreshIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../../context/AuthContext";
import ErrorState from "../../components/common/ErrorState";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useI18n } from "../../context/I18nContext";
import { Client } from "../../types/client";
import { useClient } from "../../context/ClientContext";
import { xfetch, setXFetchContext } from "../../services";
import { usePermission } from "../../context/PermissionContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

const columnHelper = createColumnHelper<Client>();

export default function ClientListPage() {
  const { t } = useI18n();
  const { selectedClient, setSelectedClient } = useClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();
  const { isPermissionLoaded, hasPermission } = usePermission();

  const backToHome = () => {
    window.location.href = "/";
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingClient(null);
    setIsAddingClient(false);
    setEditError(null);
  };

  const handleAddClient = () => {
    setIsAddingClient(true);
    setEditError(null);
  };

  const fetchClients = async () => {
    if (!isAuthenticated || !token) {
      setError("You must be logged in to view clients");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get search query from input field "q" in header
      const searchInput = document.getElementById('q') as HTMLInputElement;
      const searchQuery = searchInput?.value?.trim() || '';

      // Build URL with query string if search query exists
      const url = new URL(`${API_BASE_URL}/client`);
      if (searchQuery) {
        url.searchParams.append('q', searchQuery);
      }

      const response = await xfetch(url.toString(), {});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch clients');
      }

      if (data.success && data.data && data.data.clients) {
        // Transform the API response to match our Client type
        const transformedClients = data.data.clients.map((client: any) => ({
          id: client.id,
          name: client.name,
          description: client.description,
          status_id: client.statusId,
          created_at: new Date(client.createdAt),
        }));
        setClients(transformedClients);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const refreshClients = () => {
    setRefreshing(true);
    fetchClients().finally(() => {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay for better UX
    });
  };

  const handleUpdateClient = async (updatedClient: Partial<Client>) => {
    if (!editingClient || !token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/client/${editingClient.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedClient.name,
          description: updatedClient.description,
          statusId: updatedClient.status_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client');
      }

      if (data.success) {
        // Update the client in the local state
        setClients(prevClients =>
          prevClients.map(client =>
            client.id === editingClient.id
              ? { ...client, ...updatedClient }
              : client
          )
        );

        window.dispatchEvent(new CustomEvent('reloadClientList'));
        handleCloseEditModal();
      } else {
        throw new Error(data.message || 'Failed to update client');
      }
    } catch (error) {
      console.error("Error updating client:", error);
      // setEditError(error instanceof Error ? error.message : 'Failed to update client');
      setEditError(t("err.failedUpdateClient"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateClient = async (newClient: Partial<Client>) => {
    if (!token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/client`, {
        method: 'POST',
        body: JSON.stringify({
          name: newClient.name,
          description: newClient.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create client');
      }

      if (data.success) {
        // Transform the API response to match our Client type and add to local state
        const createdClient: Client = {
          id: data.data.id,
          name: data.data.name,
          description: data.data.description,
          status_id: data.data.statusId,
          created_at: new Date(data.data.createdAt),
          parentId: null,
          metadata: null,
        };

        setClients(prevClients => [createdClient, ...prevClients]);
        window.dispatchEvent(new CustomEvent('reloadClientList'));
        handleCloseEditModal();
      } else {
        throw new Error(data.message || 'Failed to create client');
      }
    } catch (error) {
      console.error("Error creating client:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSwitchToClient = (client: Client) => {
    setSelectedClient(client);
    window.location.reload();
  };

  const columns = [
    columnHelper.accessor("name", {
      header: t("client.clientName"),
    }),
    columnHelper.accessor("description", {
      header: t("general.description"),
    }),
    columnHelper.accessor("status_id", {
      header: "Status",
      cell: (info) => {
        const statusId = info.getValue();
        const statusMap: { [key: number]: string } = {
          0: "Active",
          1: "Deleted",
          2: "Pending",
          3: "Suspend"
        };
        return statusMap[statusId] || "Unknown";
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      size: 80,
      minSize: 80,
      cell: (info) => {
        const client = info.row.original;

        const handleEdit = () => {
          handleEditClient(client);
        };

        const handleDelete = async () => {
          if (!confirm('Are you sure you want to delete this client?')) return;

          try {
            const response = await xfetch(`${API_BASE_URL}/client/${client.id}`, {
              method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok && data.success) {
              // Remove client from local state
              setClients(prevClients => prevClients.filter(c => c.id !== client.id));
              window.dispatchEvent(new CustomEvent('reloadClientList'));
            } else {
              alert(data.message || 'Failed to delete client');
            }
          } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client');
          }
        };

        const handleSwitch = () => {
          handleSwitchToClient(client);
        };

        const isActiveClient = selectedClient?.id === client.id;

        return (
          <div className="flex items-center gap-2">
            {!isActiveClient && hasPermission('client', 'read') && (
              <button
                onClick={handleSwitch}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                title="Switch to Client"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </button>
            )}
            {hasPermission('client', 'edit') && (
              <button
                onClick={handleEdit}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="Edit Client"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {hasPermission('client', 'delete') && (
              <button
                onClick={handleDelete}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="Delete Client"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  useEffect(() => {
    if (selectedClient) {
      // Set context untuk xfetch
      setXFetchContext({
        token,
        selectedClient,
      });
      fetchClients();
    }
  }, [token, isAuthenticated, selectedClient, isPermissionLoaded]);

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title={"Tenant List | " + import.meta.env.VITE_APP_NAME}
          message="Loading tenant list..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <PageMeta title="Tenant List" description="Error loading tenant list" />
        <PageBreadcrumb pageTitle="Tenant List" />
        <ErrorState
          title="Error Loading Tenant List"
          message={error}
          onRetry={backToHome}
          retryLabel="Back To Home"
        />
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div>
        <PageMeta title="Tenant List" description="Authentication required to view tenant list" />
        <PageBreadcrumb pageTitle="Tenant List" />
        <div className="flex items-center justify-center p-8">
          <div className="text-yellow-500 dark:text-yellow-400">
            Please log in to view the tenant list.
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied state
  if (isPermissionLoaded && !hasPermission('client', 'read')) {
    return (
      <div>
        <PageMeta title="Tenant List" description="Permission denied to view tenant list" />
        <PageBreadcrumb pageTitle="Tenant List" />
        <div className="flex items-center justify-center p-8">
          <div className="text-red-500 dark:text-red-400">
            You don't have permission to view the tenant list.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Tenant List | - "
        description="Manage and view all tenant in the system" />

      <div id="page-container" className="mx-auto">
        <div id="content-container" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div id="content-header" className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("client.clientList")}</h2>
            <div className="flex items-center gap-3">
              <button
                id="btn-search"
                onClick={refreshClients}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Searching...' : ''}
              </button>
              {hasPermission('client', 'create') && (
                <button
                  id="btn-add"
                  onClick={handleAddClient}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
                >
                  <UserPlusIcon className={`h-4 w-4`} />
                </button>
              )}
            </div>
          </div>

          <div className="page-content px-6 py-4">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableCell
                          isHeader
                          key={header.id}
                          className="px-5 py-3 font-bold text-gray-700 text-start text-theme-xs dark:text-gray-300"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={columns.length}
                        className="px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No clients found.
                      </td>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const client = row.original;
                      const isPending = client.status_id === 2;
                      const isSuspended = client.status_id === 3;
                      const isActiveClient = selectedClient?.id === client.id;
                      
                      let className = "";
                      if (isActiveClient) {
                        className = "bg-green-50 dark:bg-green-900/20";
                      } else if (isPending) {
                        className = "bg-yellow-50 dark:bg-yellow-900/20";
                      } else if (isSuspended) {
                        className = "bg-gray-100 dark:bg-gray-900/20";
                      }

                      return (
                        <TableRow
                          key={row.id}
                          className={className}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="px-5 py-2 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

            </div>
          </div> {/* page-content */}

        </div>
      </div> {/* clientlist-page */}

      {/* Edit Client Modal */}
      <Modal isOpen={!!editingClient} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {editingClient && (
          <EditClientModalContent
            client={editingClient}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleUpdateClient}
            isEditing={true}
          />
        )}
      </Modal>

      {/* Add Client Modal */}
      <Modal isOpen={isAddingClient} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {isAddingClient && (
          <EditClientModalContent
            client={null}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleCreateClient}
            isEditing={false}
          />
        )}
      </Modal>

    </div>
  );
}

// Edit Client Modal Content Component
interface EditClientModalProps {
  client: Client | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate: (client: Partial<Client>) => void;
  isEditing: boolean;
}

function EditClientModalContent({ client, loading, error, onClose, onUpdate, isEditing }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    description: client?.description || '',
    status_id: client?.status_id || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status_id' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6">
      <div className="px-2 pr-14 flex-shrink-0">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
        </h4>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {isEditing ? 'Update client information and settings' : 'Create a new tenant'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div className="col-span-1">
              <Label>Tenant Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1">
              <Label>Description</Label>
              <Input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1">
              <Label>Status</Label>
              <select
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value={0}>Active</option>
                <option value={1}>Deleted</option>
                <option value={2}>Pending</option>
                <option value={3}>Suspend</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-2 py-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 px-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 lg:justify-end flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Tenant' : 'Create Tenant')}
          </Button>
        </div>
      </form>
    </div>
  );
}