import { UserStatus, ContractType, AuditAction, AuditStatus } from '../types';

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  ME: '/api/auth/me',
  
  USERS: '/api/users',
  USER_BY_ID: (id: number) => `/api/users/${id}`,
  USER_BLOCK: (id: number) => `/api/users/${id}/block`,
  USER_UNBLOCK: (id: number) => `/api/users/${id}/unblock`,
  USER_ROLES: (id: number) => `/api/users/${id}/roles`,
  
  DEPARTMENTS: '/api/departments',
  DEPARTMENT_BY_ID: (id: number) => `/api/departments/${id}`,
  DEPARTMENT_USERS: (id: number) => `/api/departments/${id}/users`,
  
  ROLES: '/api/roles',
  ROLE_BY_ID: (id: number) => `/api/roles/${id}`,
  ROLE_PERMISSIONS: (id: number) => `/api/roles/${id}/permissions`,
  
  PERMISSIONS: '/api/permissions',
  
  AUDIT_LOGS: '/api/audit/logs',
  LOGIN_EVENTS: '/api/audit/login-events',
  AUDIT_EXPORT: '/api/audit/export'
};

export const USER_STATUS_OPTIONS = [
  { value: UserStatus.ACTIVE, label: 'Active', color: 'green' },
  { value: UserStatus.INACTIVE, label: 'Inactive', color: 'gray' },
  { value: UserStatus.BLOCKED, label: 'Blocked', color: 'red' },
  { value: UserStatus.PENDING, label: 'Pending', color: 'yellow' }
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: ContractType.FULL_TIME, label: 'Full Time' },
  { value: ContractType.PART_TIME, label: 'Part Time' },
  { value: ContractType.CONTRACT, label: 'Contract' },
  { value: ContractType.INTERN, label: 'Intern' }
];

export const AUDIT_ACTION_OPTIONS = [
  { value: AuditAction.CREATE_USER, label: 'Create User' },
  { value: AuditAction.UPDATE_USER, label: 'Update User' },
  { value: AuditAction.DELETE_USER, label: 'Delete User' },
  { value: AuditAction.BLOCK_USER, label: 'Block User' },
  { value: AuditAction.UNBLOCK_USER, label: 'Unblock User' },
  { value: AuditAction.ASSIGN_ROLE, label: 'Assign Role' },
  { value: AuditAction.REVOKE_ROLE, label: 'Revoke Role' },
  { value: AuditAction.CREATE_DEPARTMENT, label: 'Create Department' },
  { value: AuditAction.UPDATE_DEPARTMENT, label: 'Update Department' },
  { value: AuditAction.DELETE_DEPARTMENT, label: 'Delete Department' },
  { value: AuditAction.CREATE_ROLE, label: 'Create Role' },
  { value: AuditAction.UPDATE_ROLE, label: 'Update Role' },
  { value: AuditAction.DELETE_ROLE, label: 'Delete Role' },
  { value: AuditAction.LOGIN_SUCCESS, label: 'Login Success' },
  { value: AuditAction.LOGIN_FAILED, label: 'Login Failed' },
  { value: AuditAction.LOGOUT, label: 'Logout' }
];

export const AUDIT_STATUS_OPTIONS = [
  { value: AuditStatus.SUCCESS, label: 'Success', color: 'green' },
  { value: AuditStatus.FAILED, label: 'Failed', color: 'red' },
  { value: AuditStatus.PENDING, label: 'Pending', color: 'yellow' }
];

export const NAVIGATION_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
    permission: 'user:read'
  },
  {
    path: '/users',
    label: 'Users',
    icon: '👥',
    permission: 'user:read'
  },
  {
    path: '/departments',
    label: 'Departments',
    icon: '🏢',
    permission: 'department:read'
  },
  {
    path: '/roles',
    label: 'Roles & Permissions',
    icon: '🔐',
    permission: 'role:read'
  },
  {
    path: '/audit',
    label: 'Audit Trail',
    icon: '📋',
    permission: 'audit:read'
  }
];

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGES_SHOWN: 5
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
};

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
  EMPLOYEE_NUMBER_INVALID: 'Employee number must be 3-20 alphanumeric characters',
  NAME_INVALID: 'Name must be 2-100 characters, letters only',
  DEPARTMENT_CODE_INVALID: 'Department code must be 2-10 uppercase letters/numbers'
};

export const SECURITY_SETTINGS = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000,
  PASSWORD_MIN_LENGTH: 8,
  CSRF_TOKEN_HEADER: 'X-CSRF-Token'
};

export const USER_TABLE_COLUMNS = [
  { key: 'employee_number', label: 'Employee #', sortable: true, width: '120px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'department.name', label: 'Department', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'created_at', label: 'Created', sortable: true, width: '120px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '150px' }
];

export const DEPARTMENT_TABLE_COLUMNS = [
  { key: 'code', label: 'Code', sortable: true, width: '100px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
];

export const ROLE_TABLE_COLUMNS = [
  { key: 'name', label: 'Role Name', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'permission_count', label: 'Permissions', sortable: true, width: '120px' },
  { key: 'user_count', label: 'Users', sortable: true, width: '80px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
];

export const AUDIT_TABLE_COLUMNS = [
  { key: 'created_at', label: 'Date/Time', sortable: true, width: '150px' },
  { key: 'user.name', label: 'User', sortable: true },
  { key: 'action', label: 'Action', sortable: true, width: '150px' },
  { key: 'target_user.name', label: 'Target', sortable: false },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'details', label: 'Details', sortable: false }
];

export const LOGIN_EVENTS_TABLE_COLUMNS = [
  { key: 'occurred_at', label: 'Date/Time', sortable: true, width: '150px' },
  { key: 'user.name', label: 'User', sortable: true },
  { key: 'user.email', label: 'Email', sortable: true },
  { key: 'success', label: 'Success', sortable: true, width: '80px' },
  { key: 'ip', label: 'IP Address', sortable: false, width: '120px' },
  { key: 'user_agent', label: 'User Agent', sortable: false }
];

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have the required permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_BLOCKED: 'User blocked successfully',
  USER_UNBLOCKED: 'User unblocked successfully',
  DEPARTMENT_CREATED: 'Department created successfully',
  DEPARTMENT_UPDATED: 'Department updated successfully',
  DEPARTMENT_DELETED: 'Department deleted successfully',
  ROLE_CREATED: 'Role created successfully',
  ROLE_UPDATED: 'Role updated successfully',
  ROLE_DELETED: 'Role deleted successfully',
  ROLE_ASSIGNED: 'Role assigned successfully',
  ROLE_REVOKED: 'Role revoked successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful'
};