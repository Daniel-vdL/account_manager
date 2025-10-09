export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface User {
  id: number;
  employee_number: string;
  name: string;
  email: string;
  status: UserStatus;
  department_id: number;
  department?: Department;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  employment?: {
    id?: number;
    start_date?: string;
    end_date?: string;
    contract_type?: ContractType;
  };
}

export interface Employment {
  id: number;
  user_id: number;
  start_date: string;
  end_date?: string;
  contract_type: ContractType;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  action: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  role?: Role;
  valid_from: string;
  valid_to?: string;
  granted_by: number;
  granted_by_user?: User;
}

export interface LoginEvent {
  id: number;
  user_id: number;
  user?: User;
  success: boolean;
  ip: string;
  user_agent: string;
  occurred_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user?: User;
  action: AuditAction;
  target_user_id?: number;
  target_user?: User;
  status: AuditStatus;
  details?: string;
  created_at: string;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending'
}

export enum ContractType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern'
}

export enum AuditAction {
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  BLOCK_USER = 'block_user',
  UNBLOCK_USER = 'unblock_user',
  ASSIGN_ROLE = 'assign_role',
  REVOKE_ROLE = 'revoke_role',
  CREATE_DEPARTMENT = 'create_department',
  UPDATE_DEPARTMENT = 'update_department',
  DELETE_DEPARTMENT = 'delete_department',
  CREATE_ROLE = 'create_role',
  UPDATE_ROLE = 'update_role',
  DELETE_ROLE = 'delete_role',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout'
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface CreateUserForm {
  employee_number: string;
  name: string;
  email: string;
  department_id: number;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  role_ids: number[];
}

export interface UpdateUserForm {
  name: string;
  email: string;
  department_id: number;
  status: UserStatus;
}

export interface CreateDepartmentForm {
  name: string;
  code: string;
}

export interface CreateRoleForm {
  name: string;
  description: string;
  permission_ids: number[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  employee_number: string;
  department: Department;
  roles: Role[];
  permissions: Permission[];
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FilterOptions {
  search?: string;
  department_id?: number;
  status?: UserStatus;
  role_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SecurityConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  csrfTokenName: string;
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
}
