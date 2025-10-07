import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthContextType, LoginCredentials, Permission, Role } from '../types';
import { session, handleApiError } from '../utils/helpers';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_USER'; payload: AuthUser }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.type === 'SESSION_EXPIRED' ? 'Your session has expired. Please log in again.' : null
      };
    case 'REFRESH_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (state.isAuthenticated) {
      const checkSession = () => {
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          const lastActivityDate = new Date(lastActivity);
          if (session.isExpired(lastActivityDate)) {
            dispatch({ type: 'SESSION_EXPIRED' });
            session.clearSession();
            return;
          }
        }
        timeoutId = setTimeout(checkSession, 60000);
      };

      checkSession();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userString = localStorage.getItem('authUser');
        const lastActivity = localStorage.getItem('lastActivity');

        if (token && userString && lastActivity) {
          const lastActivityDate = new Date(lastActivity);
          
          if (session.isExpired(lastActivityDate)) {
            session.clearSession();
            dispatch({ type: 'SESSION_EXPIRED' });
            return;
          }

          const user = JSON.parse(userString) as AuthUser;
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          session.extendSession();
        } else {

          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        session.clearSession();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (credentials.email === 'admin@company.com' && credentials.password === 'admin123') {
        const mockUser: AuthUser = {
          id: 1,
          name: 'System Administrator',
          email: 'admin@company.com',
          employee_number: 'ADM001',
          department: {
            id: 1,
            name: 'IT Department',
            code: 'IT'
          },
          roles: [
            {
              id: 1,
              name: 'Administrator',
              description: 'Full system access'
            }
          ],
          permissions: [
            { id: 1, name: 'admin:all', action: 'admin:all' },
            { id: 2, name: 'user:create', action: 'user:create' },
            { id: 3, name: 'user:read', action: 'user:read' },
            { id: 4, name: 'user:update', action: 'user:update' },
            { id: 5, name: 'user:delete', action: 'user:delete' },
            { id: 6, name: 'department:create', action: 'department:create' },
            { id: 7, name: 'department:read', action: 'department:read' },
            { id: 8, name: 'role:read', action: 'role:read' },
            { id: 9, name: 'audit:read', action: 'audit:read' }
          ]
        };

        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('authUser', JSON.stringify(mockUser));
        session.extendSession();

        dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = (): void => {
    session.clearSession();
    dispatch({ type: 'LOGOUT' });
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user || !state.isAuthenticated) {
      return false;
    }

    if (state.user.permissions.some((p: Permission) => p.action === 'admin:all')) {
      return true;
    }

    return state.user.permissions.some((p: Permission) => p.action === permission);
  };

  const hasRole = (roleName: string): boolean => {
    if (!state.user || !state.isAuthenticated) {
      return false;
    }

    return state.user.roles.some((role: Role) => role.name.toLowerCase() === roleName.toLowerCase());
  };

  useEffect(() => {
    const trackActivity = () => {
      if (state.isAuthenticated) {
        session.extendSession();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    permissions: state.user?.permissions.map((p: Permission) => p.action) || [],
    hasPermission,
    hasRole,
    login,
    logout,
    isLoading: state.isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {state.error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  role, 
  fallback = <div className="p-4 text-center text-red-600">Access denied</div> 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  if (role && !hasRole(role)) {
    return fallback;
  }

  return <>{children}</>;
}