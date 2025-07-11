import React, { useState } from 'react'
import { ResizableLayout } from './SimpleResizableLayout'
import { CopilotChat } from './SimpleCopilotChat'
import { mockLegacyConfig, mockResponses } from '../utils/mockData'

export function ResizableLayoutTest() {
  const [layoutConfig, setLayoutConfig] = useState({
    defaultLeftWidth: 40,
    minLeftWidth: 20,
    maxLeftWidth: 80
  })

  const [contentType, setContentType] = useState<'text' | 'list' | 'code'>('text')

  const renderRightPanel = () => {
    switch (contentType) {
      case 'list':
        return (
          <div className="p-4 h-full bg-gray-50">
            <h4 className="font-semibold mb-4">Items List</h4>
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item {i + 1}</span>
                    <span className="text-xs text-gray-500">ID: {String(i + 1).padStart(3, '0')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    This is a sample item for testing the resizable layout functionality.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      case 'code':
        return (
          <div className="p-4 h-full bg-gray-900 text-white font-mono text-sm">
            <h4 className="font-semibold mb-4 text-green-400">Code Example</h4>
            <pre className="whitespace-pre-wrap overflow-auto">
{`// Example React Component
import React from 'react'
import { CopilotChat } from '@your-org/copilot-package'

function MyApp() {
  const config = {
    title: "AI Assistant",
    subtitle: "How can I help?",
    color: "blue",
    initialMessage: "Hello! How can I assist you?"
  }

  const handleMessage = async (message: string) => {
    // Process the message
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    
    return await response.text()
  }

  return (
    <div className="app">
      <CopilotChat 
        config={config}
        onSendMessage={handleMessage}
      />
    </div>
  )
}

export default MyApp`}
            </pre>
          </div>
        )
      default:
        return (
          <div className="p-4 h-full bg-gray-50">
            <h4 className="font-semibold mb-4">Documentation Panel</h4>
            <div className="prose prose-sm max-w-none">
              <h5>ResizableLayout Component</h5>
              <p>
                The ResizableLayout component provides a flexible way to create layouts with 
                adjustable panel sizes. Users can drag the divider to resize panels according 
                to their preferences.
              </p>
              
              <h6>Key Features:</h6>
              <ul>
                <li>Smooth drag-based resizing</li>
                <li>Configurable width constraints</li>
                <li>Responsive design support</li>
                <li>Accessibility features</li>
              </ul>

              <h6>Props:</h6>
              <ul>
                <li><code>leftPanel</code> - React component for left side</li>
                <li><code>rightPanel</code> - React component for right side</li>
                <li><code>defaultLeftWidth</code> - Initial left panel width (%)</li>
                <li><code>minLeftWidth</code> - Minimum left panel width (%)</li>
                <li><code>maxLeftWidth</code> - Maximum left panel width (%)</li>
              </ul>

              <p>
                Try dragging the divider between this panel and the chat to test the 
                resizing functionality. The layout will maintain your preferred sizes 
                and respect the minimum and maximum constraints.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          📐 Resizable Layout Testing
        </h1>
        <p className="text-gray-600">
          Test the resizable layout component with different configurations and content types.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Layout Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Left Width: {layoutConfig.defaultLeftWidth}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={layoutConfig.defaultLeftWidth}
                  onChange={(e) => setLayoutConfig(prev => ({
                    ...prev,
                    defaultLeftWidth: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Left Width: {layoutConfig.minLeftWidth}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={layoutConfig.minLeftWidth}
                  onChange={(e) => setLayoutConfig(prev => ({
                    ...prev,
                    minLeftWidth: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Left Width: {layoutConfig.maxLeftWidth}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={layoutConfig.maxLeftWidth}
                  onChange={(e) => setLayoutConfig(prev => ({
                    ...prev,
                    maxLeftWidth: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Right Panel Content</h3>
            <div className="space-y-2">
              {[
                { id: 'text', label: 'Documentation', desc: 'Text content with prose' },
                { id: 'list', label: 'Items List', desc: 'Scrollable list of items' },
                { id: 'code', label: 'Code Example', desc: 'Syntax highlighted code' }
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value={type.id}
                    checked={contentType === type.id}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{type.label}</div>
                    <div className="text-xs text-gray-600">{type.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Resizable Layout Test */}
      <div className="component-showcase">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Interactive Resizable Layout</h3>
          <p className="text-sm text-gray-600">
            Drag the divider to resize panels. Current settings: 
            Default {layoutConfig.defaultLeftWidth}%, 
            Min {layoutConfig.minLeftWidth}%, 
            Max {layoutConfig.maxLeftWidth}%
          </p>
        </div>
        <div className="h-96">
          <ResizableLayout
            key={`${layoutConfig.defaultLeftWidth}-${layoutConfig.minLeftWidth}-${layoutConfig.maxLeftWidth}`}
            leftPanel={
              <CopilotChat
                config={{
                  ...mockLegacyConfig,
                  title: "Layout Test Bot",
                  color: "purple"
                }}
                onSendMessage={mockResponses.basic}
              />
            }
            rightPanel={renderRightPanel()}
            defaultLeftWidth={layoutConfig.defaultLeftWidth}
            minLeftWidth={layoutConfig.minLeftWidth}
            maxLeftWidth={layoutConfig.maxLeftWidth}
          />
        </div>
      </div>

      {/* Multiple Layout Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="component-showcase">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Chat + Sidebar (30/70)</h3>
            <p className="text-sm text-gray-600">Narrow chat with wide content area</p>
          </div>
          <div className="h-64">
            <ResizableLayout
              leftPanel={
                <CopilotChat
                  config={{
                    ...mockLegacyConfig,
                    title: "Narrow Chat",
                    color: "teal"
                  }}
                  onSendMessage={mockResponses.basic}
                />
              }
              rightPanel={
                <div className="p-3 bg-blue-50 h-full">
                  <h4 className="font-medium text-blue-800 mb-2">Wide Content</h4>
                  <p className="text-sm text-blue-700">
                    This layout gives more space to content while keeping chat accessible.
                  </p>
                </div>
              }
              defaultLeftWidth={30}
              minLeftWidth={20}
              maxLeftWidth={50}
            />
          </div>
        </div>

        <div className="component-showcase">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Split View (50/50)</h3>
            <p className="text-sm text-gray-600">Equal space for both panels</p>
          </div>
          <div className="h-64">
            <ResizableLayout
              leftPanel={
                <CopilotChat
                  config={{
                    ...mockLegacyConfig,
                    title: "Split Chat",
                    color: "emerald"
                  }}
                  onSendMessage={mockResponses.basic}
                />
              }
              rightPanel={
                <div className="p-3 bg-green-50 h-full">
                  <h4 className="font-medium text-green-800 mb-2">Equal Panel</h4>
                  <p className="text-sm text-green-700">
                    Balanced layout for equal importance content.
                  </p>
                </div>
              }
              defaultLeftWidth={50}
              minLeftWidth={30}
              maxLeftWidth={70}
            />
          </div>
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Testing Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">🖱️ Interaction Tests</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag the divider to resize panels</li>
              <li>• Test minimum and maximum constraints</li>
              <li>• Check smooth dragging experience</li>
              <li>• Try different initial configurations</li>
              <li>• Test with different content types</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">📱 Responsive Tests</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Test on different screen sizes</li>
              <li>• Check mobile behavior</li>
              <li>• Verify touch interactions</li>
              <li>• Test keyboard accessibility</li>
              <li>• Check content overflow handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 