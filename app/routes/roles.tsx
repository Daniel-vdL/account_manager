import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Modal, Input, Card, CardContent, Select } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_TABLE_COLUMNS, SUCCESS_MESSAGES } from '../utils/constants';
import { validateForm } from '../utils/helpers';
import { 
  fetchRoles, 
  fetchPermissions, 
  createRole, 
  updateRole, 
  deleteRole,
  fetchUsers,
  assignRoleToUser,
  removeRoleFromUser
} from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';
import type { Role, Permission, User, ValidationError } from '../types';

interface CreateRoleForm {
  name: string;
  description: string;
  permission_ids: number[];
}

interface RoleWithCounts extends Role {
  permission_count?: number;
  user_count?: number;
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<RoleWithCounts[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithCounts | null>(null);

  const [createForm, setCreateForm] = useState<CreateRoleForm>({
    name: '',
    description: '',
    permission_ids: []
  });
  
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  const loadRoles = async () => {
    const rolesData = await fetchRoles();
    console.log('Loaded roles data:', rolesData);
    setRoles(rolesData);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rolesData, permissionsData, usersData] = await Promise.all([
          fetchRoles(),
          fetchPermissions(),
          fetchUsers()
        ]);
        
        console.log('Loaded roles data:', rolesData);
        console.log('Sample user with roles:', usersData?.[0]);
        
        setPermissions(permissionsData);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading roles data:', error);
        setRoles([]);
        alert('Failed to load roles from database. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = ROLE_TABLE_COLUMNS.map(col => ({
    ...col,
    render: (value: any, row: RoleWithCounts) => {
      switch (col.key) {
        case 'permission_count':
          return row.permission_count ?? 0;
        case 'user_count':
          return row.user_count ?? 0;
        case 'actions':
          return (
            <div className="flex space-x-2">
              {hasPermission('role:update') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(row)}
                >
                  Edit
                </Button>
              )}
              {hasPermission('role:assign') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignUsers(row)}
                >
                  Assign
                </Button>
              )}
              {hasPermission('role:delete') && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(row)}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        default:
          return value;
      }
    }
  }));

  const handleCreate = () => {
    setCreateForm({ name: '', description: '', permission_ids: [] });
    setFormErrors([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role: RoleWithCounts) => {
    setSelectedRole(role);
    setCreateForm({ 
      name: role.name, 
      description: role.description,
      permission_ids: role.permissions?.map(p => p.id) || []
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (role: RoleWithCounts) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleAssignUsers = (role: RoleWithCounts) => {
    setSelectedRole(role);
    setIsAssignModalOpen(true);
  };

  const handleRoleAssignment = async (userId: number, hasRole: boolean) => {
    if (!selectedRole) return;
    
    try {
      setSubmitLoading(true);
      
      if (hasRole) {
        await removeRoleFromUser(userId, selectedRole.id);
      } else {
        await assignRoleToUser(userId, selectedRole.id);
      }
      
      const [rolesData, usersData] = await Promise.all([
        fetchRoles(),
        fetchUsers()
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      
    } catch (error) {
      console.error('Error updating role assignment:', error);
      alert('Failed to update role assignment. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm.createRole(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      
      await createRole(createForm);
      await loadRoles();
      
      setIsCreateModalOpen(false);
      alert(SUCCESS_MESSAGES.ROLE_CREATED);
    } catch (error) {
      console.error('Error creating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setFormErrors([{ field: 'name', message: 'Role name already exists' }]);
      } else {
        alert(`Failed to create role: ${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) return;

    const errors = validateForm.createRole(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      
      await updateRole(selectedRole.id, createForm);
      await loadRoles();
      
      setIsEditModalOpen(false);
      alert(SUCCESS_MESSAGES.ROLE_UPDATED);
    } catch (error) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setFormErrors([{ field: 'name', message: 'Role name already exists' }]);
      } else {
        alert(`Failed to update role: ${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedRole) return;

    try {
      setSubmitLoading(true);
      
      await deleteRole(selectedRole.id);
      await loadRoles();
      
      setIsDeleteModalOpen(false);
      alert(SUCCESS_MESSAGES.ROLE_DELETED);
    } catch (error) {
      console.error('Error deleting role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Cannot delete role with assigned users')) {
        alert('Cannot delete role with assigned users. Please remove users from this role first.');
      } else {
        alert(`Failed to delete role: ${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setCreateForm(prev => ({
      ...prev,
      permission_ids: checked 
        ? [...prev.permission_ids, permissionId]
        : prev.permission_ids.filter(id => id !== permissionId)
    }));
  };

  const getFieldError = (fieldName: string) => {
    return formErrors.find(error => error.field === fieldName)?.message;
  };

  if (!hasPermission('role:read')) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">You do not have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 max-w-full">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage system roles and their permissions
              </p>
            </div>
            {hasPermission('role:create') && activeTab === 'roles' && (
              <Button onClick={handleCreate}>
                Create Role
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Roles ({roles.length})
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'permissions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Permissions ({permissions.length})
              </button>
            </nav>
          </div>

          {/* Roles Tab Content */}
          {activeTab === 'roles' && (
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <DataTable
                  data={filteredRoles}
                  columns={columns}
                  loading={loading}
                  emptyMessage="No roles found"
                  pageSize={15}
                />
              </CardContent>
            </Card>
          )}

          {/* Permissions Tab Content */}
          {activeTab === 'permissions' && (
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <DataTable
                  data={permissions.map((permission: Permission) => ({
                    ...permission,
                    roles_using: roles.filter(role => 
                      role.permissions?.some(p => p.id === permission.id)
                    ).map(role => role.name).join(', ') || 'None'
                  }))}
                  columns={[
                    { 
                      key: 'name', 
                      label: 'Permission Name', 
                      sortable: true, 
                      responsiveWidth: '25%',
                      priority: 'high' as const
                    },
                    { 
                      key: 'action', 
                      label: 'Action', 
                      sortable: true, 
                      responsiveWidth: '15%',
                      priority: 'high' as const
                    },
                    { 
                      key: 'description', 
                      label: 'Description', 
                      sortable: false, 
                      responsiveWidth: '35%',
                      priority: 'medium' as const,
                      responsive: { hideOnMobile: true }
                    },
                    { 
                      key: 'roles_using', 
                      label: 'Used by Roles', 
                      sortable: false, 
                      responsiveWidth: '25%',
                      priority: 'low' as const,
                      responsive: { hideOnMobile: true, hideOnTablet: true }
                    }
                  ]}
                  pageSize={15}
                  loading={loading}
                  emptyMessage="No permissions found"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Role"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                error={getFieldError('name')}
                placeholder="Enter role name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter role description"
              />
              {getFieldError('description') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions * ({createForm.permission_ids.length} selected)
              </label>
              <div className="space-x-2 mb-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateForm({
                    ...createForm,
                    permission_ids: permissions.map(p => p.id)
                  })}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateForm({
                    ...createForm,
                    permission_ids: []
                  })}
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-3">
                {Object.entries(
                  permissions.reduce((groups: { [key: string]: Permission[] }, permission) => {
                    const category = permission.action.split(':')[0] || 'other';
                    if (!groups[category]) groups[category] = [];
                    groups[category].push(permission);
                    return groups;
                  }, {})
                ).map(([category, perms]) => (
                  <div key={category} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {category} Permissions
                    </h4>
                    {perms.map((permission) => (
                      <label key={permission.id} className="flex items-start space-x-3 mb-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={createForm.permission_ids.includes(permission.id)}
                          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {permission.name}
                          </span>
                          {permission.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {permission.description}
                            </p>
                          )}
                          <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                            {permission.action}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              {getFieldError('permission_ids') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('permission_ids')}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitLoading}>
                Create Role
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Role"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                error={getFieldError('name')}
                placeholder="Enter role name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter role description"
              />
              {getFieldError('description') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions *
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={createForm.permission_ids.includes(permission.id)}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {permission.name} - {permission.action}
                    </span>
                  </label>
                ))}
              </div>
              {getFieldError('permission_ids') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('permission_ids')}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitLoading}>
                Update Role
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Role"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the role "{selectedRole?.name}"? 
              This action cannot be undone and will remove the role from all assigned users.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSubmit}
                loading={submitLoading}
              >
                Delete Role
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedUserIds([]);
            setAssignSearchTerm('');
          }}
          title={`Manage Users for "${selectedRole?.name}" Role`}
        >
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search users..."
                value={assignSearchTerm}
                onChange={(e) => setAssignSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {users
                .filter(user =>
                  user.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(assignSearchTerm.toLowerCase())
                )
                .map(user => {
                  const hasRole = user.roles?.some(role => role.role_id === selectedRole?.id) ?? false;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          {user.department?.name || 'No Department'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasRole && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Has Role
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={hasRole ? "danger" : "primary"}
                          onClick={() => handleRoleAssignment(user.id, hasRole)}
                        >
                          {hasRole ? 'Remove' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedUserIds([]);
                  setAssignSearchTerm('');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}