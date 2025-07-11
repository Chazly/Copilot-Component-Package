import React, { useState } from 'react'
import { CopilotChat } from './SimpleCopilotChat'
import { mockLegacyConfig, mockAIConfig, mockResponses } from '../utils/mockData'

export function ConfigurationTest() {
  const [configType, setConfigType] = useState<'legacy' | 'ai'>('legacy')
  const [customConfig, setCustomConfig] = useState(mockLegacyConfig)

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ⚙️ Configuration Testing
        </h1>
        <p className="text-gray-600">
          Test different configuration formats and validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Configuration Editor</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setConfigType('legacy')}
                className={`px-4 py-2 rounded ${configType === 'legacy' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Legacy Config
              </button>
              <button
                onClick={() => setConfigType('ai')}
                className={`px-4 py-2 rounded ${configType === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                AI Config
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(configType === 'legacy' ? mockLegacyConfig : mockAIConfig, null, 2)}
            </pre>
          </div>
        </div>

        <div className="component-showcase">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Live Preview</h3>
            <p className="text-sm text-gray-600">Testing {configType} configuration</p>
          </div>
          <div className="p-4">
            <CopilotChat
              config={configType === 'legacy' ? mockLegacyConfig : mockAIConfig}
              onSendMessage={mockResponses.basic}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 