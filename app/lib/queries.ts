import { eq, desc, count, and, isNull, gte, gt } from 'drizzle-orm';
import { db, users, departments, userRoles, roles, loginEvents, auditLog } from '../db';

export async function getAllUsers() {
  const usersData = await db
    .select({
      id: users.id,
      employeeNumber: users.employeeNumber,
      name: users.name,
      email: users.email,
      status: users.status,
      departmentId: users.departmentId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      department: {
        id: departments.id,
        name: departments.name,
        code: departments.code,
      },
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .orderBy(desc(users.createdAt));

  const usersWithRoles = await Promise.all(
    usersData.map(async (user) => {
      const userRolesData = await getUserRoles(user.id);
      return {
        ...user,
        roles: userRolesData,
      };
    })
  );

  return usersWithRoles;
}

export async function getUserById(id: number) {
  const result = await db
    .select({
      id: users.id,
      employeeNumber: users.employeeNumber,
      name: users.name,
      email: users.email,
      status: users.status,
      departmentId: users.departmentId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      department: {
        id: departments.id,
        name: departments.name,
        code: departments.code,
      },
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

export async function getAllDepartments() {
  return await db
    .select()
    .from(departments)
    .orderBy(departments.name);
}

export async function getDepartmentById(id: number) {
  const result = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getUsersCountByDepartment() {
  return await db
    .select({
      departmentId: users.departmentId,
      departmentName: departments.name,
      userCount: count(users.id),
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .groupBy(users.departmentId, departments.name);
}

export async function getDashboardStats() {
  const totalUsersResult = await db.select({ count: count() }).from(users);
  const totalDepartmentsResult = await db.select({ count: count() }).from(departments);
  
  const activeUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, 'active'));
    
  const pendingUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, 'pending'));

  const blockedUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, 'blocked'));

  const totalRolesResult = await db.select({ count: count() }).from(roles);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLoginsResult = await db
    .select({ count: count() })
    .from(loginEvents)
    .where(and(
      eq(loginEvents.success, true),
      gte(loginEvents.occurredAt, thirtyDaysAgo)
    ));

  const failedLoginsResult = await db
    .select({ count: count() })
    .from(loginEvents)
    .where(and(
      eq(loginEvents.success, false),
      gte(loginEvents.occurredAt, thirtyDaysAgo)
    ));

  return {
    totalUsers: totalUsersResult[0].count,
    totalDepartments: totalDepartmentsResult[0].count,
    activeUsers: activeUsersResult[0].count,
    pendingUsers: pendingUsersResult[0].count,
    blockedUsers: blockedUsersResult[0].count,
    totalRoles: totalRolesResult[0].count,
    recentLogins: recentLoginsResult[0].count,
    failedLogins: failedLoginsResult[0].count,
  };
}

export async function createUser(userData: {
  employeeNumber: string;
  name: string;
  email: string;
  passwordHash: string;
  departmentId?: number;
  status?: string;
}, auditData?: { userId?: number; ipAddress?: string; userAgent?: string }) {
  const result = await db
    .insert(users)
    .values({
      employeeNumber: userData.employeeNumber,
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      departmentId: userData.departmentId,
      status: userData.status || 'pending',
    })
    .returning();

  const newUser = result[0];

  if (auditData) {
    await createAuditLog({
      userId: auditData.userId,
      action: 'user_created',
      targetUserId: newUser.id,
      targetTable: 'users',
      targetId: newUser.id,
      newValues: {
        employeeNumber: newUser.employeeNumber,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        departmentId: newUser.departmentId,
      },
      details: `User created: ${newUser.name} (${newUser.email})`,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  return newUser;
}

export async function updateUser(
  id: number, 
  userData: Partial<{
    employeeNumber: string;
    name: string;
    email: string;
    status: string;
    departmentId: number;
  }>, 
  auditData?: { 
    userId?: number; 
    ipAddress?: string; 
    userAgent?: string; 
    reason?: string;
  }
) {
  const oldUser = await getUserById(id);
  if (!oldUser) {
    throw new Error('User not found');
  }

  const result = await db
    .update(users)
    .set({
      ...userData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  const updatedUser = result[0];

  if (auditData) {
    let action = 'user_updated';
    let details = `User updated: ${updatedUser.name}`;

    if (userData.status && userData.status !== oldUser.status) {
      if (userData.status === 'blocked') {
        action = 'user_blocked';
        details = `User blocked: ${updatedUser.name}`;
        if (auditData.reason) {
          details += ` - Reason: ${auditData.reason}`;
        }
      } else if (userData.status === 'active' && oldUser.status === 'blocked') {
        action = 'user_unblocked';
        details = `User unblocked: ${updatedUser.name}`;
      }
    }

    await createAuditLog({
      userId: auditData.userId,
      action,
      targetUserId: updatedUser.id,
      targetTable: 'users',
      targetId: updatedUser.id,
      oldValues: {
        employeeNumber: oldUser.employeeNumber,
        name: oldUser.name,
        email: oldUser.email,
        status: oldUser.status,
        departmentId: oldUser.departmentId,
      },
      newValues: {
        employeeNumber: updatedUser.employeeNumber,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        departmentId: updatedUser.departmentId,
      },
      details,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  return updatedUser;
}

export async function createDepartment(
  departmentData: {
    name: string;
    code: string;
  },
  auditData?: { userId?: number; ipAddress?: string; userAgent?: string }
) {
  const result = await db
    .insert(departments)
    .values(departmentData)
    .returning();

  const newDepartment = result[0];

  if (auditData) {
    await createAuditLog({
      userId: auditData.userId,
      action: 'department_created',
      targetTable: 'departments',
      targetId: newDepartment.id,
      newValues: {
        name: newDepartment.name,
        code: newDepartment.code,
      },
      details: `Department created: ${newDepartment.name} (${newDepartment.code})`,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  return newDepartment;
}

export async function updateDepartment(
  id: number, 
  departmentData: Partial<{
    name: string;
    code: string;
  }>,
  auditData?: { userId?: number; ipAddress?: string; userAgent?: string }
) {
  const oldDepartment = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);

  if (!oldDepartment[0]) {
    throw new Error('Department not found');
  }

  const result = await db
    .update(departments)
    .set({
      ...departmentData,
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id))
    .returning();

  const updatedDepartment = result[0];

  if (auditData) {
    await createAuditLog({
      userId: auditData.userId,
      action: 'department_updated',
      targetTable: 'departments',
      targetId: updatedDepartment.id,
      oldValues: {
        name: oldDepartment[0].name,
        code: oldDepartment[0].code,
      },
      newValues: {
        name: updatedDepartment.name,
        code: updatedDepartment.code,
      },
      details: `Department updated: ${updatedDepartment.name}`,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  return updatedDepartment;
}

export async function deactivateUser(
  id: number,
  auditData?: { userId?: number; ipAddress?: string; userAgent?: string }
) {
  const userToDelete = await getUserById(id);
  if (!userToDelete) {
    throw new Error('User not found');
  }

  const result = await db
    .update(users)
    .set({
      status: 'inactive',
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (auditData) {
    await createAuditLog({
      userId: auditData.userId,
      action: 'user_deactivated',
      targetUserId: id,
      targetTable: 'users',
      targetId: id,
      oldValues: {
        status: userToDelete.status,
      },
      newValues: {
        status: 'inactive',
      },
      details: `User deactivated: ${userToDelete.name} (${userToDelete.email})`,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  return result[0];
}

export async function permanentDeleteUser(
  id: number,
  auditData?: { userId?: number; ipAddress?: string; userAgent?: string }
) {
  const userToDelete = await getUserById(id);
  if (!userToDelete) {
    throw new Error('User not found');
  }

  const userRolesCount = await db
    .select({ count: count() })
    .from(userRoles)
    .where(eq(userRoles.userId, id));

  if (userRolesCount[0].count > 0) {
    // Remove user roles first
    await db
      .delete(userRoles)
      .where(eq(userRoles.userId, id));
  }

  if (auditData) {
    await createAuditLog({
      userId: auditData.userId,
      action: 'user_permanently_deleted',
      targetUserId: id,
      targetTable: 'users',
      targetId: id,
      oldValues: {
        employeeNumber: userToDelete.employeeNumber,
        name: userToDelete.name,
        email: userToDelete.email,
        status: userToDelete.status,
        departmentId: userToDelete.departmentId,
      },
      details: `User permanently deleted: ${userToDelete.name} (${userToDelete.email})`,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
    });
  }

  const result = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return result[0];
}

export async function deleteDepartment(id: number) {
  const usersInDepartment = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.departmentId, id));

  if (usersInDepartment[0].count > 0) {
    throw new Error('Cannot delete department with assigned users');
  }

  const result = await db
    .delete(departments)
    .where(eq(departments.id, id))
    .returning();

  return result[0];
}

export async function getAllRoles() {
  return await db
    .select()
    .from(roles)
    .orderBy(roles.name);
}

export async function createRole(roleData: {
  name: string;
  description?: string;
}) {
  const result = await db
    .insert(roles)
    .values(roleData)
    .returning();

  return result[0];
}

export async function updateRole(id: number, roleData: Partial<{
  name: string;
  description: string;
}>) {
  const result = await db
    .update(roles)
    .set({
      ...roleData,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id))
    .returning();

  return result[0];
}

export async function assignRoleToUser(userId: number, roleId: number, grantedBy: number) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const result = await db
    .insert(userRoles)
    .values({
      userId,
      roleId,
      grantedBy,
      validFrom: today,
    })
    .returning();

  return result[0];
}

export async function removeRoleFromUser(userId: number, roleId: number) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const result = await db
    .update(userRoles)
    .set({
      validTo: today,
      updatedAt: new Date(),
    })
    .where(and(
      eq(userRoles.userId, userId),
      eq(userRoles.roleId, roleId),
      isNull(userRoles.validTo)
    ))
    .returning();

  return result[0];
}

export async function getUserRoles(userId: number) {
  return await db
    .select({
      id: userRoles.id,
      roleId: userRoles.roleId,
      validFrom: userRoles.validFrom,
      validTo: userRoles.validTo,
      grantedBy: userRoles.grantedBy,
      role: {
        id: roles.id,
        name: roles.name,
        description: roles.description,
      },
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(
      eq(userRoles.userId, userId),
      isNull(userRoles.validTo)
    ));
}

export async function getRecentActivity(limit: number = 10) {
  const auditEntries = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      userId: auditLog.userId,
      targetUserId: auditLog.targetUserId,
      status: auditLog.status,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  const loginEntries = await db
    .select({
      id: loginEvents.id,
      success: loginEvents.success,
      userId: loginEvents.userId,
      occurredAt: loginEvents.occurredAt,
      failureReason: loginEvents.failureReason,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(loginEvents)
    .leftJoin(users, eq(loginEvents.userId, users.id))
    .orderBy(desc(loginEvents.occurredAt))
    .limit(limit);

  const combined = [
    ...auditEntries.map(entry => ({
      id: `audit_${entry.id}`,
      action: entry.action,
      user: 'System User',
      target: null,
      timestamp: entry.createdAt,
      status: entry.status === 'success' ? 'success' : 'failed',
      type: 'audit'
    })),
    ...loginEntries.map(entry => ({
      id: `login_${entry.id}`,
      action: entry.success ? 'Login Success' : 'Login Failed',
      user: entry.user?.name || 'Unknown User',
      target: entry.user?.email || null,
      timestamp: entry.occurredAt,
      status: entry.success ? 'success' : 'failed',
      type: 'login'
    }))
  ].sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA;
    })
   .slice(0, limit);

  return combined;
}

export async function getSecurityAlerts() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentFailedLogins = await db
    .select({ count: count() })
    .from(loginEvents)
    .where(and(
      eq(loginEvents.success, false),
      gte(loginEvents.occurredAt, oneHourAgo)
    ));

  const recentBlockedUsers = await db
    .select({ count: count() })
    .from(auditLog)
    .where(and(
      eq(auditLog.action, 'user_blocked'),
      gte(auditLog.createdAt, oneDayAgo)
    ));

  const suspiciousIPs = await db
    .select({ 
      ipAddress: loginEvents.ipAddress,
      count: count()
    })
    .from(loginEvents)
    .where(and(
      eq(loginEvents.success, false),
      gte(loginEvents.occurredAt, oneDayAgo)
    ))
    .groupBy(loginEvents.ipAddress)
    .having(gt(count(), 5));

  const alerts = [];

  const failedLoginCount = recentFailedLogins[0].count;
  if (failedLoginCount > 0) {
    alerts.push({
      id: 'failed_logins',
      type: failedLoginCount > 10 ? 'danger' : 'warning',
      title: `${failedLoginCount} failed login attempts in the last hour`,
      description: failedLoginCount > 10 ? 'Possible security threat detected' : 'Monitor for potential security threats',
      timestamp: new Date()
    });
  }

  const blockedUserCount = recentBlockedUsers[0].count;
  if (blockedUserCount > 0) {
    alerts.push({
      id: 'blocked_users',
      type: 'warning',
      title: `${blockedUserCount} users blocked in the last 24 hours`,
      description: 'Review blocked user activities',
      timestamp: new Date()
    });
  }

  if (suspiciousIPs.length > 0) {
    alerts.push({
      id: 'suspicious_ips',
      type: 'danger',
      title: `${suspiciousIPs.length} IP addresses with excessive failed login attempts`,
      description: 'Potential brute force attack detected',
      timestamp: new Date()
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all_clear',
      type: 'success',
      title: 'All systems operational',
      description: 'Security monitoring active',
      timestamp: new Date()
    });
  }

  return alerts;
}

function isValidIPAddress(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function createAuditLog(data: {
  userId?: number;
  action: string;
  targetUserId?: number;
  targetTable?: string;
  targetId?: number;
  oldValues?: any;
  newValues?: any;
  status?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const result = await db
    .insert(auditLog)
    .values({
      userId: data.userId || null,
      action: data.action,
      targetUserId: data.targetUserId || null,
      targetTable: data.targetTable || null,
      targetId: data.targetId || null,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      status: data.status || 'success',
      details: data.details || null,
      ipAddress: data.ipAddress && isValidIPAddress(data.ipAddress) ? data.ipAddress : null,
      userAgent: data.userAgent || null,
    })
    .returning();

  return result[0];
}

export async function logLoginEvent(data: {
  userId?: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}) {
  const result = await db
    .insert(loginEvents)
    .values({
      userId: data.userId || null,
      success: data.success,
      ipAddress: data.ipAddress && isValidIPAddress(data.ipAddress) ? data.ipAddress : null,
      userAgent: data.userAgent || null,
      failureReason: data.failureReason || null,
    })
    .returning();

  return result[0];
}