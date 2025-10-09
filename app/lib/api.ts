export async function fetchUsers() {
  try {
    const response = await fetch('/api/data?endpoint=users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function fetchUserById(id: number) {
  try {
    const response = await fetch(`/api/data?endpoint=users&id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(userData: {
  employeeNumber: string;
  name: string;
  email: string;
  password: string;
  departmentId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  contractType?: string;
}) {
  try {
    const response = await fetch('/api/data?endpoint=users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id: number, userData: {
  name?: string;
  email?: string;
  employeeNumber?: string;
  departmentId?: number;
  status?: string;
  password?: string;
  reason?: string;
}) {
  try {
    const response = await fetch('/api/data?endpoint=users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...userData }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deactivateUser(userId: number) {
  try {
    const response = await fetch('/api/data?endpoint=users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, permanent: false }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to deactivate user');
    }
    
    return data;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
}

export async function permanentDeleteUser(userId: number) {
  try {
    const response = await fetch('/api/data?endpoint=users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, permanent: true }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to permanently delete user');
    }
    
    return data;
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    throw error;
  }
}

export async function deleteUser(userId: number) {
  return deactivateUser(userId);
}

export async function reactivateUser(userId: number) {
  try {
    const response = await updateUser(userId, { status: 'active' });
    return response;
  } catch (error) {
    console.error('Error reactivating user:', error);
    throw error;
  }
}

export async function fetchDepartments() {
  try {
    const response = await fetch('/api/data?endpoint=departments');
    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }
    const data = await response.json();
    return data.departments || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

export async function createDepartment(departmentData: {
  name: string;
  code: string;
}) {
  try {
    const response = await fetch('/api/data?endpoint=departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create department');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

export async function updateDepartment(id: number, departmentData: {
  name?: string;
  code?: string;
}) {
  try {
    const response = await fetch('/api/data?endpoint=departments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...departmentData }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update department');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
}

export async function deleteDepartment(departmentId: number) {
  try {
    const response = await fetch('/api/data?endpoint=departments', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ departmentId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete department');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
}

export async function authenticateUser(credentials: {
  email: string;
  password: string;
}) {
  try {
    const response = await fetch('/api/data?endpoint=auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

export async function fetchDashboardStats() {
  try {
    const response = await fetch('/api/data?endpoint=dashboard-stats');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    const data = await response.json();
    return data.stats || {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      totalDepartments: 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      totalDepartments: 0
    };
  }
}

export async function fetchDepartmentUserCounts() {
  try {
    const response = await fetch('/api/data?endpoint=department-user-counts');
    if (!response.ok) {
      throw new Error('Failed to fetch department user counts');
    }
    const data = await response.json();
    return data.departmentCounts || [];
  } catch (error) {
    console.error('Error fetching department user counts:', error);
    return [];
  }
}

export async function fetchUserRoles(userId: number) {
  try {
    const response = await fetch(`/api/data?endpoint=user-roles&id=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user roles');
    }
    const data = await response.json();
    return data.roles || [];
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

export async function fetchRecentActivity(limit: number = 10) {
  try {
    const response = await fetch(`/api/data?endpoint=recent-activity&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }
    const data = await response.json();
    return data.activity || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export async function fetchSecurityAlerts() {
  try {
    const response = await fetch('/api/data?endpoint=security-alerts');
    if (!response.ok) {
      throw new Error('Failed to fetch security alerts');
    }
    const data = await response.json();
    return data.alerts || [];
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return [];
  }
}