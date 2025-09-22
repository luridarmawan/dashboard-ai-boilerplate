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
import { UserCircleIcon } from "../../icons";
import ActionButton from "../../components/common/ActionButton";
import ActionLink from "../../components/common/ActionLink";

import { useAuth } from "../../context/AuthContext";
import ErrorState from "../../components/common/ErrorState";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";


import { useI18n } from "../../context/I18nContext";
import { Group } from "../../types/group";
import { xfetch, setXFetchContext } from "../../services";
import { useClient } from "../../context/ClientContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

const columnHelper = createColumnHelper<Group>();

export default function GroupListPage() {
  const { t } = useI18n();
  const { selectedClient } = useClient();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const backToHome = () => {
    window.location.href = "/";
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingGroup(null);
    setIsAddingGroup(false);
    setEditError(null);
  };

  const handleAddGroup = () => {
    setIsAddingGroup(true);
    setEditError(null);
  };

  const fetchGroups = async () => {
    if (!isAuthenticated || !token) {
      setError("You must be logged in to view groups");
      setLoading(false);
      return;
    }

    if (!selectedClient) {
      setError("No client selected");
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
      const url = new URL(`${API_BASE_URL}/groups`);
      if (searchQuery) {
        url.searchParams.append('q', searchQuery);
      }

      const response = await xfetch(url.toString(), {
        skipCSRF: true, // GET request tidak memerlukan CSRF token
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch groups');
      }

      if (data.success && data.data && data.data.groups) {
        // Transform the API response to match our Group type
        const transformedGroups = data.data.groups.map((group: any) => ({
          id: group.id,
          client_id: group.clientId,
          name: group.name,
          description: group.description,
          status_id: group.statusId,
          created_at: new Date(group.createdAt),
        }));
        setGroups(transformedGroups);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const refreshGroups = () => {
    setRefreshing(true);
    fetchGroups().finally(() => {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay for better UX
    });
  };

  const handleUpdateGroup = async (updatedGroup: Partial<Group>) => {
    if (!editingGroup || !token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/groups/${editingGroup.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedGroup.name,
          description: updatedGroup.description,
          statusId: updatedGroup.status_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update group');
      }

      if (data.success) {
        // Update the group in the local state
        setGroups(prevGroups =>
          prevGroups.map(group =>
            group.id === editingGroup.id
              ? { ...group, ...updatedGroup }
              : group
          )
        );
        handleCloseEditModal();
      } else {
        throw new Error(data.message || 'Failed to update group');
      }
    } catch (error) {
      console.error("Error updating group:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to update group');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateGroup = async (newGroup: Partial<Group>) => {
    if (!token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      if (data.success) {
        // Transform the API response to match our Group type and add to local state
        const createdGroup: Group = {
          id: data.data.id,
          client_id: data.data.clientId,
          name: data.data.name,
          description: data.data.description,
          status_id: data.data.statusId,
          created_at: new Date(data.data.createdAt),
        };

        setGroups(prevGroups => [createdGroup, ...prevGroups]);
        handleCloseEditModal();
      } else {
        throw new Error(data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setEditLoading(false);
    }
  };

  const columns = [
    columnHelper.accessor("name", {
      header: t("group.groupName"),
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
        const group = info.row.original;

        const handleEdit = () => {
          handleEditGroup(group);
        };

        const handleDelete = async () => {
          if (!confirm('Are you sure you want to delete this group?')) return;

          try {
            const response = await xfetch(`${API_BASE_URL}/groups/${group.id}`, {
              method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok && data.success) {
              // Remove group from local state
              setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id));
            } else {
              alert(data.message || 'Failed to delete group');
            }
          } catch (error) {
            console.error('Error deleting group:', error);
            alert('Failed to delete group');
          }
        };

        return (
          <div className="flex items-center gap-2">
            <ActionLink
              to={`/group/member/${group.id}/${group.name}`} variant="view"
              title={`View Group Member: ${group.name}`}
            >
              <UserCircleIcon />
            </ActionLink>
            <ActionLink
              to={`/group/role/${group.id}/${group.name}`} variant="view"
              title={`View Permissions Role: ${group.name}`}
            />
            <ActionButton onClick={handleEdit} variant="edit" title={`Edit Group ${group.name}`} />
            <ActionButton onClick={handleDelete} variant="delete" title={`Delete Group ${group.name}`} />
          </div>
        );
      },
    }),
  ];

  useEffect(() => {
    // Set context untuk xfetch
    setXFetchContext({
      token,
      selectedClient,
    });
    fetchGroups();
  }, [selectedClient, token, isAuthenticated]);

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title={"Group List | " + import.meta.env.VITE_APP_NAME}
          message="Loading group list..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <PageMeta title={t("group.groupList")} description="Error loading group list" />
        <PageBreadcrumb pageTitle="Group List" />
        <ErrorState
          title="Error Loading Group List"
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
        <PageMeta title={t("group.groupList")} description="Authentication required to view group list" />
        <PageBreadcrumb pageTitle="Group List" />
        <div className="flex items-center justify-center p-8">
          <div className="text-yellow-500 dark:text-yellow-400">
            Please log in to view the group list.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Group List | - "
        description="Manage and view all groups in the system" />

      <div id="grouplist-page" className="mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("group.groupList")}</h2>
            <div className="flex items-center gap-3">
              <button
                id="btn-search"
                onClick={refreshGroups}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Searching...' : ''}
              </button>
              <button
                id="btn-add"
                onClick={handleAddGroup}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <UserPlusIcon className={`h-4 w-4`} />
              </button>
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
                          className="px-5 py-3 font-bold text-gray-700 text-start text-theme-xs dark:text-gray-300 whitespace-nowrap"
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
                        No groups found.
                      </td>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const group = row.original;
                      const isPending = group.status_id === 2;
                      const isSuspended = group.status_id === 3;
                      let className = isPending ? "bg-yellow-50 dark:bg-yellow-900/20" : "";
                      className = isSuspended ? "bg-gray-100 dark:bg-yellow-900/20" : className;

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
      </div> {/* grouplist-page */}

      {/* Edit Group Modal */}
      <Modal isOpen={!!editingGroup} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {editingGroup && (
          <EditGroupModalContent
            group={editingGroup}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleUpdateGroup}
            isEditing={true}
          />
        )}
      </Modal>

      {/* Add Group Modal */}
      <Modal isOpen={isAddingGroup} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {isAddingGroup && (
          <EditGroupModalContent
            group={null}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleCreateGroup}
            isEditing={false}
          />
        )}
      </Modal>

    </div>
  );
}

// Edit Group Modal Content Component
interface EditGroupModalProps {
  group: Group | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate: (group: Partial<Group>) => void;
  isEditing: boolean;
}

function EditGroupModalContent({ group, loading, error, onClose, onUpdate, isEditing }: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    status_id: group?.status_id || 0,
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
          {isEditing ? 'Edit Group' : 'Add New Group'}
        </h4>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {isEditing ? 'Update group information and settings' : 'Create a new group'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div className="col-span-1">
              <Label>Group Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Group' : 'Create Group')}
          </Button>
        </div>
      </form>
    </div>
  );
}