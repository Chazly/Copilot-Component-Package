import React from 'react'
import { createCopilotConfig } from '../src/builders/ConfigBuilder'
import { CopilotChat, CopilotProvider } from '../src'

// Simple OpenAI configuration example
const openAIConfig = createCopilotConfig()
  .basic('AI Assistant', 'ai-assistant', 'Hello! I am powered by OpenAI. How can I help you today?')
  .storage('/tmp/copilot.db', 'chat-container')
  .model('openai', 'chatgpt-4o-latest')
  .systemPrompt('You are a helpful AI assistant. Be concise and accurate in your responses.')
  .performance({
    rateLimiting: {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500
    },
    caching: {
      enabled: true,
      ttl: 300
    },
    streamingEnabled: true
  })
  .build()

// Example with different model
const openAIGpt4Config = createCopilotConfig()
  .basic('AI Assistant GPT-4.1', 'ai-assistant-gpt4', 'Hello! I am powered by GPT-4.1. How can I help you today?')
  .storage('/tmp/copilot-gpt4.db', 'chat-container-gpt4')
  .model('openai', 'gpt-4.1-2025-04-14')
  .systemPrompt('You are a helpful AI assistant powered by GPT-4.1. Be detailed and accurate in your responses.')
  .performance({
    rateLimiting: {
      maxRequestsPerMinute: 20,
      maxRequestsPerHour: 300
    },
    caching: {
      enabled: true,
      ttl: 600
    },
    streamingEnabled: true
  })
  .build()

// React component example
export function OpenAIExample() {
  return (
    <CopilotProvider config={openAIConfig}>
      <div className="flex h-screen">
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-4">OpenAI Integration Example</h1>
          <p className="mb-4">This example shows how to integrate OpenAI models with the Copilot package.</p>
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Configuration:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Model: {openAIConfig.model}</li>
              <li>Provider: {openAIConfig.modelProvider}</li>
              <li>Streaming: {openAIConfig.performance?.streamingEnabled ? 'Enabled' : 'Disabled'}</li>
              <li>Caching: {openAIConfig.performance?.caching?.enabled ? 'Enabled' : 'Disabled'}</li>
            </ul>
          </div>
        </div>
        <div className="w-96 border-l">
          <CopilotChat config={openAIConfig} />
        </div>
      </div>
    </CopilotProvider>
  )
}

// Example with GPT-4.1 model
export function OpenAIGpt4Example() {
  return (
    <CopilotProvider config={openAIGpt4Config}>
      <div className="flex h-screen">
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-4">OpenAI GPT-4.1 Model</h1>
          <p className="mb-4">This example shows OpenAI integration with GPT-4.1 model.</p>
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Configuration:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Model: {openAIGpt4Config.model}</li>
              <li>Provider: {openAIGpt4Config.modelProvider}</li>
              <li>Context Window: 1M tokens</li>
              <li>Rate Limit: 20 req/min</li>
            </ul>
          </div>
        </div>
        <div className="w-96 border-l">
          <CopilotChat config={openAIGpt4Config} />
        </div>
      </div>
    </CopilotProvider>
  )
}

export { openAIConfig, openAIGpt4Config } 