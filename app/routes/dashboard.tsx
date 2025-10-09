import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardStats, fetchRecentActivity, fetchSecurityAlerts } from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    pendingUsers: 0,
    totalDepartments: 0,
    totalRoles: 0,
    recentLogins: 0,
    failedLogins: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, activityData, alertsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentActivity(8),
          fetchSecurityAlerts()
        ]);
        
        setStats({
          totalUsers: dashboardStats.totalUsers,
          activeUsers: dashboardStats.activeUsers,
          blockedUsers: dashboardStats.blockedUsers,
          pendingUsers: dashboardStats.pendingUsers,
          totalDepartments: dashboardStats.totalDepartments,
          totalRoles: dashboardStats.totalRoles,
          recentLogins: dashboardStats.recentLogins,
          failedLogins: dashboardStats.failedLogins
        });
        
        setRecentActivity(activityData);
        setSecurityAlerts(alertsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, description, variant = 'default' }: {
    title: string;
    value: number;
    description: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  }) => {
    const colors = {
      default: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={`text-2xl font-bold ${colors[variant]}`}>
                {value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-blue-700 mt-1">
            Here's what's happening in your account management system today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            description="All registered users"
            variant="default"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            description="Currently active"
            variant="success"
          />
          <StatCard
            title="Blocked Users"
            value={stats.blockedUsers}
            description="Restricted access"
            variant="danger"
          />
          <StatCard
            title="Pending Users"
            value={stats.pendingUsers}
            description="Awaiting approval"
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Departments</span>
                  <Badge variant="info">{stats.totalDepartments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Roles</span>
                  <Badge variant="info">{stats.totalRoles}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Logins (24h)</span>
                  <Badge variant="success">{stats.recentLogins}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed Logins (24h)</span>
                  <Badge variant="danger">{stats.failedLogins}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          activity.status === 'success' ? 'success' :
                          activity.status === 'failed' ? 'danger' :
                          activity.status === 'warning' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {activity.action}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>
                        {activity.target && (
                          <>
                            {' → '}
                            <span className="font-medium">{activity.target}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.map((alert) => {
                const alertColors: Record<string, string> = {
                  success: 'bg-green-50 border-green-200 text-green-800',
                  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                  danger: 'bg-red-50 border-red-200 text-red-800'
                };
                
                const iconColors: Record<string, string> = {
                  success: 'text-green-600',
                  warning: 'text-yellow-600',
                  danger: 'text-red-600'
                };
                
                const descriptionColors: Record<string, string> = {
                  success: 'text-green-700',
                  warning: 'text-yellow-700',
                  danger: 'text-red-700'
                };

                const alertType = alert.type || 'warning';

                return (
                  <div key={alert.id} className={`flex items-center p-3 ${alertColors[alertType] || alertColors.warning} border rounded-md`}>
                    {alertType === 'success' ? (
                      <svg className={`w-5 h-5 ${iconColors[alertType] || iconColors.warning} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${iconColors[alertType] || iconColors.warning} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.182 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    <div>
                      <p className={`text-sm font-medium`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs ${descriptionColors[alertType] || descriptionColors.warning}`}>{alert.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
    </ProtectedRoute>
  );
}