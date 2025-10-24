import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Modal, Input, Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { DEPARTMENT_TABLE_COLUMNS, SUCCESS_MESSAGES } from '../utils/constants';
import { validateForm } from '../utils/helpers';
import { fetchDepartments, fetchDepartmentUserCounts, createDepartment, updateDepartment, deleteDepartment } from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';
import type { Department, DepartmentUserCount, CreateDepartmentForm, ValidationError, Action } from '../types';

type DepartmentWithUserCount = Department & { user_count: number };

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<DepartmentWithUserCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithUserCount | null>(null);

  const [createForm, setCreateForm] = useState<CreateDepartmentForm>({
    name: '',
    code: ''
  });
  
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadDepartmentsWithCounts = async () => {
    const [departmentsData, userCounts] = await Promise.all([
      fetchDepartments(),
      fetchDepartmentUserCounts()
    ]);
    
    const departmentsWithCounts = departmentsData.map((dept: Department) => {
      const userCount = userCounts.find((count: DepartmentUserCount) => count.departmentId === dept.id);
      return {
        ...dept,
        user_count: userCount ? userCount.userCount : 0
      };
    });
    
    setDepartments(departmentsWithCounts);
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        await loadDepartmentsWithCounts();
      } catch (error) {
        console.error('Error loading departments:', error);
        setDepartments([]);
        alert('Failed to load departments from database. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setCreateForm({ name: '', code: '' });
    setFormErrors([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (department: DepartmentWithUserCount) => {
    setSelectedDepartment(department);
    setCreateForm({ name: department.name, code: department.code });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: DepartmentWithUserCount) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const departmentActions: Action<DepartmentWithUserCount>[] = [];
  if (hasPermission('department:update')) {
    departmentActions.push({
      label: 'Edit',
      onClick: handleEdit,
      icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L17.5 3.5z" /></svg>,
    });
  }
  if (hasPermission('department:delete')) {
    departmentActions.push({
      label: 'Delete',
      onClick: handleDelete,
      icon: <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    });
  }

  const columns = DEPARTMENT_TABLE_COLUMNS.map(col => ({
    ...col,
    render: (value: any, row: DepartmentWithUserCount) => {
      if (col.key === 'user_count') {
        return row.user_count ?? 0;
      }
      return value;
    }
  }));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm.createDepartment(createForm);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      
      const departmentData = {
        name: createForm.name,
        code: createForm.code.toUpperCase()
      };
      
      await createDepartment(departmentData);
      
      await loadDepartmentsWithCounts();
      
      setIsCreateModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_CREATED);
    } catch (error) {
      console.error('Error creating department:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setFormErrors([{ field: 'code', message: 'Department code already exists' }]);
      } else {
        alert(`Failed to create department: ${errorMessage}`);
      }
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

    try {
      setSubmitLoading(true);
      
      const updateData = {
        name: createForm.name,
        code: createForm.code.toUpperCase()
      };
      
      await updateDepartment(selectedDepartment.id, updateData);
      
      await loadDepartmentsWithCounts();
      
      setIsEditModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_UPDATED);
    } catch (error) {
      console.error('Error updating department:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setFormErrors([{ field: 'code', message: 'Department code already exists' }]);
      } else {
        alert(`Failed to update department: ${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDepartment) return;

    try {
      setSubmitLoading(true);
      
      await deleteDepartment(selectedDepartment.id);

      await loadDepartmentsWithCounts();
      setIsDeleteModalOpen(false);
      alert(SUCCESS_MESSAGES.DEPARTMENT_DELETED);
    } catch (error) {
      console.error('Error deleting department:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Cannot delete department with assigned users')) {
        alert('Cannot delete department with assigned users. Please reassign or remove users first.');
      } else {
        alert(`Failed to delete department: ${errorMessage}`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formErrors.find(error => error.field === fieldName)?.message;
  };

  return (
    <ProtectedRoute>
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
              actions={departmentActions}
              onRowSelect={setSelectedDepartment}
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
    </ProtectedRoute>
  );
}