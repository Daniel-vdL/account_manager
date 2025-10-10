import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Modal, Input, Select, Badge, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { USER_TABLE_COLUMNS, USER_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, SUCCESS_MESSAGES } from '../utils/constants';
import { validateForm } from '../utils/helpers';
import { fetchUsers, fetchDepartments, createUser, updateUser, deleteUser, deactivateUser, permanentDeleteUser, reactivateUser } from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';
import type { User, Department, Role, CreateUserForm, UpdateUserForm, ValidationError } from '../types';

const mockRoles: Role[] = [
  { id: 1, name: 'Administrator', description: 'System Administrator' },
  { id: 2, name: 'Developer', description: 'Software Developer' },
  { id: 3, name: 'HR Manager', description: 'Human Resources Manager' },
  { id: 4, name: 'Analyst', description: 'Business Analyst' }
];

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    employee_number: '',
    name: '',
    email: '',
    department_id: 0,
    contract_type: 'full_time' as any,
    start_date: '',
    end_date: '',
    role_ids: []
  });
  
  const [updateForm, setUpdateForm] = useState<UpdateUserForm>({
    name: '',
    email: '',
    department_id: 0,
    status: 'active' as any
  });
  
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, departmentsData] = await Promise.all([
          fetchUsers(),
          fetchDepartments()
        ]);
        
        const formattedUsers: User[] = usersData.map((user: any) => ({
          id: user.id,
          employee_number: user.employeeNumber || user.employee_number || '',
          name: user.name || '',
          email: user.email || '',
          status: user.status as any || 'pending',
          department_id: user.departmentId || user.department_id || 0,
          department: user.department ? {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code
          } : undefined,
          created_at: typeof user.createdAt === 'string' ? user.createdAt : 
                     user.createdAt?.toISOString ? user.createdAt.toISOString() : 
                     user.created_at || new Date().toISOString(),
          updated_at: typeof user.updatedAt === 'string' ? user.updatedAt : 
                     user.updatedAt?.toISOString ? user.updatedAt.toISOString() : 
                     user.updated_at || new Date().toISOString(),
          roles: user.roles || [],
          employment: user.employment ? {
            id: user.employment.id,
            start_date: user.employment.startDate,
            end_date: user.employment.endDate,
            contract_type: user.employment.contractType
          } : undefined
        }));
        
        setUsers(formattedUsers);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setUsers([]);
        setDepartments([]);
        alert('Failed to load data from database. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = USER_TABLE_COLUMNS.map(col => ({
    ...col,
    render: (value: any, row: User) => {
      switch (col.key) {
        case 'status':
          const statusOption = USER_STATUS_OPTIONS.find(opt => opt.value === value);
          return (
            <Badge 
              variant={statusOption?.color === 'green' ? 'success' : 
                      statusOption?.color === 'red' ? 'danger' : 
                      statusOption?.color === 'yellow' ? 'warning' : 'default'}
            >
              {statusOption?.label}
            </Badge>
          );
        case 'created_at':
          return new Date(value).toLocaleDateString();
        case 'employment_dates':
          const employment = row.employment;
          if (!employment) return 'No employment data';
          
          if (row.status === 'pending' || (employment.start_date && new Date(employment.start_date) > new Date())) {
            return (
              <div className="text-sm">
                <div className="text-blue-600 font-medium">Starts:</div>
                <div>{employment.start_date ? new Date(employment.start_date).toLocaleDateString() : 'Not set'}</div>
              </div>
            );
          } else if (employment.end_date) {
            const endDate = new Date(employment.end_date);
            const today = new Date();
            const isExpired = endDate < today;
            
            return (
              <div className="text-sm">
                <div className={`font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                  {isExpired ? 'Expired:' : 'Ends:'}
                </div>
                <div className={isExpired ? 'text-red-600' : ''}>{endDate.toLocaleDateString()}</div>
              </div>
            );
          } else {
            return (
              <div className="text-sm text-gray-500">
                <div>Permanent</div>
                <div>No end date</div>
              </div>
            );
          }
        case 'actions':
          return (
            <div className="flex space-x-2">
              {hasPermission('user:update') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(row)}
                >
                  Edit
                </Button>
              )}
              {hasPermission('user:block') && row.status !== 'blocked' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBlock(row)}
                >
                  Block
                </Button>
              )}
              {hasPermission('user:block') && row.status === 'blocked' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblock(row)}
                >
                  Unblock
                </Button>
              )}
              {hasPermission('user:delete') && row.status !== 'inactive' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeactivate(row)}
                >
                  Deactivate
                </Button>
              )}
              {hasPermission('user:update') && row.status === 'inactive' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReactivate(row)}
                >
                  Reactivate
                </Button>
              )}
              {hasPermission('user:delete') && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handlePermanentDelete(row)}
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
    setCreateForm({
      employee_number: '',
      name: '',
      email: '',
      department_id: 0,
      contract_type: 'full_time' as any,
      start_date: '',
      end_date: '',
      role_ids: []
    });
    setFormErrors([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setUpdateForm({
      name: user.name,
      email: user.email,
      department_id: user.department_id,
      status: user.status
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setIsDeactivateModalOpen(true);
  };

  const handlePermanentDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleReactivate = async (user: User) => {
    try {
      setLoading(true);
      
      await reactivateUser(user.id);
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: 'active' as any } : u
      ));
      
      alert('User reactivated successfully');
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = (user: User) => {
    setSelectedUser(user);
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const handleBlockSubmit = async () => {
    if (!selectedUser || !blockReason.trim()) {
      alert('Please provide a reason for blocking this user');
      return;
    }

    try {
      setSubmitLoading(true);
      
      await updateUser(selectedUser.id, { status: 'blocked', reason: blockReason });
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'blocked' as any } : u
      ));
      
      setIsBlockModalOpen(false);
      setBlockReason('');
      alert(SUCCESS_MESSAGES.USER_BLOCKED);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUnblock = async (user: User) => {
    try {
      setLoading(true);
      
      await updateUser(user.id, { status: 'active' });
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: 'active' as any } : u
      ));
      
      alert(SUCCESS_MESSAGES.USER_UNBLOCKED);
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm.createUser(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      

      
      const userData = {
        employeeNumber: createForm.employee_number,
        name: createForm.name,
        email: createForm.email,
        password: 'temp123',
        departmentId: createForm.department_id || undefined,
        startDate: createForm.start_date,
        endDate: createForm.end_date || undefined,
        contractType: createForm.contract_type
      };
      
      const response = await createUser(userData);
      
      const updatedUsers = await fetchUsers();
      const formattedUsers: User[] = updatedUsers.map((user: any) => ({
        id: user.id,
        employee_number: user.employeeNumber || user.employee_number || '',
        name: user.name || '',
        email: user.email || '',
        status: user.status as any || 'pending',
        department_id: user.departmentId || user.department_id || 0,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code
        } : undefined,
        created_at: typeof user.createdAt === 'string' ? user.createdAt : 
                   user.createdAt?.toISOString ? user.createdAt.toISOString() : 
                   user.created_at || new Date().toISOString(),
        updated_at: typeof user.updatedAt === 'string' ? user.updatedAt : 
                   user.updatedAt?.toISOString ? user.updatedAt.toISOString() : 
                   user.updated_at || new Date().toISOString(),
        roles: []
      }));
      
      setUsers(formattedUsers);
      setIsCreateModalOpen(false);
      alert(SUCCESS_MESSAGES.USER_CREATED);
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      

      
      const updateData = {
        name: updateForm.name,
        email: updateForm.email,
        departmentId: updateForm.department_id || undefined,
        status: updateForm.status
      };
      
      await updateUser(selectedUser.id, updateData);
      
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              name: updateForm.name,
              email: updateForm.email,
              department_id: updateForm.department_id,
              department: departments.find(d => d.id === updateForm.department_id),
              status: updateForm.status,
              updated_at: new Date().toISOString()
            }
          : u
      ));
      
      setIsEditModalOpen(false);
      alert(SUCCESS_MESSAGES.USER_UPDATED);
    } catch (error) {
      alert('Failed to update user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      
      await permanentDeleteUser(selectedUser.id);
      
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setIsDeleteModalOpen(false);
      alert('User permanently deleted successfully');
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      alert(`Failed to permanently delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivateSubmit = async () => {
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      
      await deactivateUser(selectedUser.id);
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'inactive' as any } : u
      ));
      
      setIsDeactivateModalOpen(false);
      alert('User deactivated successfully');
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formErrors.find(error => error.field === fieldName)?.message;
  };

  return (
    <ProtectedRoute>
      <Layout title="User Management">
      <div className="space-y-6 max-w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          
          {hasPermission('user:create') && (
            <Button onClick={handleCreate}>
              Add User
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredUsers}
              columns={columns}
              loading={loading}
              emptyMessage="No users found"
              pageSize={15}
            />
          </CardContent>
        </Card>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User"
          size="lg"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSubmit}
                loading={submitLoading}
              >
                Create User
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Employee Number"
                value={createForm.employee_number}
                onChange={(e) => setCreateForm({ ...createForm, employee_number: e.target.value })}
                error={getFieldError('employee_number')}
                required
              />
              <Input
                label="Full Name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                error={getFieldError('name')}
                required
              />
            </div>
            
            <Input
              label="Email Address"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              error={getFieldError('email')}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Department"
                value={createForm.department_id}
                onChange={(e) => setCreateForm({ ...createForm, department_id: Number(e.target.value) })}
                options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
                placeholder="Select department"
                error={getFieldError('department_id')}
                required
              />
              <Select
                label="Contract Type"
                value={createForm.contract_type}
                onChange={(e) => setCreateForm({ ...createForm, contract_type: e.target.value as any })}
                options={CONTRACT_TYPE_OPTIONS}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                error={getFieldError('start_date')}
                required
              />
              <Input
                label="End Date (Optional)"
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                error={getFieldError('end_date')}
                placeholder="Leave empty for permanent contract"
              />
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateSubmit}
                loading={submitLoading}
              >
                Update User
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={updateForm.name}
              onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
              required
            />
            
            <Input
              label="Email Address"
              type="email"
              value={updateForm.email}
              onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Department"
                value={updateForm.department_id}
                onChange={(e) => setUpdateForm({ ...updateForm, department_id: Number(e.target.value) })}
                options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
                required
              />
              <Select
                label="Status"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as any })}
                options={USER_STATUS_OPTIONS}
                required
              />
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Permanently Delete User"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteSubmit}
                loading={submitLoading}
              >
                Permanently Delete User
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to <strong>permanently delete</strong> <strong>{selectedUser?.name}</strong>? 
            This action cannot be undone and will completely remove the user and all associated data from the database.
          </p>
        </Modal>

        <Modal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          title="Deactivate User"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={handleDeactivateSubmit}
                loading={submitLoading}
              >
                Deactivate User
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to deactivate <strong>{selectedUser?.name}</strong>? 
            This will set their status to inactive but keep their data in the system.
          </p>
        </Modal>

        <Modal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setBlockReason('');
          }}
          title="Block User"
          footer={
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setBlockReason('');
                }}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleBlockSubmit}
                loading={submitLoading}
                disabled={!blockReason.trim()}
              >
                Block User
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to block <strong>{selectedUser?.name}</strong>? 
              This will prevent them from accessing the system.
            </p>
            <div>
              <label htmlFor="blockReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for blocking <span className="text-red-500">*</span>
              </label>
              <textarea
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Please provide a reason for blocking this user..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                rows={3}
                required
              />
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}