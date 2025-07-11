import React, { useState } from 'react'
import { CopilotChat } from './SimpleCopilotChat'
import { ResizableLayout } from './SimpleResizableLayout'
import { mockLegacyConfig, mockAIConfig, mockResponses } from '../utils/mockData'
import OpenAITest from './OpenAITest'
import EnvironmentDetectionTest from './EnvironmentDetectionTest'
import IntegrationTest from './IntegrationTest'

export function TestingDashboard() {
  const [activeTab, setActiveTab] = useState<'components' | 'environment' | 'integration'>('components')

  const tabs = [
    { id: 'components' as const, label: 'Component Tests', icon: '🧪' },
    { id: 'environment' as const, label: 'Environment Tests', icon: '🌍' },
    { id: 'integration' as const, label: 'Integration Tests', icon: '🔧' }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🚀 Copilot Package Testing Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive testing environment for AI copilot components. Use this dashboard 
          to test all features before deploying to production.
        </p>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Components</p>
              <p className="text-xl font-bold text-gray-800">6</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">🎨</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Themes</p>
              <p className="text-xl font-bold text-gray-800">9</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">🌍</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Frameworks</p>
              <p className="text-xl font-bold text-gray-800">6+</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-semibold">🔧</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test Status</p>
              <p className="text-xl font-bold text-green-600">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'components' && (
        <>
          {/* Quick Test Examples */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Legacy Configuration Test */}
            <div className="component-showcase">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Legacy Configuration</h3>
                <p className="text-sm text-gray-600">Testing legacy copilot config format</p>
              </div>
              <div className="p-4">
                <CopilotChat 
                  config={mockLegacyConfig}
                  onSendMessage={mockResponses.basic}
                />
              </div>
            </div>

            {/* AI Configuration Test */}
            <div className="component-showcase">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">AI Configuration</h3>
                <p className="text-sm text-gray-600">Testing advanced AI config format</p>
              </div>
              <div className="p-4">
                <CopilotChat 
                  config={mockAIConfig}
                  onSendMessage={mockResponses.ai}
                />
              </div>
            </div>
          </div>

          {/* OpenAI Provider Test */}
          <div className="component-showcase">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">🤖 OpenAI Provider Test</h3>
              <p className="text-sm text-gray-600">Testing real OpenAI integration - requires API key</p>
            </div>
            <div className="p-4">
              <OpenAITest />
            </div>
          </div>

          {/* Resizable Layout Demo */}
          <div className="component-showcase">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Resizable Layout Demo</h3>
              <p className="text-sm text-gray-600">Testing resizable layout with chat and content panels</p>
            </div>
            <div className="h-96">
              <ResizableLayout
                leftPanel={
                  <CopilotChat 
                    config={{
                      ...mockLegacyConfig,
                      title: "Assistant",
                      color: "emerald"
                    }}
                    onSendMessage={mockResponses.basic}
                  />
                }
                rightPanel={
                  <div className="p-4 bg-gray-50 h-full">
                    <h4 className="font-semibold mb-3">Content Panel</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-sm">Document 1</h5>
                        <p className="text-xs text-gray-600">Sample content for testing...</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-sm">Document 2</h5>
                        <p className="text-xs text-gray-600">More sample content...</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-sm">Document 3</h5>
                        <p className="text-xs text-gray-600">Additional test content...</p>
                      </div>
                    </div>
                  </div>
                }
                defaultLeftWidth={40}
                minLeftWidth={25}
                maxLeftWidth={75}
              />
            </div>
          </div>

          {/* Test Instructions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Testing Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🧪 What to Test</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Chat message sending and receiving</li>
                  <li>• Theme color variations</li>
                  <li>• Resizable layout functionality</li>
                  <li>• Configuration validation</li>
                  <li>• Error handling</li>
                  <li>• Mobile responsiveness</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎯 Key Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multiple configuration formats</li>
                  <li>• 9 color themes available</li>
                  <li>• Enterprise security features</li>
                  <li>• Performance monitoring</li>
                  <li>• Memory scope management</li>
                  <li>• Custom provider support</li>
                  <li>• Framework-agnostic environment detection</li>
                  <li>• Comprehensive integration testing</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Environment Tests Tab */}
      {activeTab === 'environment' && (
        <div className="space-y-6">
          <EnvironmentDetectionTest />
        </div>
      )}

      {/* Integration Tests Tab */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <IntegrationTest />
        </div>
      )}
    </div>
  )
} 