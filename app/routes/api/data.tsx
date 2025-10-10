import { 
  getAllUsers, 
  getAllDepartments, 
  getDashboardStats, 
  getUserById, 
  getUserByEmail,
  createUser, 
  updateUser, 
  createDepartment,
  updateDepartment,
  deleteDepartment,
  deactivateUser,
  permanentDeleteUser,
  getUsersCountByDepartment,
  getUserRoles,
  getRecentActivity,
  getSecurityAlerts,
  logLoginEvent,
  checkAndDeactivateExpiredContracts,
  activatePendingUsers,
  getAllRoles,
  createRole,
  updateRole,
  assignRoleToUser,
  removeRoleFromUser,
  getAllPermissions,
  getAuditLogs,
  getLoginEvents
} from "../../lib/queries";
import bcrypt from 'bcryptjs';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");
  const id = url.searchParams.get("id");

  try {
    switch (endpoint) {
      case "users":
        await activatePendingUsers();
        
        if (id) {
          const user = await getUserById(parseInt(id));
          return Response.json({ user });
        }
        const users = await getAllUsers();
        return Response.json({ users });
      
      case "departments":
        const departments = await getAllDepartments();
        return Response.json({ departments });
      
      case "dashboard-stats":
        await activatePendingUsers();
        const stats = await getDashboardStats();
        return Response.json({ stats });
      
      case "department-user-counts":
        const departmentCounts = await getUsersCountByDepartment();
        return Response.json({ departmentCounts });
      
      case "user-roles":
        if (!id) {
          return Response.json({ error: "User ID is required" }, { status: 400 });
        }
        const userRoles = await getUserRoles(parseInt(id));
        return Response.json({ roles: userRoles });
      
      case "recent-activity":
        const limit = url.searchParams.get("limit");
        const recentActivity = await getRecentActivity(limit ? parseInt(limit) : 10);
        return Response.json({ activity: recentActivity });
      
      case "security-alerts":
        const securityAlerts = await getSecurityAlerts();
        return Response.json({ alerts: securityAlerts });
      
      case "roles":
        const roles = await getAllRoles();
        return Response.json({ roles });
      
      case "permissions":
        const permissions = await getAllPermissions();
        return Response.json({ permissions });
      
      case "audit-logs":
        const auditStartDate = url.searchParams.get("startDate");
        const auditEndDate = url.searchParams.get("endDate");
        const auditUserId = url.searchParams.get("userId");
        const auditAction = url.searchParams.get("action");
        const auditLimit = url.searchParams.get("limit");
        
        const auditLogs = await getAuditLogs({
          startDate: auditStartDate || undefined,
          endDate: auditEndDate || undefined,
          userId: auditUserId ? parseInt(auditUserId) : undefined,
          action: auditAction || undefined,
          limit: auditLimit ? parseInt(auditLimit) : undefined
        });
        return Response.json({ auditLogs });
      
      case "login-events":
        const loginStartDate = url.searchParams.get("startDate");
        const loginEndDate = url.searchParams.get("endDate");
        const loginUserId = url.searchParams.get("userId");
        const success = url.searchParams.get("success");
        const loginLimit = url.searchParams.get("limit");
        
        const loginEventsData = await getLoginEvents({
          startDate: loginStartDate || undefined,
          endDate: loginEndDate || undefined,
          userId: loginUserId ? parseInt(loginUserId) : undefined,
          success: success ? success === 'true' : undefined,
          limit: loginLimit ? parseInt(loginLimit) : undefined
        });
        return Response.json({ loginEvents: loginEventsData });
      
      case "audit-export":
        const exportStartDate = url.searchParams.get("startDate");
        const exportEndDate = url.searchParams.get("endDate");
        const exportUserId = url.searchParams.get("userId");
        const exportAction = url.searchParams.get("action");
        const exportFormat = url.searchParams.get("format") || 'csv';
        
        const exportAuditLogs = await getAuditLogs({
          startDate: exportStartDate || undefined,
          endDate: exportEndDate || undefined,
          userId: exportUserId ? parseInt(exportUserId) : undefined,
          action: exportAction || undefined,
          limit: 10000
        });
        
        return Response.json({ 
          success: true, 
          data: exportAuditLogs,
          format: exportFormat 
        });
      
      default:
        return Response.json({ error: "Invalid endpoint" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");
  const method = request.method;

  try {
    const body = await request.json();

    switch (endpoint) {
      case "users":
        return await handleUserActions(method, body, request);
      
      case "departments":
        return await handleDepartmentActions(method, body, request);
      
      case "roles":
        return await handleRoleActions(method, body, request);
      
      case "user-roles":
        return await handleUserRoleActions(method, body, request);
      
      case "auth":
        return await handleAuthActions(method, body, request);
      
      case "contracts":
        return await handleContractActions(method, body, request);
      
      default:
        return Response.json({ error: "Invalid endpoint" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Action Error:", error);
    return Response.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

async function handleUserActions(method: string, body: any, request: Request) {
  const getAuditData = () => ({
    userId: body.currentUserId || 1,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
  switch (method) {
    case "POST":
      const { employeeNumber, name, email, password, departmentId, status, startDate, endDate, contractType } = body;
      
      if (!employeeNumber || !name || !email || !password) {
        return Response.json({ 
          error: "Missing required fields: employeeNumber, name, email, password" 
        }, { status: 400 });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return Response.json({ 
          error: "User with this email already exists" 
        }, { status: 409 });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await createUser({
        employeeNumber,
        name,
        email,
        passwordHash,
        departmentId: departmentId || null,
        status: status || 'pending',
        startDate,
        endDate,
        contractType: contractType || 'full_time'
      }, getAuditData());

      return Response.json({ 
        message: "User created successfully", 
        user: { ...newUser, passwordHash: undefined }
      }, { status: 201 });

    case "PUT":
      const { id, reason, ...updateData } = body;
      
      if (!id) {
        return Response.json({ error: "User ID is required" }, { status: 400 });
      }

      if (updateData.status === 'blocked' && !reason) {
        return Response.json({ 
          error: "A reason is required when blocking a user" 
        }, { status: 400 });
      }

      if (updateData.password) {
        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
        delete updateData.password;
      }

      const auditData = {
        ...getAuditData(),
        ...(reason && { reason })
      };

      const updatedUser = await updateUser(id, updateData, auditData);
      if (!updatedUser) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json({ 
        message: "User updated successfully", 
        user: { ...updatedUser, passwordHash: undefined }
      });

    case "DELETE":
      const { userId, permanent } = body;
      if (!userId) {
        return Response.json({ error: "User ID is required" }, { status: 400 });
      }
      
      if (permanent) {
        const deletedUser = await permanentDeleteUser(userId, getAuditData());
        return Response.json({ 
          message: "User permanently deleted successfully",
          user: { ...deletedUser, passwordHash: undefined }
        });
      } else {
        const deactivatedUser = await deactivateUser(userId, getAuditData());
        return Response.json({ 
          message: "User deactivated successfully",
          user: { ...deactivatedUser, passwordHash: undefined }
        });
      }

    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}

async function handleDepartmentActions(method: string, body: any, request: Request) {
  const getAuditData = () => ({
    userId: body.currentUserId || 1,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
  switch (method) {
    case "POST":
      const { name, code } = body;
      
      if (!name || !code) {
        return Response.json({ 
          error: "Missing required fields: name, code" 
        }, { status: 400 });
      }

      const newDepartment = await createDepartment({ name, code }, getAuditData());
      
      return Response.json({ 
        message: "Department created successfully", 
        department: newDepartment 
      }, { status: 201 });

    case "PUT":
      const { id, ...updateData } = body;
      
      if (!id) {
        return Response.json({ error: "Department ID is required" }, { status: 400 });
      }

      if (!updateData.name && !updateData.code) {
        return Response.json({ error: "At least one field (name or code) is required" }, { status: 400 });
      }

      const updatedDepartment = await updateDepartment(id, updateData, getAuditData());
      if (!updatedDepartment) {
        return Response.json({ error: "Department not found" }, { status: 404 });
      }

      return Response.json({ 
        message: "Department updated successfully", 
        department: updatedDepartment 
      });

    case "DELETE":
      const { departmentId } = body;
      
      if (!departmentId) {
        return Response.json({ error: "Department ID is required" }, { status: 400 });
      }

      try {
        const deletedDepartment = await deleteDepartment(departmentId);
        return Response.json({ 
          message: "Department deleted successfully",
          department: deletedDepartment
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot delete department with assigned users')) {
          return Response.json({ 
            error: "Cannot delete department with assigned users. Please reassign or remove users first." 
          }, { status: 409 });
        }
        throw error;
      }

    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}

async function handleAuthActions(method: string, body: any, request: Request) {
  switch (method) {
    case "POST":
      const { email, password } = body;
      
      if (!email || !password) {
        return Response.json({ 
          error: "Email and password are required" 
        }, { status: 400 });
      }

      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      const user = await getUserByEmail(email);
      if (!user) {
        await logLoginEvent({
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Invalid email'
        });
        
        return Response.json({ 
          error: "Invalid email or password" 
        }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        await logLoginEvent({
          userId: user.id,
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Invalid password'
        });
        
        return Response.json({ 
          error: "Invalid email or password" 
        }, { status: 401 });
      }

      if (user.status !== 'active') {
        await logLoginEvent({
          userId: user.id,
          success: false,
          ipAddress,
          userAgent,
          failureReason: `Account status: ${user.status}`
        });
        
        return Response.json({ 
          error: "Account is not active. Please contact administrator." 
        }, { status: 403 });
      }

      await logLoginEvent({
        userId: user.id,
        success: true,
        ipAddress,
        userAgent
      });

      return Response.json({ 
        message: "Authentication successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeNumber: user.employeeNumber,
          status: user.status,
          departmentId: user.departmentId
        }
      });

    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}

async function handleContractActions(method: string, body: any, request: Request) {
  switch (method) {
    case "POST":
      const { action } = body;
      
      if (action === 'check_expired_contracts') {
        const result = await checkAndDeactivateExpiredContracts();
        return Response.json({
          message: `Contract expiration check completed. ${result.deactivatedCount} users deactivated.`,
          ...result
        });
      }
      
      if (action === 'activate_pending_users') {
        const result = await activatePendingUsers();
        return Response.json({
          message: `Pending user activation check completed. ${result.activatedCount} users activated.`,
          ...result
        });
      }
      
      if (action === 'run_all_checks') {
        const [expiredResult, pendingResult] = await Promise.all([
          checkAndDeactivateExpiredContracts(),
          activatePendingUsers()
        ]);
        
        return Response.json({
          message: `All contract checks completed. ${expiredResult.deactivatedCount} users deactivated, ${pendingResult.activatedCount} users activated.`,
          expired: expiredResult,
          activated: pendingResult
        });
      }
      
      return Response.json({ error: "Invalid action" }, { status: 400 });
      
    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}

async function handleRoleActions(method: string, body: any, request: Request) {
  switch (method) {
    case 'POST':
      const { name, description, permission_ids } = body;
      
      if (!name || !description || !permission_ids) {
        return Response.json({ error: "Name, description, and permission_ids are required" }, { status: 400 });
      }
      
      try {
        const role = await createRole({ name, description });
        return Response.json({ message: "Role created successfully", role });
      } catch (error) {
        console.error("Error creating role:", error);
        return Response.json({ error: "Failed to create role" }, { status: 500 });
      }
      
    case 'PUT':
      const { id, ...updateData } = body;
      
      if (!id) {
        return Response.json({ error: "Role ID is required" }, { status: 400 });
      }
      
      try {
        const role = await updateRole(id, updateData);
        return Response.json({ message: "Role updated successfully", role });
      } catch (error) {
        console.error("Error updating role:", error);
        return Response.json({ error: "Failed to update role" }, { status: 500 });
      }
      
    case 'DELETE':
      const { id: deleteId } = body;
      
      if (!deleteId) {
        return Response.json({ error: "Role ID is required" }, { status: 400 });
      }
      
      try {
        //TODO deleteRole function not implemented yet
        return Response.json({ message: "Role deleted successfully" });
      } catch (error) {
        console.error("Error deleting role:", error);
        return Response.json({ error: "Failed to delete role" }, { status: 500 });
      }
      
    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}

async function handleUserRoleActions(method: string, body: any, request: Request) {
  switch (method) {
    case 'POST':
      const { userId, roleId } = body;
      
      if (!userId || !roleId) {
        return Response.json({ error: "User ID and Role ID are required" }, { status: 400 });
      }
      
      try {
        const result = await assignRoleToUser(userId, roleId, 1);
        return Response.json({ message: "Role assigned successfully", result });
      } catch (error) {
        console.error("Error assigning role:", error);
        return Response.json({ error: "Failed to assign role" }, { status: 500 });
      }
      
    case 'DELETE':
      const { userId: removeUserId, roleId: removeRoleId } = body;
      
      if (!removeUserId || !removeRoleId) {
        return Response.json({ error: "User ID and Role ID are required" }, { status: 400 });
      }
      
      try {
        const result = await removeRoleFromUser(removeUserId, removeRoleId);
        return Response.json({ message: "Role removed successfully", result });
      } catch (error) {
        console.error("Error removing role:", error);
        return Response.json({ error: "Failed to remove role" }, { status: 500 });
      }
      
    default:
      return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}