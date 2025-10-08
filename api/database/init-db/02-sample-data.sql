INSERT INTO departments (name, code) VALUES
('Information Technology', 'IT'),
('Human Resources', 'HR'),
('Finance', 'FIN'),
('Marketing', 'MKT'),
('Operations', 'OPS'),
('Sales', 'SALES');

INSERT INTO permissions (name, action, description) VALUES
('Admin All', 'admin:all', 'Full administrative access'),
('User Create', 'user:create', 'Create new users'),
('User Read', 'user:read', 'View user information'),
('User Update', 'user:update', 'Update user information'),
('User Delete', 'user:delete', 'Delete users'),
('User Block', 'user:block', 'Block/unblock users'),
('Department Create', 'department:create', 'Create new departments'),
('Department Read', 'department:read', 'View department information'),
('Department Update', 'department:update', 'Update department information'),
('Department Delete', 'department:delete', 'Delete departments'),
('Role Create', 'role:create', 'Create new roles'),
('Role Read', 'role:read', 'View role information'),
('Role Update', 'role:update', 'Update role information'),
('Role Delete', 'role:delete', 'Delete roles'),
('Role Assign', 'role:assign', 'Assign roles to users'),
('Audit Read', 'audit:read', 'View audit logs'),
('Audit Export', 'audit:export', 'Export audit data');

INSERT INTO roles (name, description) VALUES
('Super Administrator', 'Full system access with all permissions'),
('HR Manager', 'Human Resources management capabilities'),
('Department Manager', 'Department-specific management access'),
('Employee', 'Basic employee access'),
('Auditor', 'Read-only access for audit purposes');

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions;

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions 
WHERE action IN ('user:create', 'user:read', 'user:update', 'user:block', 'role:read', 'role:assign', 'audit:read');

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, id FROM permissions 
WHERE action IN ('user:read', 'user:update', 'department:read', 'department:update');

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 4, id FROM permissions 
WHERE action IN ('user:read', 'department:read');

INSERT INTO role_permissions (role_id, permission_id) 
SELECT 5, id FROM permissions 
WHERE action IN ('user:read', 'department:read', 'role:read', 'audit:read', 'audit:export');

INSERT INTO users (employee_number, name, email, password_hash, status, department_id) VALUES
('ADM001', 'System Administrator', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'active', 1),
('HR001', 'Jane Smith', 'jane.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'active', 2),
('IT001', 'John Doe', 'john.doe@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'active', 1),
('FIN001', 'Alice Johnson', 'alice.johnson@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'active', 3),
('MKT001', 'Bob Wilson', 'bob.wilson@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'active', 4),
('EMP001', 'Charlie Brown', 'charlie.brown@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsRwuOYW6', 'blocked', 5);

INSERT INTO employment (user_id, start_date, contract_type) VALUES
(1, '2023-01-01', 'full_time'),
(2, '2023-02-15', 'full_time'),
(3, '2023-03-01', 'full_time'),
(4, '2023-04-01', 'full_time'),
(5, '2023-05-01', 'part_time'),
(6, '2023-06-01', 'contract');

INSERT INTO user_roles (user_id, role_id, valid_from, granted_by) VALUES
(1, 1, '2023-01-01', 1),
(2, 2, '2023-02-15', 1),
(3, 3, '2023-03-01', 1),
(4, 4, '2023-04-01', 1),
(5, 4, '2023-05-01', 1),
(6, 4, '2023-06-01', 1);

INSERT INTO login_events (user_id, success, ip_address, user_agent, occurred_at) VALUES
(1, true, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, true, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, false, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(1, true, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO audit_log (user_id, action, target_user_id, target_table, target_id, status, details, ip_address) VALUES
(1, 'create_user', 6, 'users', 6, 'success', 'Created new user Charlie Brown', '192.168.1.100'),
(1, 'block_user', 6, 'users', 6, 'success', 'Blocked user Charlie Brown due to policy violation', '192.168.1.100'),
(2, 'assign_role', 5, 'user_roles', 5, 'success', 'Assigned Employee role to Bob Wilson', '192.168.1.101');