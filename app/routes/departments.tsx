import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Modal, Input, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { DEPARTMENT_TABLE_COLUMNS, SUCCESS_MESSAGES } from '../utils/constants';
import { validateForm } from '../utils/helpers';
import type { Department, CreateDepartmentForm, ValidationError } from '../types';

const mockDepartments: Department[] = [
  { id: 1, name: 'Engineering', code: 'ENG' },
  { id: 2, name: 'Human Resources', code: 'HR' },
  { id: 3, name: 'Finance', code: 'FIN' },
  { id: 4, name: 'Marketing', code: 'MKT' },
  { id: 5, name: 'Operations', code: 'OPS' },
  { id: 6, name: 'Sales', code: 'SALES' }
];

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [createForm, setCreateForm] = useState<CreateDepartmentForm>({
    name: '',
    code: ''
  });
  
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = DEPARTMENT_TABLE_COLUMNS.map(col => ({
    ...col,
    render: (value: any, row: Department) => {
      switch (col.key) {
        case 'user_count':
          const userCounts: Record<number, number> = { 1: 45, 2: 12, 3: 8, 4: 15, 5: 23, 6: 18 };
          return userCounts[row.id] || 0;
        case 'actions':
          return (
            <div className="flex space-x-2">
              {hasPermission('department:update') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(row)}
                >
                  Edit
                </Button>
              )}
              {hasPermission('department:delete') && (
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
    setCreateForm({ name: '', code: '' });
    setFormErrors([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setCreateForm({ name: department.name, code: department.code });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm.createDepartment(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (departments.some(d => d.code.toLowerCase() === createForm.code.toLowerCase())) {
      setFormErrors([{ field: 'code', message: 'Department code already exists' }]);
      return;
    }

    try {
      setSubmitLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDepartment: Department = {
        id: Math.max(...departments.map(d => d.id)) + 1,
        name: createForm.name,
        code: createForm.code.toUpperCase()
      };

      setDepartments([...departments, newDepartment]);
      setIsCreateModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_CREATED);
    } catch (error) {
      alert('Failed to create department');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment) return;

    const errors = validateForm.createDepartment(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (departments.some(d => d.id !== selectedDepartment.id && d.code.toLowerCase() === createForm.code.toLowerCase())) {
      setFormErrors([{ field: 'code', message: 'Department code already exists' }]);
      return;
    }

    try {
      setSubmitLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDepartments(departments.map(d => 
        d.id === selectedDepartment.id 
          ? { ...d, name: createForm.name, code: createForm.code.toUpperCase() }
          : d
      ));
      
      setIsEditModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_UPDATED);
    } catch (error) {
      alert('Failed to update department');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDepartment) return;

    try {
      setSubmitLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDepartments(departments.filter(d => d.id !== selectedDepartment.id));
      setIsDeleteModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_DELETED);
    } catch (error) {
      alert('Failed to delete department');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formErrors.find(error => error.field === fieldName)?.message;
  };

  return (
    <Layout title="Department Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search departments..."
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
          
          {hasPermission('department:create') && (
            <Button onClick={handleCreate}>
              Add Department
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredDepartments}
              columns={columns}
              loading={loading}
              emptyMessage="No departments found"
            />
          </CardContent>
        </Card>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Department"
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
                Create Department
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              error={getFieldError('name')}
              placeholder="e.g., Human Resources"
              required
            />
            
            <Input
              label="Department Code"
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
              error={getFieldError('code')}
              placeholder="e.g., HR"
              description="2-10 uppercase letters/numbers"
              required
            />
          </form>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Department"
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
                Update Department
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              error={getFieldError('name')}
              required
            />
            
            <Input
              label="Department Code"
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
              error={getFieldError('code')}
              description="2-10 uppercase letters/numbers"
              required
            />
          </form>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Department"
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
                Delete Department
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete the <strong>{selectedDepartment?.name}</strong> department? 
            This action cannot be undone and may affect users assigned to this department.
          </p>
        </Modal>
      </div>
    </Layout>
  );
}