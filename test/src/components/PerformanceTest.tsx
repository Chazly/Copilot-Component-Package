import React, { useState, useEffect } from 'react'
import { CopilotChat } from './SimpleCopilotChat'
import { mockLegacyConfig, mockResponses } from '../utils/mockData'

export function PerformanceTest() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    responseTime: 0,
    messageCount: 0
  })

  useEffect(() => {
    const start = performance.now()
    const end = performance.now()
    setMetrics(prev => ({ ...prev, renderTime: end - start }))
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ⚡ Performance Testing
        </h1>
        <p className="text-gray-600">
          Monitor performance metrics and stress testing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">Render Time</div>
          <div className="text-xl font-bold text-green-600">{metrics.renderTime.toFixed(2)}ms</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">Response Time</div>
          <div className="text-xl font-bold text-blue-600">{metrics.responseTime}ms</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">Messages</div>
          <div className="text-xl font-bold text-purple-600">{metrics.messageCount}</div>
        </div>
      </div>

      <div className="component-showcase">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Performance Test</h3>
          <p className="text-sm text-gray-600">Monitor chat performance</p>
        </div>
        <div className="p-4">
          <CopilotChat
            config={mockLegacyConfig}
            onSendMessage={async (msg) => {
              const start = performance.now()
              const response = await mockResponses.basic(msg)
              const end = performance.now()
              setMetrics(prev => ({
                ...prev,
                responseTime: end - start,
                messageCount: prev.messageCount + 1
              }))
              return response
            }}
          />
        </div>
      </div>
    </div>
  )
} 