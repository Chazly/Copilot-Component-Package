import React, { useState } from 'react'
import { TestingDashboard } from './components/TestingDashboard'
import { CopilotTestScenarios } from './components/CopilotTestScenarios'
import { ResizableLayoutTest } from './components/ResizableLayoutTest'
import { EnterpriseFeatureTest } from './components/EnterpriseFeatureTest'
import { ConfigurationTest } from './components/ConfigurationTest'
import { PerformanceTest } from './components/PerformanceTest'

type TestView = 'dashboard' | 'copilot' | 'resizable' | 'enterprise' | 'config' | 'performance'

function App() {
  console.log('📱 App component initializing...')
  const [activeView, setActiveView] = useState<TestView>('dashboard')
  console.log('📱 App component state initialized')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'copilot', label: 'Copilot Chat', icon: '🤖' },
    { id: 'resizable', label: 'Resizable Layout', icon: '📐' },
    { id: 'enterprise', label: 'Enterprise Features', icon: '🏢' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
  ]

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <TestingDashboard />
      case 'copilot':
        return <CopilotTestScenarios />
      case 'resizable':
        return <ResizableLayoutTest />
      case 'enterprise':
        return <EnterpriseFeatureTest />
      case 'config':
        return <ConfigurationTest />
      case 'performance':
        return <PerformanceTest />
      default:
        return <TestingDashboard />
    }
  }

  return (
    <div className="test-container">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">
              🧪 Copilot Testing Lab
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Test environment for copilot components
            </p>
          </div>
          
          <nav className="p-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as TestView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left transition-all ${
                  activeView === item.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono">1.0.0-test</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Node:</span>
                  <span className="font-mono">localhost:3000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {renderActiveView()}
        </div>
      </div>
    </div>
  )
}

export default App 