import { pgTable, serial, varchar, timestamp, integer, text, boolean, date, jsonb, inet, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  departmentId: integer('department_id').references(() => departments.id),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
    employeeNumberIdx: index('idx_users_employee_number').on(table.employeeNumber),
    departmentIdIdx: index('idx_users_department_id').on(table.departmentId),
    statusIdx: index('idx_users_status').on(table.status),
  };
});

export const employment = pgTable('employment', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  contractType: varchar('contract_type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  action: varchar('action', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
}, (table) => {
  return {
    uniqueRolePermission: uniqueIndex('unique_role_permission').on(table.roleId, table.permissionId),
  };
});

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  validFrom: date('valid_from').notNull().$defaultFn(() => new Date().toISOString().split('T')[0]),
  validTo: date('valid_to'),
  grantedBy: integer('granted_by').references(() => users.id),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index('idx_user_roles_user_id').on(table.userId),
    roleIdIdx: index('idx_user_roles_role_id').on(table.roleId),
  };
});

export const loginEvents = pgTable('login_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  success: boolean('success').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  occurredAt: timestamp('occurred_at').$defaultFn(() => new Date()),
  failureReason: varchar('failure_reason', { length: 255 }),
}, (table) => {
  return {
    userIdIdx: index('idx_login_events_user_id').on(table.userId),
    occurredAtIdx: index('idx_login_events_occurred_at').on(table.occurredAt),
  };
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  targetUserId: integer('target_user_id').references(() => users.id),
  targetTable: varchar('target_table', { length: 50 }),
  targetId: integer('target_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  status: varchar('status', { length: 20 }).notNull().default('success'),
  details: text('details'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index('idx_audit_log_user_id').on(table.userId),
    createdAtIdx: index('idx_audit_log_created_at').on(table.createdAt),
    actionIdx: index('idx_audit_log_action').on(table.action),
  };
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  employment: many(employment),
  userRoles: many(userRoles),
  loginEvents: many(loginEvents),
  auditLogs: many(auditLog),
  targetedAuditLogs: many(auditLog, {
    relationName: 'targetUser',
  }),
  grantedRoles: many(userRoles, {
    relationName: 'grantedBy',
  }),
}));

export const employmentRelations = relations(employment, ({ one }) => ({
  user: one(users, {
    fields: [employment.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  grantedByUser: one(users, {
    fields: [userRoles.grantedBy],
    references: [users.id],
    relationName: 'grantedBy',
  }),
}));

export const loginEventsRelations = relations(loginEvents, ({ one }) => ({
  user: one(users, {
    fields: [loginEvents.userId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [auditLog.targetUserId],
    references: [users.id],
    relationName: 'targetUser',
  }),
}));