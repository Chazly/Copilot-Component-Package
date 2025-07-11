import React, { useState } from 'react'
import { CopilotChat } from './SimpleCopilotChat'
import { mockThemeConfigs, mockResponses } from '../utils/mockData'

export function CopilotTestScenarios() {
  const [activeTheme, setActiveTheme] = useState('blue')
  const [testMode, setTestMode] = useState<'normal' | 'error' | 'slow'>('normal')

  const themes = Object.keys(mockThemeConfigs)

  const getResponseHandler = () => {
    switch (testMode) {
      case 'error':
        return mockResponses.error
      case 'slow':
        return mockResponses.slow
      default:
        return mockResponses.basic
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🤖 Copilot Chat Testing Scenarios
        </h1>
        <p className="text-gray-600">
          Test different copilot configurations, themes, and response behaviors.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Theme Selection</h3>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                    activeTheme === theme
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Response Mode</h3>
            <div className="space-y-2">
              {[
                { id: 'normal', label: 'Normal Responses', desc: 'Standard response time' },
                { id: 'slow', label: 'Slow Responses', desc: '5 second delay' },
                { id: 'error', label: 'Error Responses', desc: 'Simulated errors' }
              ].map((mode) => (
                <label key={mode.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="testMode"
                    value={mode.id}
                    checked={testMode === mode.id}
                    onChange={(e) => setTestMode(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{mode.label}</div>
                    <div className="text-xs text-gray-600">{mode.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Test Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Theme Test */}
        <div className="component-showcase">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Active Theme: {activeTheme}</h3>
            <p className="text-sm text-gray-600">Testing {activeTheme} theme with {testMode} responses</p>
          </div>
          <div className="p-4">
            <CopilotChat
              config={mockThemeConfigs[activeTheme]}
              onSendMessage={getResponseHandler()}
            />
          </div>
        </div>

        {/* Layout Variations */}
        <div className="space-y-4">
          <div className="component-showcase">
            <div className="p-3 border-b bg-gray-50">
              <h4 className="font-medium text-gray-800">Sidebar Layout</h4>
              <p className="text-xs text-gray-600">Compact sidebar version</p>
            </div>
            <div className="p-3 h-64">
              <CopilotChat
                config={{
                  ...mockThemeConfigs[activeTheme],
                  title: "Sidebar Bot"
                }}
                onSendMessage={mockResponses.basic}
                className="h-full w-full max-w-xs"
              />
            </div>
          </div>

          <div className="component-showcase">
            <div className="p-3 border-b bg-gray-50">
              <h4 className="font-medium text-gray-800">Mini Chat</h4>
              <p className="text-xs text-gray-600">Minimal version</p>
            </div>
            <div className="p-3">
              <CopilotChat
                config={{
                  ...mockThemeConfigs[activeTheme],
                  title: "Mini Bot",
                  subtitle: "Quick help"
                }}
                onSendMessage={mockResponses.basic}
                className="h-48 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* All Themes Showcase */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">All Themes Showcase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div key={theme} className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-gray-50 border-b">
                <h4 className="text-sm font-medium capitalize">{theme}</h4>
              </div>
              <div className="p-2">
                <CopilotChat
                  config={mockThemeConfigs[theme]}
                  onSendMessage={mockResponses.basic}
                  className="h-40"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Instructions */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Testing Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">🎨 Theme Testing</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Switch between different color themes</li>
              <li>• Check header colors and user message styling</li>
              <li>• Verify button hover effects</li>
              <li>• Test theme consistency across components</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">⚡ Response Testing</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Test normal response timing</li>
              <li>• Try slow response mode for loading states</li>
              <li>• Test error handling with error mode</li>
              <li>• Send messages with "error" to trigger errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 