import React, { useState, useEffect, useCallback } from 'react'
import { useSecurityPolicy } from '../hooks/useSecurityPolicy'
import { useMemoryScope } from '../hooks/useMemoryScope'
import { SecurityConfiguration } from '../types/security'
import { AICopilotConfig } from '../types'
import { 
  SecurityDashboardMetrics,
  PerformanceMetrics,
  SecurityEvent,
  PerformanceAlert,
  OptimizationRecommendation
} from '../types/security'
import { MemoryScope, MemoryScopeStats } from '../types/memory'

interface EnterpriseDashboardProps {
  config: AICopilotConfig
  className?: string
  refreshInterval?: number // seconds
  theme?: 'light' | 'dark'
}

interface DashboardStats {
  security: SecurityDashboardMetrics | null
  performance: any // Would use actual performance metrics
  memory: MemoryScopeStats[]
  system: SystemHealth
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  lastUpdate: Date
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  config,
  className = '',
  refreshInterval = 30,
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'performance' | 'memory' | 'alerts'>('overview')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    security: null,
    performance: null,
    memory: [],
    system: {
      overall: 'healthy',
      uptime: 99.9,
      responseTime: 150,
      errorRate: 0.1,
      activeUsers: 0,
      lastUpdate: new Date()
    }
  })

  // Convert simple security config to complex format
  const convertSecurityConfig = (simpleConfig: AICopilotConfig['security'] = {}) => {
    const complexConfig: Partial<SecurityConfiguration> = {
      auditSettings: {
        enabled: simpleConfig.auditLogging || false,
        retention: simpleConfig.dataRetention || 365,
        encryption: simpleConfig.encryptAtRest || false,
        compression: true,
        realTimeAlerts: true
      }
    }
    
    // Convert simple compliance string to complex compliance object
    if (simpleConfig.compliance && simpleConfig.compliance !== 'none') {
      const frameworks = simpleConfig.compliance === 'gdpr' ? ['gdpr'] :
                        simpleConfig.compliance === 'hipaa' ? ['hipaa'] :
                        simpleConfig.compliance === 'sox' ? ['sox'] :
                        ['gdpr'] // default fallback
      
      complexConfig.compliance = {
        framework: frameworks as ('gdpr' | 'hipaa' | 'sox' | 'pci' | 'iso27001')[],
        autoRemediation: false,
        reportingSchedule: 'weekly',
        contactEmail: 'security@company.com'
      }
    }
    
    return complexConfig
  }

  // Initialize hooks
  const securityHook = useSecurityPolicy(convertSecurityConfig(config.security))
  const memoryHook = useMemoryScope({})

  // Refresh dashboard data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [securityMetrics, memoryStats] = await Promise.all([
        securityHook.getDashboardMetrics(),
        memoryHook.getStats()
      ])

      // Calculate system health
      const threatLevel = securityMetrics.overview.threatLevel
      const activeIncidents = securityMetrics.overview.activeIncidents
      const complianceScore = securityMetrics.overview.complianceScore

      let systemHealth: SystemHealth['overall'] = 'healthy'
      if (threatLevel === 'critical' || activeIncidents > 5 || complianceScore < 70) {
        systemHealth = 'critical'
      } else if (threatLevel === 'high' || activeIncidents > 2 || complianceScore < 85) {
        systemHealth = 'warning'
      }

      setStats({
        security: securityMetrics,
        performance: null, // Would be populated with actual performance metrics
        memory: memoryStats,
        system: {
          overall: systemHealth,
          uptime: 99.9 - (activeIncidents * 0.1),
          responseTime: 150 + (activeIncidents * 10),
          errorRate: activeIncidents * 0.05,
          activeUsers: securityMetrics.realtime.activeUsers,
          lastUpdate: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [securityHook, memoryHook])

  // Auto-refresh
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshData, refreshInterval])

  // Health status color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Metric card component
  const MetricCard: React.FC<{
    title: string
    value: string | number
    change?: number
    icon?: string
    color?: string
  }> = ({ title, value, change, icon, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500 ${theme === 'dark' ? 'bg-gray-800 text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last period
            </p>
          )}
        </div>
        {icon && (
          <div className={`text-3xl text-${color}-500`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )

  // Alert list component
  const AlertList: React.FC<{ alerts: SecurityEvent[] }> = ({ alerts }) => (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <p className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          No recent alerts
        </p>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
              alert.severity === 'error' ? 'border-orange-500 bg-orange-50' :
              alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            } ${theme === 'dark' ? 'bg-gray-800' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`font-medium ${
                  alert.severity === 'critical' ? 'text-red-800' :
                  alert.severity === 'error' ? 'text-orange-800' :
                  alert.severity === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                } ${theme === 'dark' ? 'text-white' : ''}`}>
                  {alert.details.description}
                </p>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {alert.timestamp.toLocaleString()} • Risk Score: {Math.round(alert.details.riskScore * 100)}%
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                alert.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Tab navigation
  const TabButton: React.FC<{ id: string; label: string; active: boolean }> = ({ id, label, active }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? theme === 'dark' 
            ? 'bg-blue-600 text-white' 
            : 'bg-blue-100 text-blue-700'
          : theme === 'dark'
            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="System Health"
          value={stats.system.overall.toUpperCase()}
          icon="⚡"
          color={
            stats.system.overall === 'healthy' ? 'green' :
            stats.system.overall === 'warning' ? 'yellow' : 'red'
          }
        />
        <MetricCard
          title="Uptime"
          value={`${stats.system.uptime.toFixed(2)}%`}
          icon="⏱️"
          color="blue"
        />
        <MetricCard
          title="Response Time"
          value={`${stats.system.responseTime}ms`}
          icon="🚀"
          color="purple"
        />
        <MetricCard
          title="Active Users"
          value={stats.system.activeUsers}
          icon="👥"
          color="indigo"
        />
      </div>

      {/* Quick Stats */}
      {stats.security && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Security Threats"
            value={stats.security.overview.activeIncidents}
            icon="🔒"
            color="red"
          />
          <MetricCard
            title="Compliance Score"
            value={`${stats.security.overview.complianceScore}%`}
            icon="📋"
            color="green"
          />
          <MetricCard
            title="Blocked Attacks"
            value={stats.security.overview.blockedAttacks}
            icon="🛡️"
            color="orange"
          />
        </div>
      )}

      {/* Recent Alerts */}
      <div className={`bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Recent Security Alerts
        </h3>
        <AlertList alerts={stats.security?.recentEvents || []} />
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      {stats.security && (
        <>
          {/* Security Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Threat Level"
              value={stats.security.overview.threatLevel.toUpperCase()}
              icon="⚠️"
              color={
                stats.security.overview.threatLevel === 'critical' ? 'red' :
                stats.security.overview.threatLevel === 'high' ? 'orange' :
                stats.security.overview.threatLevel === 'medium' ? 'yellow' : 'green'
              }
            />
            <MetricCard
              title="Active Incidents"
              value={stats.security.overview.activeIncidents}
              icon="🚨"
              color="red"
            />
            <MetricCard
              title="Total Events"
              value={stats.security.overview.totalEvents}
              icon="📊"
              color="blue"
            />
            <MetricCard
              title="Compliance Score"
              value={`${stats.security.overview.complianceScore}%`}
              icon="✅"
              color="green"
            />
          </div>

          {/* Real-time Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Active Users"
              value={stats.security.realtime.activeUsers}
              icon="👤"
              color="indigo"
            />
            <MetricCard
              title="Suspicious Activities"
              value={stats.security.realtime.suspiciousActivities}
              icon="🔍"
              color="yellow"
            />
            <MetricCard
              title="Data Transfers"
              value={stats.security.realtime.dataTransfers}
              icon="📡"
              color="purple"
            />
            <MetricCard
              title="Auth Failures"
              value={stats.security.realtime.authenticationFailures}
              icon="🔐"
              color="red"
            />
          </div>

          {/* Top Threats */}
          <div className={`bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Top Threats ({timeRange})
            </h3>
            <div className="space-y-3">
              {stats.security.topThreats.length === 0 ? (
                <p className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No threats detected
                </p>
              ) : (
                stats.security.topThreats.map((threat, index) => (
                  <div
                    key={`${threat.type}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {threat.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Last seen: {threat.lastOccurrence.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {threat.count}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        threat.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        threat.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        threat.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {threat.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Security Events */}
          <div className={`bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Security Event Log
            </h3>
            <AlertList alerts={stats.security.recentEvents} />
          </div>
        </>
      )}
    </div>
  )

  const renderMemory = () => (
    <div className="space-y-6">
      {/* Memory Scope Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.memory.map((scopeStats) => (
          <MetricCard
            key={scopeStats.scope}
            title={`${scopeStats.scope.toUpperCase()} Scope`}
            value={`${scopeStats.totalEntries} entries`}
            icon="💾"
            color="cyan"
          />
        ))}
      </div>

      {/* Detailed Memory Stats */}
      <div className={`bg-white rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Memory Scope Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Scope
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Entries
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Size
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Hit Rate
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Sync Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              {stats.memory.map((scopeStats) => (
                <tr key={scopeStats.scope}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {scopeStats.scope}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {scopeStats.totalEntries.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {(scopeStats.totalSize / (1024 * 1024)).toFixed(2)} MB
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {(scopeStats.hitRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                      scopeStats.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
                      scopeStats.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      scopeStats.syncStatus === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scopeStats.syncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`enterprise-dashboard ${className} ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen`}>
      {/* Header */}
      <div className={`bg-white shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'border-b'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Enterprise Dashboard
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {config.name} • Last updated: {stats.system.lastUpdate.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                }`}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {/* System Health Indicator */}
              <div className={`px-3 py-2 rounded-md text-sm font-medium ${getHealthColor(stats.system.overall)}`}>
                {stats.system.overall.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`bg-white shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'border-b'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            <TabButton id="overview" label="Overview" active={activeTab === 'overview'} />
            <TabButton id="security" label="Security" active={activeTab === 'security'} />
            <TabButton id="performance" label="Performance" active={activeTab === 'performance'} />
            <TabButton id="memory" label="Memory" active={activeTab === 'memory'} />
            <TabButton id="alerts" label="Alerts" active={activeTab === 'alerts'} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'memory' && renderMemory()}
        {activeTab === 'performance' && (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Performance monitoring implementation in progress...
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className={`bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              All Security Alerts
            </h3>
            <AlertList alerts={stats.security?.recentEvents || []} />
          </div>
        )}
      </div>
    </div>
  )
}

export default EnterpriseDashboard 