-- =============================================================================
-- CLEAN DATABASE - Remove all existing data
-- =============================================================================

-- Clean tables in the correct order to avoid foreign key constraint violations
DELETE FROM audit_log;
DELETE FROM login_events;
DELETE FROM user_roles;
DELETE FROM role_permissions;
DELETE FROM employment;
DELETE FROM users;
DELETE FROM roles;
DELETE FROM permissions;
DELETE FROM departments;

-- Reset sequence counters
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE employment_id_seq RESTART WITH 1;
ALTER SEQUENCE user_roles_id_seq RESTART WITH 1;
ALTER SEQUENCE role_permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE login_events_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_log_id_seq RESTART WITH 1;

-- =============================================================================
-- INSERT FRESH SAMPLE DATA
-- =============================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (name, code) VALUES
('Information Technology', 'IT'),
('Human Resources', 'HR'),
('Finance & Accounting', 'FIN'),
('Marketing & Sales', 'MKT'),
('Operations', 'OPS'),
('Legal & Compliance', 'LEG'),
('Research & Development', 'RND');

-- 2. PERMISSIONS
INSERT INTO permissions (name, action, description) VALUES
('Admin All Access', 'admin:all', 'Full administrative access to all system functions'),
('User Create', 'user:create', 'Create new user accounts'),
('User Read', 'user:read', 'View user information and profiles'),
('User Update', 'user:update', 'Update user information and profiles'),
('User Delete', 'user:delete', 'Deactivate or permanently delete users'),
('User Block', 'user:block', 'Block and unblock user accounts'),
('Department Create', 'department:create', 'Create new departments'),
('Department Read', 'department:read', 'View department information'),
('Department Update', 'department:update', 'Update department information'),
('Department Delete', 'department:delete', 'Delete departments'),
('Role Create', 'role:create', 'Create new system roles'),
('Role Read', 'role:read', 'View role information'),
('Role Update', 'role:update', 'Update role information'),
('Role Delete', 'role:delete', 'Delete system roles'),
('Role Assign', 'role:assign', 'Assign roles to users'),
('Audit Read', 'audit:read', 'View audit logs and activity'),
('Audit Export', 'audit:export', 'Export audit data and reports');

-- 3. ROLES
INSERT INTO roles (name, description) VALUES
('System Administrator', 'Full system access with all administrative permissions'),
('HR Manager', 'Human Resources management with user and role administration'),
('Department Manager', 'Department-level management with limited user access'),
('Employee', 'Standard employee access for viewing own information'),
('Auditor', 'Read-only access for compliance and audit purposes'),
('IT Support', 'Technical support with user management capabilities');

-- 4. ROLE PERMISSIONS ASSIGNMENTS
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions;

-- HR Manager permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions 
WHERE action IN ('user:create', 'user:read', 'user:update', 'user:block', 'role:read', 'role:assign', 'department:read', 'audit:read');

-- Department Manager permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, id FROM permissions 
WHERE action IN ('user:read', 'user:update', 'department:read', 'department:update');

-- Employee permissions (basic access)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 4, id FROM permissions 
WHERE action IN ('user:read', 'department:read');

-- Auditor permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 5, id FROM permissions 
WHERE action IN ('user:read', 'department:read', 'role:read', 'audit:read', 'audit:export');

-- IT Support permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 6, id FROM permissions 
WHERE action IN ('user:create', 'user:read', 'user:update', 'user:block', 'department:read', 'role:read');

-- 5. USERS WITH PROPER PASSWORD HASHES

INSERT INTO users (employee_number, name, email, password_hash, status, department_id) VALUES
-- System Administrator
('SYS001', 'Sarah Anderson', 'admin@company.com', '$2b$12$S0LuICc40dRJGJFhjVkv7OVmuCMNXMiAjlcJo9KHCFiTRT2GLCRVS', 'active', 1),

-- HR Manager
('HR001', 'Michael Johnson', 'michael.johnson@company.com', '$2b$12$ufrk15.sZArw8RiB6pMmwufR5d9DRQCGKLk0TFSJrlvNlv9qySGEm', 'active', 2),

-- IT Manager
('IT001', 'David Chen', 'david.chen@company.com', '$2b$12$wRV8HZCu4mo8/jV34m/NkuO/V8Ww2GZC9fkTcan36ea/UDNpdPXT2', 'active', 1),

-- Finance Manager
('FIN001', 'Emma Rodriguez', 'emma.rodriguez@company.com', '$2b$12$UqvcQEE2Q5KZqPpyREsXg.EO6poSZwHHc8kI788ltJ0.UmP1n7HHy', 'active', 3),

-- Marketing Manager
('MKT001', 'James Wilson', 'james.wilson@company.com', '$2b$12$TG9spNXJtSiV2E3SDREUT.7KE.L3d2gk8e0DXB8NlvW1NcS1xcKNG', 'active', 4),

-- Regular Employees
('EMP001', 'Lisa Thompson', 'lisa.thompson@company.com', '$2b$12$SKjtqSqYMadGS7QFsbQ0PuHzr/zczb5GDW.49TgbDZMhuBeu54eqy', 'active', 5),
('EMP002', 'Robert Davis', 'robert.davis@company.com', '$2b$12$qxr9DC/K8TCj82rlVz00/eJWZFBgO2F7lFdzO54TMOypEBUU1WFAC', 'active', 6),
('EMP003', 'Jennifer Garcia', 'jennifer.garcia@company.com', '$2b$12$SKjtqSqYMadGS7QFsbQ0PuHzr/zczb5GDW.49TgbDZMhuBeu54eqy', 'active', 7),
('EMP004', 'Thomas Martinez', 'thomas.martinez@company.com', '$2b$12$qxr9DC/K8TCj82rlVz00/eJWZFBgO2F7lFdzO54TMOypEBUU1WFAC', 'inactive', 1),

-- Auditor
('AUD001', 'Patricia Lee', 'patricia.lee@company.com', '$2b$12$4q3Dmj15FULq.7.8g1.WbeS8hmr5KJ.z3wvwGfQCxv78zW2xIcVTS', 'active', 6),

-- IT Support
('IT002', 'Mark Williams', 'mark.williams@company.com', '$2b$12$wRV8HZCu4mo8/jV34m/NkuO/V8Ww2GZC9fkTcan36ea/UDNpdPXT2', 'active', 1),

-- New Pending Employee (starting in future)
('EMP005', 'Sarah Kim', 'sarah.kim@company.com', '$2b$12$SKjtqSqYMadGS7QFsbQ0PuHzr/zczb5GDW.49TgbDZMhuBeu54eqy', 'pending', 2);

-- 6. EMPLOYMENT RECORDS
INSERT INTO employment (user_id, start_date, contract_type) VALUES
(1, '2022-01-15', 'full_time'),    -- Sarah Anderson (Admin)
(2, '2022-03-01', 'full_time'),    -- Michael Johnson (HR Manager)
(3, '2022-02-15', 'full_time'),    -- David Chen (IT Manager)
(4, '2022-04-01', 'full_time'),    -- Emma Rodriguez (Finance Manager)
(5, '2022-05-15', 'full_time'),    -- James Wilson (Marketing Manager)
(6, '2023-01-10', 'full_time'),    -- Lisa Thompson (Employee)
(7, '2023-02-01', 'part_time'),    -- Robert Davis (Employee)
(8, '2024-10-01', 'full_time'),    -- Jennifer Garcia (Started Employee)
(9, '2023-06-01', 'contract'),     -- Thomas Martinez (Inactive)
(10, '2022-08-15', 'full_time'),   -- Patricia Lee (Auditor)
(11, '2023-03-15', 'full_time'),   -- Mark Williams (IT Support)
(12, '2025-12-01', 'full_time');  -- Sarah Kim (Pending Employee - Future Start)

-- 7. USER ROLE ASSIGNMENTS
INSERT INTO user_roles (user_id, role_id, valid_from, granted_by) VALUES
(1, 1, '2022-01-15', 1),  -- Sarah Anderson -> System Administrator
(2, 2, '2022-03-01', 1),  -- Michael Johnson -> HR Manager
(3, 3, '2022-02-15', 1),  -- David Chen -> Department Manager
(4, 3, '2022-04-01', 1),  -- Emma Rodriguez -> Department Manager
(5, 3, '2022-05-15', 1),  -- James Wilson -> Department Manager
(6, 4, '2023-01-10', 2),  -- Lisa Thompson -> Employee
(7, 4, '2023-02-01', 2),  -- Robert Davis -> Employee
(8, 4, '2024-10-01', 2),  -- Jennifer Garcia -> Employee (active)
(9, 4, '2023-06-01', 2),  -- Thomas Martinez -> Employee (inactive)
(10, 5, '2022-08-15', 1), -- Patricia Lee -> Auditor
(11, 6, '2023-03-15', 1), -- Mark Williams -> IT Support
(12, 4, '2025-12-01', 2); -- Sarah Kim -> Employee (pending)

-- =============================================================================
-- NOTE: LOGIN_EVENTS and AUDIT_LOG tables are intentionally left empty
-- These will be populated as users interact with the system
-- =============================================================================

-- Final confirmation
SELECT 'Database cleaned and sample data inserted successfully!' as status;