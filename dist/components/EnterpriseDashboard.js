import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useSecurityPolicy } from '../hooks/useSecurityPolicy';
import { useMemoryScope } from '../hooks/useMemoryScope';
const EnterpriseDashboard = ({ config, className = '', refreshInterval = 30, theme = 'light' }) => {
    var _a;
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('24h');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
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
    });
    // Convert simple security config to complex format
    const convertSecurityConfig = (simpleConfig = {}) => {
        const complexConfig = {
            auditSettings: {
                enabled: simpleConfig.auditLogging || false,
                retention: simpleConfig.dataRetention || 365,
                encryption: simpleConfig.encryptAtRest || false,
                compression: true,
                realTimeAlerts: true
            }
        };
        // Convert simple compliance string to complex compliance object
        if (simpleConfig.compliance && simpleConfig.compliance !== 'none') {
            const frameworks = simpleConfig.compliance === 'gdpr' ? ['gdpr'] :
                simpleConfig.compliance === 'hipaa' ? ['hipaa'] :
                    simpleConfig.compliance === 'sox' ? ['sox'] :
                        ['gdpr']; // default fallback
            complexConfig.compliance = {
                framework: frameworks,
                autoRemediation: false,
                reportingSchedule: 'weekly',
                contactEmail: 'security@company.com'
            };
        }
        return complexConfig;
    };
    // Initialize hooks
    const securityHook = useSecurityPolicy(convertSecurityConfig(config.security));
    const memoryHook = useMemoryScope({});
    // Refresh dashboard data
    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [securityMetrics, memoryStats] = await Promise.all([
                securityHook.getDashboardMetrics(),
                memoryHook.getStats()
            ]);
            // Calculate system health
            const threatLevel = securityMetrics.overview.threatLevel;
            const activeIncidents = securityMetrics.overview.activeIncidents;
            const complianceScore = securityMetrics.overview.complianceScore;
            let systemHealth = 'healthy';
            if (threatLevel === 'critical' || activeIncidents > 5 || complianceScore < 70) {
                systemHealth = 'critical';
            }
            else if (threatLevel === 'high' || activeIncidents > 2 || complianceScore < 85) {
                systemHealth = 'warning';
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
            });
        }
        catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
        finally {
            setIsRefreshing(false);
        }
    }, [securityHook, memoryHook]);
    // Auto-refresh
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [refreshData, refreshInterval]);
    // Health status color
    const getHealthColor = (health) => {
        switch (health) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    // Metric card component
    const MetricCard = ({ title, value, change, icon, color = 'blue' }) => (_jsx("div", { className: `bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500 ${theme === 'dark' ? 'bg-gray-800 text-white' : ''}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: `text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`, children: title }), _jsx("p", { className: `text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: value }), change !== undefined && (_jsxs("p", { className: `text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [change >= 0 ? '+' : '', change.toFixed(1), "% from last period"] }))] }), icon && (_jsx("div", { className: `text-3xl text-${color}-500`, children: icon }))] }) }));
    // Alert list component
    const AlertList = ({ alerts }) => (_jsx("div", { className: "space-y-3", children: alerts.length === 0 ? (_jsx("p", { className: `text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`, children: "No recent alerts" })) : (alerts.map((alert) => (_jsx("div", { className: `p-4 rounded-lg border-l-4 ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'error' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'} ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `font-medium ${alert.severity === 'critical' ? 'text-red-800' :
                                    alert.severity === 'error' ? 'text-orange-800' :
                                        alert.severity === 'warning' ? 'text-yellow-800' :
                                            'text-blue-800'} ${theme === 'dark' ? 'text-white' : ''}`, children: alert.details.description }), _jsxs("p", { className: `text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`, children: [alert.timestamp.toLocaleString(), " \u2022 Risk Score: ", Math.round(alert.details.riskScore * 100), "%"] })] }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                                alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'}`, children: alert.severity.toUpperCase() })] }) }, alert.id)))) }));
    // Tab navigation
    const TabButton = ({ id, label, active }) => (_jsx("button", { onClick: () => setActiveTab(id), className: `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active
            ? theme === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700'
            : theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`, children: label }));
    const renderOverview = () => {
        var _a;
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "System Health", value: stats.system.overall.toUpperCase(), icon: "\u26A1", color: stats.system.overall === 'healthy' ? 'green' :
                                stats.system.overall === 'warning' ? 'yellow' : 'red' }), _jsx(MetricCard, { title: "Uptime", value: `${stats.system.uptime.toFixed(2)}%`, icon: "\u23F1\uFE0F", color: "blue" }), _jsx(MetricCard, { title: "Response Time", value: `${stats.system.responseTime}ms`, icon: "\uD83D\uDE80", color: "purple" }), _jsx(MetricCard, { title: "Active Users", value: stats.system.activeUsers, icon: "\uD83D\uDC65", color: "indigo" })] }), stats.security && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(MetricCard, { title: "Security Threats", value: stats.security.overview.activeIncidents, icon: "\uD83D\uDD12", color: "red" }), _jsx(MetricCard, { title: "Compliance Score", value: `${stats.security.overview.complianceScore}%`, icon: "\uD83D\uDCCB", color: "green" }), _jsx(MetricCard, { title: "Blocked Attacks", value: stats.security.overview.blockedAttacks, icon: "\uD83D\uDEE1\uFE0F", color: "orange" })] })), _jsxs("div", { className: `bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: [_jsx("h3", { className: `text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: "Recent Security Alerts" }), _jsx(AlertList, { alerts: ((_a = stats.security) === null || _a === void 0 ? void 0 : _a.recentEvents) || [] })] })] }));
    };
    const renderSecurity = () => (_jsx("div", { className: "space-y-6", children: stats.security && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "Threat Level", value: stats.security.overview.threatLevel.toUpperCase(), icon: "\u26A0\uFE0F", color: stats.security.overview.threatLevel === 'critical' ? 'red' :
                                stats.security.overview.threatLevel === 'high' ? 'orange' :
                                    stats.security.overview.threatLevel === 'medium' ? 'yellow' : 'green' }), _jsx(MetricCard, { title: "Active Incidents", value: stats.security.overview.activeIncidents, icon: "\uD83D\uDEA8", color: "red" }), _jsx(MetricCard, { title: "Total Events", value: stats.security.overview.totalEvents, icon: "\uD83D\uDCCA", color: "blue" }), _jsx(MetricCard, { title: "Compliance Score", value: `${stats.security.overview.complianceScore}%`, icon: "\u2705", color: "green" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "Active Users", value: stats.security.realtime.activeUsers, icon: "\uD83D\uDC64", color: "indigo" }), _jsx(MetricCard, { title: "Suspicious Activities", value: stats.security.realtime.suspiciousActivities, icon: "\uD83D\uDD0D", color: "yellow" }), _jsx(MetricCard, { title: "Data Transfers", value: stats.security.realtime.dataTransfers, icon: "\uD83D\uDCE1", color: "purple" }), _jsx(MetricCard, { title: "Auth Failures", value: stats.security.realtime.authenticationFailures, icon: "\uD83D\uDD10", color: "red" })] }), _jsxs("div", { className: `bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: [_jsxs("h3", { className: `text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: ["Top Threats (", timeRange, ")"] }), _jsx("div", { className: "space-y-3", children: stats.security.topThreats.length === 0 ? (_jsx("p", { className: `text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`, children: "No threats detected" })) : (stats.security.topThreats.map((threat, index) => (_jsxs("div", { className: `flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`, children: [_jsxs("div", { children: [_jsx("p", { className: `font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: threat.type.replace(/_/g, ' ').toUpperCase() }), _jsxs("p", { className: `text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`, children: ["Last seen: ", threat.lastOccurrence.toLocaleString()] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: `font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: threat.count }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${threat.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                    threat.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        threat.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'}`, children: threat.severity })] })] }, `${threat.type}-${index}`)))) })] }), _jsxs("div", { className: `bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: [_jsx("h3", { className: `text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: "Security Event Log" }), _jsx(AlertList, { alerts: stats.security.recentEvents })] })] })) }));
    const renderMemory = () => (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.memory.map((scopeStats) => (_jsx(MetricCard, { title: `${scopeStats.scope.toUpperCase()} Scope`, value: `${scopeStats.totalEntries} entries`, icon: "\uD83D\uDCBE", color: "cyan" }, scopeStats.scope))) }), _jsxs("div", { className: `bg-white rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: `text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: "Memory Scope Details" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50', children: _jsxs("tr", { children: [_jsx("th", { className: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: "Scope" }), _jsx("th", { className: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: "Entries" }), _jsx("th", { className: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: "Size" }), _jsx("th", { className: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: "Hit Rate" }), _jsx("th", { className: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: "Sync Status" })] }) }), _jsx("tbody", { className: `divide-y divide-gray-200 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`, children: stats.memory.map((scopeStats) => (_jsxs("tr", { children: [_jsx("td", { className: `px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: scopeStats.scope }), _jsx("td", { className: `px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: scopeStats.totalEntries.toLocaleString() }), _jsxs("td", { className: `px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: [(scopeStats.totalSize / (1024 * 1024)).toFixed(2), " MB"] }), _jsxs("td", { className: `px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`, children: [(scopeStats.hitRate * 100).toFixed(1), "%"] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 text-xs font-semibold rounded-full ${scopeStats.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
                                                        scopeStats.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            scopeStats.syncStatus === 'error' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`, children: scopeStats.syncStatus }) })] }, scopeStats.scope))) })] }) })] })] }));
    return (_jsxs("div", { className: `enterprise-dashboard ${className} ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen`, children: [_jsx("div", { className: `bg-white shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'border-b'}`, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsxs("div", { children: [_jsx("h1", { className: `text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: "Enterprise Dashboard" }), _jsxs("p", { className: `text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`, children: [config.name, " \u2022 Last updated: ", stats.system.lastUpdate.toLocaleString()] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("select", { value: timeRange, onChange: (e) => setTimeRange(e.target.value), className: `px-3 py-2 border rounded-md text-sm ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300'}`, children: [_jsx("option", { value: "1h", children: "Last Hour" }), _jsx("option", { value: "24h", children: "Last 24 Hours" }), _jsx("option", { value: "7d", children: "Last 7 Days" }), _jsx("option", { value: "30d", children: "Last 30 Days" })] }), _jsx("button", { onClick: refreshData, disabled: isRefreshing, className: `px-4 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'}`, children: isRefreshing ? 'Refreshing...' : 'Refresh' }), _jsx("div", { className: `px-3 py-2 rounded-md text-sm font-medium ${getHealthColor(stats.system.overall)}`, children: stats.system.overall.toUpperCase() })] })] }) }) }), _jsx("div", { className: `bg-white shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'border-b'}`, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex space-x-1 py-4", children: [_jsx(TabButton, { id: "overview", label: "Overview", active: activeTab === 'overview' }), _jsx(TabButton, { id: "security", label: "Security", active: activeTab === 'security' }), _jsx(TabButton, { id: "performance", label: "Performance", active: activeTab === 'performance' }), _jsx(TabButton, { id: "memory", label: "Memory", active: activeTab === 'memory' }), _jsx(TabButton, { id: "alerts", label: "Alerts", active: activeTab === 'alerts' })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [activeTab === 'overview' && renderOverview(), activeTab === 'security' && renderSecurity(), activeTab === 'memory' && renderMemory(), activeTab === 'performance' && (_jsx("div", { className: `text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`, children: "Performance monitoring implementation in progress..." })), activeTab === 'alerts' && (_jsxs("div", { className: `bg-white rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : ''}`, children: [_jsx("h3", { className: `text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`, children: "All Security Alerts" }), _jsx(AlertList, { alerts: ((_a = stats.security) === null || _a === void 0 ? void 0 : _a.recentEvents) || [] })] }))] })] }));
};
export default EnterpriseDashboard;
