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
import { User } from "../../types/user";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { ArrowPathIcon as RefreshIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../../context/AuthContext";
import ErrorState from "../../components/common/ErrorState";
import { formatDate } from "../../utils";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Switch from "../../components/form/switch/Switch";
import { useI18n } from "../../context/I18nContext";
import { useClient } from "../../context/ClientContext";
import { xfetch, setXFetchContext } from "../../services";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<User>();

export default function UserListPage() {
  const { t } = useI18n();
  const { selectedClient } = useClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { token, isAuthenticated, user: currentUser } = useAuth();

  const backToHome = () => {
    window.location.href = "/";
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsAddingUser(false);
    setEditError(null);
  };

  const handleAddUser = () => {
    setIsAddingUser(true);
    setEditError(null);
  };

  const fetchUsers = async () => {
    if (!isAuthenticated || !token) {
      setError("You must be logged in to view users");
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
      const url = new URL(`${API_BASE_URL}/user`);
      if (searchQuery) {
        url.searchParams.append('q', searchQuery);
      }

      const response = await xfetch(url.toString(), {
        skipCSRF: true, // GET request tidak memerlukan CSRF token
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      if (data.success && data.data && data.data.users) {
        // Transform the API response to match our User type
        const transformedUsers = data.data.users.map((user: any) => ({
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          alias: user.alias,
          description: user.description,
          last_seen: user.lastSeen,
          ip: user.ip || 'N/A',
          status_id: user.statusId,
          created_at: new Date(user.createdAt),
          updated_at: new Date(user.updatedAt || user.createdAt),
        }));
        setUsers(transformedUsers);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => {
    setRefreshing(true);
    fetchUsers().finally(() => {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay for better UX
    });
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    if (!editingUser || !token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/user/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          alias: updatedUser.alias,
          description: updatedUser.description,
          statusId: updatedUser.status_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      if (data.success) {
        // Update the user in the local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === editingUser.id
              ? { ...user, ...updatedUser, updated_at: new Date() }
              : user
          )
        );
        handleCloseEditModal();
        toast.success(t('user.updateSuccess'));
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateUser = async (newUser: Partial<User>) => {
    if (!token) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await xfetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        body: JSON.stringify({
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          phone: newUser.phone,
          alias: newUser.alias,
          description: newUser.description,
          send_email: newUser.send_email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      if (data.success) {
        // Transform the API response to match our User type and add to local state
        const createdUser: User = {
          id: data.data.id,
          first_name: data.data.firstName,
          last_name: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone,
          alias: data.data.alias,
          description: data.data.description,
          last_seen: null,
          ip: 'N/A',
          status_id: data.data.statusId,
          created_at: new Date(data.data.createdAt),
          updated_at: new Date(data.data.createdAt),
        };

        setUsers(prevUsers => [createdUser, ...prevUsers]);
        handleCloseEditModal();
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setEditError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setEditLoading(false);
    }
  };

  const columns = [
    // columnHelper.accessor("id", {
    //   header: "ID",
    // }),
    columnHelper.accessor("first_name", {
      header: t("user.firstName"),
    }),
    columnHelper.accessor("last_name", {
      header: t("user.lastName"),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => {
        const email = info.getValue();
        return (
          <span className="whitespace-nowrap">
            {email}
          </span>
        );
      }
    }),
    columnHelper.accessor("phone", {
      header: t("user.phone"),
    }),
    columnHelper.accessor("alias", {
      header: "Alias",
    }),
    columnHelper.accessor("last_seen", {
      header: t("user.lastSeen"),
      size: 140,
      minSize: 140,
      cell: (info) => {
        const lastSeen = info.getValue();
        if (!lastSeen) return "N/A";

        return (
          <span className="whitespace-nowrap">
            {formatDate(lastSeen)}
          </span>
        );
      },
    }),
    columnHelper.accessor("ip", {
      header: "IP",
      cell: (info) => {
        const ip = info.getValue();
        return (
          <span className="whitespace-nowrap">
            {ip}
          </span>
        );
      }
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
        const user = info.row.original;

        const handleEdit = () => {
          handleEditUser(user);
        };

        const handleDelete = async () => {
          if (!confirm(t('user.confirmDelete'))) return;

          try {
            const response = await xfetch(`${API_BASE_URL}/user/${user.id}`, {
              method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok && data.success) {
              // Remove user from local state
              setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
            } else {
              alert(data.message || 'Failed to delete user');
            }
          } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
          }
        };

        // Check if this user is the currently logged in user
        const isCurrentUser = currentUser && user.id === currentUser.id;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Edit User"
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
            {!isCurrentUser && (
              <button
                onClick={handleDelete}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="Delete User"
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
    // columnHelper.accessor("created_at", {
    //   header: "Created At",
    //   cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    // }),
    // columnHelper.accessor("updated_at", {
    //   header: "Updated At",
    //   cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    // }),
  ];

  useEffect(() => {
    // Set context untuk xfetch
    setXFetchContext({
      token,
      selectedClient,
    });
    fetchUsers();
  }, [selectedClient, token, isAuthenticated]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title={"User List | " + import.meta.env.VITE_APP_NAME}
          message="Loading user list..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <PageMeta title="User List" description="Error loading user list" />
        <PageBreadcrumb pageTitle="User List" />
        <ErrorState
          title="Error Loading User List"
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
        <PageMeta title="User List" description="Authentication required to view user list" />
        <PageBreadcrumb pageTitle="User List" />
        <div className="flex items-center justify-center p-8">
          <div className="text-yellow-500 dark:text-yellow-400">
            Please log in to view the user list.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="User List | - "
        description="Manage and view all users in the system" />

      <div id="userlist-page" className="mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("user.userList")}</h2>
            <div className="flex items-center gap-3">
              <button
                id="btn-search"
                onClick={refreshUsers}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Searching...' : ''}
              </button>
              <button
                id="btn-add"
                onClick={handleAddUser}
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
                        No users found.
                      </td>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const user = row.original;
                      const isPending = user.status_id === 2;
                      const isSuspended = user.status_id === 3;
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
      </div> {/* userlist-page */}

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {editingUser && (
          <EditUserModalContent
            user={editingUser}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleUpdateUser}
            isEditing={true}
          />
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={isAddingUser} onClose={handleCloseEditModal} className="max-w-[600px] flex flex-col">
        {isAddingUser && (
          <EditUserModalContent
            user={null}
            loading={editLoading}
            error={editError}
            onClose={handleCloseEditModal}
            onUpdate={handleCreateUser}
            isEditing={false}
          />
        )}
      </Modal>

    </div>
  );
}

// Edit User Modal Content Component
interface EditUserModalProps {
  user: User | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate: (user: Partial<User>) => void;
  isEditing: boolean;
}

function EditUserModalContent({ user, loading, error, onClose, onUpdate, isEditing }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    alias: user?.alias || '',
    description: user?.description || '',
    status_id: user?.status_id || 0,
    send_email: false,
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
          {isEditing ? 'Edit User' : 'Add New User'}
        </h4>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {isEditing ? 'Update user information and settings' : 'Create a new user account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            <div className="col-span-2 lg:col-span-1">
              <Label>First Name</Label>
              <Input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2 lg:col-span-1">
              <Label>Last Name</Label>
              <Input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2 lg:col-span-1">
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isEditing}
                required
              />
            </div>

            <div className="col-span-2 lg:col-span-1">
              <Label>Phone</Label>
              <Input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2 lg:col-span-1">
              <Label>Alias</Label>
              <Input
                type="text"
                name="alias"
                value={formData.alias}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2 lg:col-span-1">
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

            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <Switch
                name="send_email"
                label="Send Email Notification"
                defaultChecked={formData.send_email}
                onChange={(checked) => setFormData(prev => ({ ...prev, send_email: checked }))}
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
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update User' : 'Create User')}
          </Button>
        </div>
      </form>
    </div>
  );
} ''