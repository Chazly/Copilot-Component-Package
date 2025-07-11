import React, { useState, useEffect } from 'react'
import { CopilotChat } from './SimpleCopilotChat'
import { mockEnterpriseConfig, mockResponses } from '../utils/mockData'

export function EnterpriseFeatureTest() {
  const [securityMetrics, setSecurityMetrics] = useState({
    threatLevel: 'Low',
    blockedRequests: 0,
    piiDetections: 0,
    complianceScore: 98
  })

  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: 850,
    uptime: 99.9,
    requestsPerMinute: 45,
    errorRate: 0.02
  })

  const [memoryUsage, setMemoryUsage] = useState({
    sessionMemory: 12.5,
    userMemory: 45.8,
    organizationMemory: 156.3
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        responseTime: Math.floor(Math.random() * 200) + 700,
        uptime: 99.5 + Math.random() * 0.5,
        requestsPerMinute: Math.floor(Math.random() * 30) + 35,
        errorRate: Math.random() * 0.05
      }))

      setSecurityMetrics(prev => ({
        ...prev,
        blockedRequests: prev.blockedRequests + (Math.random() > 0.7 ? 1 : 0),
        piiDetections: prev.piiDetections + (Math.random() > 0.9 ? 1 : 0)
      }))

      setMemoryUsage(prev => ({
        sessionMemory: Math.max(0, prev.sessionMemory + (Math.random() - 0.5) * 2),
        userMemory: Math.max(0, prev.userMemory + (Math.random() - 0.5) * 5),
        organizationMemory: Math.max(0, prev.organizationMemory + (Math.random() - 0.5) * 10)
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🏢 Enterprise Features Testing
        </h1>
        <p className="text-gray-600">
          Test advanced enterprise security, performance monitoring, and memory management features.
        </p>
      </div>

      {/* Security Dashboard */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🔒 Security Monitoring
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Active
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Threat Level</div>
            <div className="text-xl font-bold text-green-600">{securityMetrics.threatLevel}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Blocked Requests</div>
            <div className="text-xl font-bold text-orange-600">{securityMetrics.blockedRequests}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">PII Detections</div>
            <div className="text-xl font-bold text-purple-600">{securityMetrics.piiDetections}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Compliance Score</div>
            <div className="text-xl font-bold text-blue-600">{securityMetrics.complianceScore}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Security Policies</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Data Encryption</span>
                <span className="text-green-600">✓ AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span>Audit Logging</span>
                <span className="text-green-600">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>PII Protection</span>
                <span className="text-green-600">✓ Auto-detection</span>
              </div>
              <div className="flex justify-between">
                <span>Compliance</span>
                <span className="text-green-600">✓ GDPR, HIPAA</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Recent Security Events</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Successful authentication</span>
                <span>2 min ago</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>PII detection in message</span>
                <span>5 min ago</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Rate limit triggered</span>
                <span>12 min ago</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Audit log exported</span>
                <span>1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⚡ Performance Monitoring
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Real-time
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Response Time</div>
            <div className={`text-xl font-bold ${getStatusColor(performanceMetrics.responseTime, { good: 800, warning: 1200 })}`}>
              {performanceMetrics.responseTime}ms
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="text-xl font-bold text-green-600">{performanceMetrics.uptime.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Requests/min</div>
            <div className="text-xl font-bold text-blue-600">{performanceMetrics.requestsPerMinute}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Error Rate</div>
            <div className={`text-xl font-bold ${getStatusColor(performanceMetrics.errorRate * 100, { good: 1, warning: 3 })}`}>
              {(performanceMetrics.errorRate * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Optimization Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Response Caching</span>
                <span className="text-green-600">✓ Enabled (300s TTL)</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Scaling</span>
                <span className="text-gray-600">○ Disabled</span>
              </div>
              <div className="flex justify-between">
                <span>Compression</span>
                <span className="text-green-600">✓ GZIP</span>
              </div>
              <div className="flex justify-between">
                <span>CDN</span>
                <span className="text-green-600">✓ Active</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Alert Thresholds</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Response Time</span>
                <span>&lt; 1000ms</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate</span>
                <span>&lt; 5%</span>
              </div>
              <div className="flex justify-between">
                <span>Resource Usage</span>
                <span>&lt; 80%</span>
              </div>
              <div className="flex justify-between">
                <span>Queue Length</span>
                <span>&lt; 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Management */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🧠 Memory Management
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            Multi-scope
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Session Memory</div>
            <div className="text-xl font-bold text-blue-600">{memoryUsage.sessionMemory.toFixed(1)} MB</div>
            <div className="text-xs text-gray-500 mt-1">Max: 50 MB</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">User Memory</div>
            <div className="text-xl font-bold text-green-600">{memoryUsage.userMemory.toFixed(1)} MB</div>
            <div className="text-xs text-gray-500 mt-1">Max: 200 MB</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Organization Memory</div>
            <div className="text-xl font-bold text-purple-600">{memoryUsage.organizationMemory.toFixed(1)} MB</div>
            <div className="text-xs text-gray-500 mt-1">Max: 1024 MB</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Scope Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Default Scope</span>
                <span className="text-blue-600">User</span>
              </div>
              <div className="flex justify-between">
                <span>Cross-device Sync</span>
                <span className="text-green-600">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Conflict Resolution</span>
                <span className="text-gray-600">Last-write-wins</span>
              </div>
              <div className="flex justify-between">
                <span>Compression</span>
                <span className="text-green-600">✓ Active</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Retention Policies</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Session Data</span>
                <span>24 hours</span>
              </div>
              <div className="flex justify-between">
                <span>User Data</span>
                <span>30 days</span>
              </div>
              <div className="flex justify-between">
                <span>Organization Data</span>
                <span>90 days</span>
              </div>
              <div className="flex justify-between">
                <span>Cleanup Schedule</span>
                <span>Daily at 2:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Enterprise Chat Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="component-showcase">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Enterprise Copilot</h3>
            <p className="text-sm text-gray-600">Full enterprise configuration with security and monitoring</p>
          </div>
          <div className="p-4">
            <CopilotChat
              config={mockEnterpriseConfig}
              onSendMessage={mockResponses.ai}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Enterprise Features Summary</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🔐 Security Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time threat detection</li>
                <li>• PII auto-detection and masking</li>
                <li>• Comprehensive audit logging</li>
                <li>• Multi-framework compliance</li>
                <li>• End-to-end encryption</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">📊 Performance Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time monitoring dashboard</li>
                <li>• Automated alerting system</li>
                <li>• Response caching optimization</li>
                <li>• Custom metrics tracking</li>
                <li>• User journey analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🧠 Memory Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-scope memory management</li>
                <li>• Cross-device synchronization</li>
                <li>• Intelligent retention policies</li>
                <li>• Data compression</li>
                <li>• Conflict resolution</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 