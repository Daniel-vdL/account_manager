import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = {
    totalUsers: 1247,
    activeUsers: 1156,
    blockedUsers: 23,
    pendingUsers: 68,
    totalDepartments: 12,
    totalRoles: 8,
    recentLogins: 89,
    failedLogins: 5
  };

  const recentActivity = [
    {
      id: 1,
      action: 'User Created',
      user: 'John Doe',
      target: 'Alice Johnson',
      timestamp: '2024-10-07T10:30:00Z',
      status: 'success'
    },
    {
      id: 2,
      action: 'Role Assigned',
      user: 'Jane Smith',
      target: 'Bob Wilson',
      timestamp: '2024-10-07T09:45:00Z',
      status: 'success'
    },
    {
      id: 3,
      action: 'Login Failed',
      user: 'Unknown',
      target: 'system@company.com',
      timestamp: '2024-10-07T09:15:00Z',
      status: 'failed'
    },
    {
      id: 4,
      action: 'User Blocked',
      user: 'Admin',
      target: 'Charlie Brown',
      timestamp: '2024-10-07T08:30:00Z',
      status: 'warning'
    }
  ];

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
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.182 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    5 failed login attempts in the last hour
                  </p>
                  <p className="text-xs text-yellow-700">Monitor for potential security threats</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    All systems operational
                  </p>
                  <p className="text-xs text-green-700">Security monitoring active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}