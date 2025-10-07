import type { ValidationError, SecurityConfig } from '../types';
import { UserStatus } from '../types';

export const SECURITY_CONFIG: SecurityConfig = {
  sessionTimeout: 30, // 30 minutes
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireSpecialChars: true,
  csrfTokenName: 'X-CSRF-Token'
};

export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  employeeNumber: (empNum: string): boolean => {
    const empRegex = /^[A-Za-z0-9]{3,20}$/;
    return empRegex.test(empNum);
  },

  name: (name: string): boolean => {
    const nameRegex = /^[A-Za-z\s\-']{2,100}$/;
    return nameRegex.test(name.trim());
  },

  departmentCode: (code: string): boolean => {
    const codeRegex = /^[A-Z0-9]{2,10}$/;
    return codeRegex.test(code);
  },

  password: (password: string): boolean => {
    if (password.length < SECURITY_CONFIG.passwordMinLength) return false;
    if (SECURITY_CONFIG.requireSpecialChars) {
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      return hasSpecial && hasUpper && hasLower && hasNumber;
    }
    return true;
  }
};

export const validateForm = {
  createUser: (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!data.employee_number?.trim()) {
      errors.push({ field: 'employee_number', message: 'Employee number is required' });
    } else if (!validation.employeeNumber(data.employee_number)) {
      errors.push({ field: 'employee_number', message: 'Invalid employee number format' });
    }

    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (!validation.name(data.name)) {
      errors.push({ field: 'name', message: 'Invalid name format' });
    }

    if (!data.email?.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!validation.email(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!data.department_id) {
      errors.push({ field: 'department_id', message: 'Department is required' });
    }

    if (!data.start_date) {
      errors.push({ field: 'start_date', message: 'Start date is required' });
    }

    return errors;
  },

  createDepartment: (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'Department name is required' });
    } else if (data.name.length < 2 || data.name.length > 100) {
      errors.push({ field: 'name', message: 'Department name must be 2-100 characters' });
    }

    if (!data.code?.trim()) {
      errors.push({ field: 'code', message: 'Department code is required' });
    } else if (!validation.departmentCode(data.code)) {
      errors.push({ field: 'code', message: 'Invalid department code format' });
    }

    return errors;
  },

  createRole: (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'Role name is required' });
    } else if (data.name.length < 2 || data.name.length > 50) {
      errors.push({ field: 'name', message: 'Role name must be 2-50 characters' });
    }

    if (!data.description?.trim()) {
      errors.push({ field: 'description', message: 'Role description is required' });
    } else if (data.description.length > 255) {
      errors.push({ field: 'description', message: 'Description must be less than 255 characters' });
    }

    if (!data.permission_ids || data.permission_ids.length === 0) {
      errors.push({ field: 'permission_ids', message: 'At least one permission is required' });
    }

    return errors;
  }
};

export const sanitize = {
  input: (input: string): string => {
    return input.replace(/[<>'"&]/g, '').trim();
  },

  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  }
};

export const security = {
  generateCSRFToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  maskSensitiveData: (data: string, maskChar: string = '*', visibleChars: number = 4): string => {
    if (data.length <= visibleChars) return maskChar.repeat(data.length);
    const visible = data.slice(-visibleChars);
    const masked = maskChar.repeat(data.length - visibleChars);
    return masked + visible;
  },

  isValidIP: (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },

  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

export const permissions = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_BLOCK: 'user:block',
  
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_READ: 'department:read',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',
  
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',
  
  ADMIN_ALL: 'admin:all'
};

export const session = {
  getTimeout: (): number => SECURITY_CONFIG.sessionTimeout * 60 * 1000,
  
  isExpired: (lastActivity: Date): boolean => {
    const now = new Date();
    const timeDiff = now.getTime() - lastActivity.getTime();
    return timeDiff > session.getTimeout();
  },
  
  extendSession: (): void => {
    const now = new Date().toISOString();
    localStorage.setItem('lastActivity', now);
  },
  
  clearSession: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('lastActivity');
    sessionStorage.clear();
  }
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};