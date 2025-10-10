import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DataTable, Button, Card, CardContent, Input, Select, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { AUDIT_TABLE_COLUMNS, LOGIN_EVENTS_TABLE_COLUMNS } from '../utils/constants';
import { 
  fetchAuditLogs, 
  fetchLoginEvents, 
  exportAuditData, 
  fetchUsers 
} from '../lib/api';
import { ProtectedRoute } from '../components/ProtectedRoute';
import type { AuditLog, LoginEvent, User, AuditAction, AuditStatus } from '../types';

interface AuditFilters {
  startDate: string;
  endDate: string;
  userId: number | null;
  action: string;
  success: boolean | null;
}

interface CombinedAuditEntry {
  id: string;
  type: 'audit' | 'login';
  timestamp: string;
  user: string;
  action: string;
  target?: string;
  status: string;
  details?: string;
  ip?: string;
  userAgent?: string;
}

export default function AuditPage() {
  const { hasPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedAuditEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'all' | 'audit' | 'login'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState<AuditFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: null,
    action: '',
    success: null
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [auditData, loginData, usersData] = await Promise.all([
        fetchAuditLogs({
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.userId || undefined,
          action: filters.action || undefined,
          limit: 100
        }),
        fetchLoginEvents({
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.userId || undefined,
          success: filters.success !== null ? filters.success : undefined,
          limit: 100
        }),
        fetchUsers()
      ]);
      
      setAuditLogs(auditData);
      setLoginEvents(loginData);
      setUsers(usersData);
      
      const combined: CombinedAuditEntry[] = [
        ...auditData.map((entry: AuditLog) => ({
          id: `audit_${entry.id}`,
          type: 'audit' as const,
          timestamp: entry.created_at,
          user: entry.user?.name || 'System',
          action: entry.action,
          target: entry.target_user?.name || '',
          status: entry.status === 'success' ? 'Success' : 'Failed',
          details: entry.details || ''
        })),
        ...loginData.map((entry: LoginEvent) => ({
          id: `login_${entry.id}`,
          type: 'login' as const,
          timestamp: entry.occurred_at,
          user: entry.user?.name || 'Unknown User',
          action: entry.success ? 'Login Success' : 'Login Failed',
          target: entry.user?.email || '',
          status: entry.success ? 'Success' : 'Failed',
          details: entry.success ? '' : `Failed login attempt`,
          ip: entry.ip,
          userAgent: entry.user_agent
        }))
      ];
      
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setCombinedData(combined);
    } catch (error) {
      console.error('Error loading audit data:', error);
      alert('Failed to load audit data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setExportLoading(true);
      await exportAuditData({
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        format
      });
    } catch (error) {
      console.error('Error exporting audit data:', error);
      alert('Failed to export audit data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const getFilteredData = () => {
    let data = combinedData;
    
    if (activeTab !== 'all') {
      data = data.filter(item => item.type === activeTab);
    }
    
    if (searchTerm) {
      data = data.filter(item => 
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return data;
  };

  const auditColumns = [
    { 
      key: 'timestamp', 
      label: 'Date/Time', 
      sortable: true, 
      width: '150px',
      render: (value: string | Date) => {
        try {
          const date = typeof value === 'string' ? new Date(value) : value;
          return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
        } catch {
          return 'Invalid date';
        }
      }
    },
    { key: 'user', label: 'User', sortable: true },
    { 
      key: 'action', 
      label: 'Action', 
      sortable: true, 
      width: '150px',
      render: (value: string, row: CombinedAuditEntry) => (
        <div className="flex items-center space-x-2">
          <Badge variant={row.type === 'audit' ? 'info' : 'success'}>
            {row.type}
          </Badge>
          <span>{value}</span>
        </div>
      )
    },
    { key: 'target', label: 'Target', sortable: false },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true, 
      width: '100px',
      render: (value: string) => (
        <Badge variant={value === 'Success' ? 'success' : 'danger'}>
          {value}
        </Badge>
      )
    },
    { key: 'details', label: 'Details', sortable: false }
  ];

  if (!hasPermission('audit:read')) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-8">
            <p className="text-gray-500">You do not have permission to access this page.</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 max-w-full">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
              <p className="mt-2 text-sm text-gray-700">
                Monitor system activities and user actions for compliance and security
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                loading={exportLoading}
                disabled={exportLoading}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('xlsx')}
                loading={exportLoading}
                disabled={exportLoading}
              >
                Export Excel
              </Button>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Events', count: combinedData.length },
                { key: 'audit', label: 'Audit Logs', count: auditLogs.length },
                { key: 'login', label: 'Login Events', count: loginEvents.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <DataTable
                data={getFilteredData()}
                columns={auditColumns}
                loading={loading}
                emptyMessage={`No ${activeTab === 'all' ? 'audit events' : activeTab + ' events'} found`}
                pageSize={20}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{combinedData.length}</div>
                  <div className="text-sm text-gray-500">Total Events</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {combinedData.filter(item => item.status === 'Success').length}
                  </div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {combinedData.filter(item => item.status === 'Failed').length}
                  </div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {new Set(combinedData.map(item => item.user)).size}
                  </div>
                  <div className="text-sm text-gray-500">Unique Users</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}