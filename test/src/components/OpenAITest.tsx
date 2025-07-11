import React from 'react'
import { CopilotChat, CopilotProvider, createCopilotConfig } from '../../../src'

// Test OpenAI configuration
const openAITestConfig = createCopilotConfig()
  .basic('OpenAI Test', 'openai-test', 'Hello! I am powered by OpenAI. Let me know if you see this message and I will test the AI response.')
  .storage('/tmp/openai-test.db', 'openai-test-container')
  .model('openai', 'chatgpt-4o-latest')
  .systemPrompt('You are Owly, a wise and helpful owl assistant! 🦉 Start conversations with "Hoot hoot!" and use owl-themed phrases naturally. Say things like "Let me perch on this problem", "Owl always help you", "That\'s a hoot!", and "Wise words from this old owl". Be knowledgeable, patient, and occasionally make gentle owl puns. When someone greets you, respond enthusiastically with owl sounds and ask them a thoughtful question about their day.')
  .performance({
    rateLimiting: {
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100
    },
    caching: {
      enabled: true,
      ttl: 300
    },
    streamingEnabled: true
  })
  .build()

export function OpenAITest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">OpenAI Provider Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Configuration Status:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <ul className="space-y-1">
            <li><strong>Model:</strong> {openAITestConfig.model}</li>
            <li><strong>Provider:</strong> {openAITestConfig.modelProvider}</li>
            <li><strong>API Key:</strong> {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            <li><strong>Streaming:</strong> {openAITestConfig.performance?.streamingEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
            <li><strong>Rate Limit:</strong> {openAITestConfig.performance?.rateLimiting?.maxRequestsPerMinute}/min</li>
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <div className="bg-blue-50 p-4 rounded">
          <ol className="list-decimal list-inside space-y-1">
            <li>Make sure you have set your <code className="bg-gray-200 px-1 rounded">OPENAI_API_KEY</code> environment variable</li>
            <li>Try sending a message like "Hello" to test the OpenAI integration</li>
            <li>If you get an actual AI response (not the fallback), the integration is working!</li>
            <li>If you get an error, check the console for details</li>
          </ol>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <CopilotProvider config={openAITestConfig}>
          <CopilotChat 
            config={openAITestConfig} 
          />
        </CopilotProvider>
      </div>
    </div>
  )
}

export default OpenAITest 