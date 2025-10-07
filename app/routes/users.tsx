import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Modal, Input, Select, Badge, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { USER_TABLE_COLUMNS, USER_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, SUCCESS_MESSAGES } from '../utils/constants';
import { validateForm } from '../utils/helpers';
import type { User, Department, Role, CreateUserForm, UpdateUserForm, ValidationError } from '../types';

const mockUsers: User[] = [
  {
    id: 1,
    employee_number: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    status: 'active' as any,
    department_id: 1,
    department: { id: 1, name: 'Engineering', code: 'ENG' },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    roles: [
      { id: 1, user_id: 1, role_id: 2, role: { id: 2, name: 'Developer', description: 'Software Developer' }, valid_from: '2024-01-15', granted_by: 1 }
    ]
  },
  {
    id: 2,
    employee_number: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    status: 'active' as any,
    department_id: 2,
    department: { id: 2, name: 'Human Resources', code: 'HR' },
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z',
    roles: [
      { id: 2, user_id: 2, role_id: 3, role: { id: 3, name: 'HR Manager', description: 'Human Resources Manager' }, valid_from: '2024-01-10', granted_by: 1 }
    ]
  }
];

const mockDepartments: Department[] = [
  { id: 1, name: 'Engineering', code: 'ENG' },
  { id: 2, name: 'Human Resources', code: 'HR' },
  { id: 3, name: 'Finance', code: 'FIN' },
  { id: 4, name: 'Marketing', code: 'MKT' }
];

const mockRoles: Role[] = [
  { id: 1, name: 'Administrator', description: 'System Administrator' },
  { id: 2, name: 'Developer', description: 'Software Developer' },
  { id: 3, name: 'HR Manager', description: 'Human Resources Manager' },
  { id: 4, name: 'Analyst', description: 'Business Analyst' }
];

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    employee_number: '',
    name: '',
    email: '',
    department_id: 0,
    contract_type: 'full_time' as any,
    start_date: '',
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
              {hasPermission('user:delete') && (
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
    setCreateForm({
      employee_number: '',
      name: '',
      email: '',
      department_id: 0,
      contract_type: 'full_time' as any,
      start_date: '',
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

  const handleBlock = async (user: User) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: 'blocked' as any } : u
      ));
      
      alert(SUCCESS_MESSAGES.USER_BLOCKED);
    } catch (error) {
      alert('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (user: User) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: 'active' as any } : u
      ));
      
      alert(SUCCESS_MESSAGES.USER_UNBLOCKED);
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: users.length + 1,
        employee_number: createForm.employee_number,
        name: createForm.name,
        email: createForm.email,
        status: 'active' as any,
        department_id: createForm.department_id,
        department: departments.find(d => d.id === createForm.department_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        roles: createForm.role_ids.map(roleId => ({
          id: Date.now() + roleId,
          user_id: users.length + 1,
          role_id: roleId,
          role: roles.find(r => r.id === roleId),
          valid_from: createForm.start_date,
          granted_by: 1
        }))
      };

      setUsers([...users, newUser]);
      setIsCreateModalOpen(false);
      alert(SUCCESS_MESSAGES.USER_CREATED);
    } catch (error) {
      alert('Failed to create user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      alert(SUCCESS_MESSAGES.USER_DELETED);
    } catch (error) {
      alert('Failed to delete user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formErrors.find(error => error.field === fieldName)?.message;
  };

  return (
    <Layout title="User Management">
      <div className="space-y-6">
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
            
            <Input
              label="Start Date"
              type="date"
              value={createForm.start_date}
              onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
              error={getFieldError('start_date')}
              required
            />
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
          title="Delete User"
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
                Delete User
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? 
            This action cannot be undone and will remove all associated data.
          </p>
        </Modal>
      </div>
    </Layout>
  );
}