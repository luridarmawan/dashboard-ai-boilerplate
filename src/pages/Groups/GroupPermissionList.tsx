import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import PageMeta from "../../components/common/PageMeta";
import Loading from "../../components/common/Loading";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { ArrowPathIcon as RefreshIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from "react-hot-toast";
import ActionButton from "../../components/common/ActionButton";
import PermissionGuide from "./PermissionGuide";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { GroupPermissionType } from "../../types/group_permissions";
import { useClient } from "../../context/ClientContext";
import { xfetch, setXFetchContext } from "../../services";
import { usePermission } from "../../context/PermissionContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

const columnHelper = createColumnHelper<GroupPermissionType>();

export default function GroupPermissionListPage() {
  const { groupPermissionId, groupName } = useParams<{ groupPermissionId: string, groupName: string }>();
  const [groupPermission, setGroupPermission] = useState<GroupPermissionType[]>([]);
  const { t } = useI18n();
  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { hasPermission } = usePermission();
  const [editingPermission, setEditingPermission] = useState<GroupPermissionType | null>(null);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditGroupPermission = (groupPermission: GroupPermissionType) => {
    setEditingPermission(groupPermission);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingPermission(null);
    setIsAddingPermission(false);
    setEditError(null);
  };

  const handleAddPermission = () => {
    setIsAddingPermission(true);
    setEditError(null);
  };

  const handleUpdateGroupPermission = async (updatedPermission: Partial<GroupPermissionType>) => {
    if (!editingPermission || !token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/group-permissions/${editingPermission.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedPermission.name,
          resource: updatedPermission.resource,
          action: updatedPermission.action,
          order: updatedPermission.order,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update permission');
      }

      if (data.success) {
        // Update the permission in the local state
        setGroupPermission(prevPermissions =>
          prevPermissions.map(permission =>
            permission.id === editingPermission.id
              ? { ...permission, ...updatedPermission }
              : permission
          )
        );
        handleCloseEditModal();
        toast.success(t('group.updatePermissionSuccess'));
      } else {
        throw new Error(data.message || 'Failed to update permission');
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to update permission');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateGroupPermission = async (newPermission: Partial<GroupPermissionType>) => {
    if (!token || !groupPermissionId) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/group-permissions`, {
        method: 'POST',
        body: JSON.stringify({
          group_id: groupPermissionId,
          name: newPermission.name,
          resource: newPermission.resource,
          action: newPermission.action,
          order: newPermission.order,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create permission');
      }

      if (data.success) {
        // Add the new permission to the local state
        const createdPermission: GroupPermissionType = {
          id: data.data.group_permission.id,
          name: data.data.group_permission.name,
          resource: data.data.group_permission.resource,
          action: data.data.group_permission.action,
          order: data.data.group_permission.order,
          client_id: data.data.group_permission.client_id,
          group_id: data.data.group_permission.group_id,
          created_at: new Date(data.data.group_permission.created_at),
        };

        setGroupPermission(prevPermissions => [...prevPermissions, createdPermission]);
        handleCloseEditModal();
        toast.success('Permission created successfully');
      } else {
        throw new Error(data.message || 'Failed to create permission');
      }
    } catch (error) {
      console.error("Error creating permission:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to create permission');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteGroupPermission = async (groupPermission: GroupPermissionType) => {
    try {
      const response = await xfetch(`${API_BASE_URL}/group-permissions/${groupPermission.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Remove group from local state
        setGroupPermission(prevGroups => prevGroups.filter(g => g.id !== groupPermission.id));
        toast.success(t('group.updatePermissionSuccess'));
      } else {
        alert(data.message || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      alert('Failed to delete permission group');
    }
  };

  const columns = [
    columnHelper.accessor("name", {
      header: t("group.permissionName"),
    }),
    columnHelper.accessor("resource", {
      header: t("group.resource"),
    }),
    columnHelper.accessor("action", {
      header: t("group.priviledge"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      size: 80,
      minSize: 80,
      cell: (info) => {
        const permission = info.row.original;

        const handleEdit = () => {
          handleEditGroupPermission(permission);
        };
        const handleDelete = () => {
          if (!confirm('Are you sure you want to delete this permission?')) return;
          handleDeleteGroupPermission(permission);
        };

        return (
          <div className="flex items-center gap-2">
            <ActionButton onClick={handleEdit} variant="edit" title={`Edit Group ${permission.name}`} />
            <ActionButton onClick={handleDelete} variant="delete" title={`Delete Group ${permission.name}`} />
          </div>
        )
      }
    }),
  ];

  const table = useReactTable({
    data: groupPermission,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const fetchGroupPermission = async (id: string) => {
    try {
      setHasData(false);
      // Get search query from input field "q" in header
      const searchInput = document.getElementById('q') as HTMLInputElement;
      const searchQuery = searchInput?.value?.trim() || '';

      const url = new URL(`${API_BASE_URL}/group-permissions/${id}`);
      if (searchQuery) {
        url.searchParams.append('q', searchQuery);
      }
      const response = await xfetch(url.toString(), {});
      const data = await response.json();

      if (response.ok && data.success) {
        setGroupPermission(data?.data?.group_permissions);
        setHasData(true);
      } else {
        throw new Error(data.message || 'Failed to fetch group permission');
      }

    } catch (error) {
      console.error('Failed to fetch group permission:', error);
      return;
    } finally {
      // setLoading(false);
    }
  }

  const refreshData = () => {
    setRefreshing(true);
    fetchGroupPermission(groupPermissionId || '').finally(() => {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay for better UX
    });
  }

  const handleAddGroupPermission = () => {
    handleAddPermission();
  }


  useEffect(() => {
    setLoading(true);
    if (selectedClient) {
      // Set context untuk xfetch
      setXFetchContext({
        token,
        selectedClient,
      });
      fetchGroupPermission(groupPermissionId || '');

      setLoading(false);
    }
  }, [token, isAuthenticated, selectedClient?.id])

  if (loading || !hasData) {
    return (
      <div>
        <PageMeta title="Group Permission List" description="Permission denied to view group permission list" />
        <Loading title={"Group Permission List | " + import.meta.env.VITE_APP_NAME}
          message="Loading group permission list..." />
      </div>
    );
  }

  if (hasData) {
    return (
      <div>
        <PageMeta title="Group Permission List" description="Manage and view all group permission in the system" />

        <div id="page-container" className="mx-auto">
          <div id="content-container" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">

            <div id="content-header" className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("group.groupPermissionList")}: {groupName}</h2>

              <div className="flex items-center gap-3">
                <button
                  id="btn-search"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? '  Loading ...' : ''}
                </button>
                {hasPermission('group', 'create') && (
                  <button
                    id="btn-add"
                    onClick={handleAddGroupPermission}
                    disabled={refreshing}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
                  >
                    <UserPlusIcon className={`h-4 w-4`} />
                  </button>
                )}
              </div>
            </div> {/* content-header */}

            {/* content */}
            <div id="content" className="">
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
                          No group permission found.
                        </td>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        return (
                          <TableRow key={row.id}>
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

              <PermissionGuide />

            </div> {/* /content */}


          </div> {/* content-container */}
        </div> {/* page */}

        {/* Edit Permission Modal */}
        <Modal isOpen={!!editingPermission} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
          {editingPermission && (
            <EditPermissionModalContent
              permission={editingPermission}
              loading={editLoading}
              error={editError}
              onClose={handleCloseEditModal}
              onUpdate={handleUpdateGroupPermission}
              isEditing={true}
            />
          )}
        </Modal>

        {/* Add Permission Modal */}
        <Modal isOpen={isAddingPermission} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
          {isAddingPermission && (
            <EditPermissionModalContent
              permission={null}
              loading={editLoading}
              error={editError}
              onClose={handleCloseEditModal}
              onUpdate={handleCreateGroupPermission}
              isEditing={false}
            />
          )}
        </Modal>

      </div>
    )
  }

}

// Edit Permission Modal Content Component
interface EditPermissionModalProps {
  permission: GroupPermissionType | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate: (permission: Partial<GroupPermissionType>) => void;
  isEditing: boolean;
}

function EditPermissionModalContent({ permission, loading, error, onClose, onUpdate, isEditing }: EditPermissionModalProps) {
  const [formData, setFormData] = useState({
    name: permission?.name || '',
    resource: permission?.resource || '',
    action: permission?.action || '',
    order: permission?.order || 0,
  });

  // Check if all required fields are filled
  const isFormValid = formData.name.trim() && formData.resource.trim() && formData.action.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.name.trim()) {
      alert('Permission Name is required');
      return;
    }

    if (!formData.resource.trim()) {
      alert('Resource is required');
      return;
    }

    if (!formData.action.trim()) {
      alert('Action is required');
      return;
    }

    if (formData.order < 0) {
      alert('Order must be 0 or greater');
      return;
    }

    onUpdate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6">
      <div className="px-2 pr-14 flex-shrink-0">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? 'Edit Permission' : 'Add New Permission'}
        </h4>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {isEditing ? 'Update permission information and settings' : 'Create a new permission for this group'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5">
            <div className="col-span-1">
              <Label>Permission Name *</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-1">
              <Label>Resource *</Label>
              <Input
                type="text"
                name="resource"
                value={formData.resource}
                onChange={handleChange}
                placeholder="e.g., users, groups, configurations"
                required
              />
            </div>

            <div className="col-span-1">
              <Label>Action *</Label>
              <select
                name="action"
                value={formData.action}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Select Action</option>
                <option value="read">Read</option>
                <option value="create">Create</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
                <option value="manage">Manage</option>
              </select>
            </div>

            <div className="col-span-1">
              <Label>Order *</Label>
              <Input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
                required
              />
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
          <Button size="sm" type="submit" disabled={loading || !isFormValid}>
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Permission' : 'Create Permission')}
          </Button>
        </div>
      </form>
    </div>
  );
}

