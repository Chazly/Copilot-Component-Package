import React, { useState, useRef, useEffect } from 'react'
import { 
  createCopilotConfig,
  createBasicConfig,
  createEnterpriseConfig,
  createDevelopmentConfig,
  createProductionConfig 
} from '../../../src/builders/ConfigBuilder'
import { createOpenAIConfig } from '../../../src/providers/openai'
import { 
  withMockedEnvironment,
  testScenarios 
} from '../../../src/lib/env.test.utils'
import { 
  detectFramework,
  getApiKey,
  getApiKeyWithConfig,
  validateEnvironment 
} from '../../../src/lib/env'

interface TestResult {
  name: string
  success: boolean
  duration: number
  config?: any
  error?: string
  details?: any
}

interface StreamingTestResult {
  name: string
  success: boolean
  duration: number
  chunks: number
  totalLength: number
  error?: string
}

export default function IntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [streamingResults, setStreamingResults] = useState<StreamingTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTest, setActiveTest] = useState<string>('')

  // Builder Pattern Tests
  const runBuilderTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = []

    // Test 1: Basic Configuration Builder
    const basicTest = await runSingleTest('Basic Config Builder', async () => {
      const config = createBasicConfig('Test Copilot', 'Hello! How can I help you?')
        .model('openai', 'gpt-3.5-turbo')
        .storage('/tmp/test.db', '/tmp/embeddings')
        .systemPrompt('You are a helpful assistant.')
        .tryBuild()

      if (!config.success) {
        throw new Error(`Basic config failed: ${config.errors?.join(', ')}`)
      }

      return {
        built: true,
        hasName: !!config.config?.name,
        hasSystemPrompt: !!config.config?.systemPrompt,
        hasStorage: !!config.config?.databasePath
      }
    })
    results.push(basicTest)

    // Test 2: Enterprise Configuration Builder
    const enterpriseTest = await runSingleTest('Enterprise Config Builder', async () => {
      const config = createEnterpriseConfig('Enterprise Copilot', 'Welcome to our enterprise AI assistant.')
        .model('openai', 'gpt-4')
        .storage('/tmp/enterprise.db', '/tmp/enterprise-embeddings')
        .systemPrompt('You are a secure enterprise assistant.')
        .environmentConfig({
          requireApiKey: false, // For testing
          validateOnBuild: true
        })
        .tryBuild()

      if (!config.success) {
        throw new Error(`Enterprise config failed: ${config.errors?.join(', ')}`)
      }

      return {
        built: true,
        hasEnterpriseSecurity: !!config.config?.enterpriseSecurity?.enabled,
        hasMonitoring: !!config.config?.enterprisePerformance?.monitoring?.enabled,
        hasCompliance: !!config.config?.security?.compliance
      }
    })
    results.push(enterpriseTest)

    // Test 3: Development vs Production Presets
    const presetComparisonTest = await runSingleTest('Development vs Production Presets', async () => {
      const devConfig = createDevelopmentConfig('Dev Copilot', 'Dev mode activated')
        .model('openai', 'gpt-3.5-turbo')
        .storage('/tmp/dev.db', '/tmp/dev-embeddings')
        .systemPrompt('Development assistant')
        .tryBuild()

      const prodConfig = createProductionConfig('Prod Copilot', 'Production ready')
        .model('openai', 'gpt-4')
        .storage('/tmp/prod.db', '/tmp/prod-embeddings')
        .systemPrompt('Production assistant')
        .environmentConfig({ requireApiKey: false }) // For testing
        .tryBuild()

      return {
        devBuilt: devConfig.success,
        prodBuilt: prodConfig.success,
        devMockMode: devConfig.config?.development?.mockMode,
        prodMockMode: prodConfig.config?.development?.mockMode,
        devEncryption: devConfig.config?.security?.encryptAtRest,
        prodEncryption: prodConfig.config?.security?.encryptAtRest
      }
    })
    results.push(presetComparisonTest)

    // Test 4: Environment Configuration
    const envConfigTest = await runSingleTest('Environment Configuration', async () => {
      return withMockedEnvironment('nextjs', { 
        isClient: false, 
        apiKey: 'sk-test-key-integration', 
        model: 'gpt-4' 
      }, () => {
        const config = createCopilotConfig()
          .basic('Env Test', 'env-test', 'Testing environment')
          .model('openai')
          .storage('/tmp/env.db', '/tmp/env-embeddings')
          .systemPrompt('Environment test assistant')
          .autoDetectEnvironment()
          .validateEnvironment()
          .tryBuild()

        return {
          built: config.success,
          framework: detectFramework(),
          hasApiKey: !!getApiKey(),
          validation: validateEnvironment()
        }
      })
    })
    results.push(envConfigTest)

    // Test 5: Chain Methods Test
    const chainTest = await runSingleTest('Method Chaining', async () => {
      const config = createCopilotConfig()
        .basic('Chain Test', 'chain-test', 'Testing method chaining')
        .model('openai', 'gpt-3.5-turbo')
        .storage('/tmp/chain.db', '/tmp/chain-embeddings')
        .systemPrompt('Chain test assistant')
        .addTool('search')
        .addTool('calculate')
        .addContextSource('docs')
        .addContextSource('faq')
        .ui({ theme: 'dark', layout: 'sidebar' })
        .security({ encryptAtRest: true, auditLogging: true })
        .performance({ streamingEnabled: true })
        .tryBuild()

      return {
        built: config.success,
        toolCount: config.config?.tools?.length || 0,
        contextCount: config.config?.contextSources?.length || 0,
        hasUI: !!config.config?.uiConfig,
        hasSecurity: !!config.config?.security,
        hasPerformance: !!config.config?.performance
      }
    })
    results.push(chainTest)

    return results
  }

  // Provider Initialization Tests
  const runProviderTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = []

    // Test 1: OpenAI Provider Configuration
    const openaiProviderTest = await runSingleTest('OpenAI Provider Config', async () => {
      return withMockedEnvironment('vite', { 
        apiKey: 'sk-test-provider-key', 
        model: 'gpt-4' 
      }, () => {
        const providerConfig = createOpenAIConfig({
          apiKey: 'sk-test-provider-key',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000
        })

        return {
          created: !!providerConfig,
          hasApiKey: !!providerConfig.apiKey,
          hasModel: !!providerConfig.model,
          hasTemperature: typeof providerConfig.temperature === 'number',
          hasMaxTokens: typeof providerConfig.maxTokens === 'number'
        }
      })
    })
    results.push(openaiProviderTest)

    // Test 2: Provider with Config Builder Integration
    const integrationTest = await runSingleTest('Provider + Builder Integration', async () => {
      const builderConfig = createBasicConfig('Provider Integration', 'Testing provider integration')
        .model('openai', 'gpt-3.5-turbo')
        .storage('/tmp/provider.db', '/tmp/provider-embeddings')
        .systemPrompt('Provider integration test')
        .environmentConfig({ requireApiKey: false })
        .tryBuild()

      if (!builderConfig.success) {
        throw new Error('Builder config failed')
      }

      const providerConfig = createOpenAIConfig({
        apiKey: 'sk-test-integration',
        model: builderConfig.config?.model || 'gpt-3.5-turbo'
      })

      return {
        builderSuccess: builderConfig.success,
        providerCreated: !!providerConfig,
        modelMatch: builderConfig.config?.model === providerConfig.model
      }
    })
    results.push(integrationTest)

    return results
  }

  // Streaming Tests (Simulated)
  const runStreamingTests = async (): Promise<StreamingTestResult[]> => {
    const results: StreamingTestResult[] = []

    // Test 1: Simulated Streaming Response
    const streamingTest = await runStreamingTest('Simulated Streaming', async (onChunk) => {
      const chunks = [
        'Hello, ',
        'this is ',
        'a simulated ',
        'streaming ',
        'response. ',
        'Each chunk ',
        'represents ',
        'a real-time ',
        'message part.'
      ]

      for (let i = 0; i < chunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate delay
        onChunk(chunks[i])
      }

      return chunks.join('')
    })
    results.push(streamingTest)

    // Test 2: Error Handling in Streaming
    const errorStreamingTest = await runStreamingTest('Streaming Error Handling', async (onChunk) => {
      onChunk('Starting response...')
      await new Promise(resolve => setTimeout(resolve, 50))
      onChunk(' processing...')
      await new Promise(resolve => setTimeout(resolve, 50))
      
      throw new Error('Simulated streaming error')
    })
    results.push(errorStreamingTest)

    return results
  }

  // Helper Functions
  const runSingleTest = async (name: string, testFn: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now()
    try {
      setActiveTest(name)
      const result = await testFn()
      const duration = Date.now() - startTime
      
      return {
        name,
        success: true,
        duration,
        details: result
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  const runStreamingTest = async (
    name: string, 
    testFn: (onChunk: (chunk: string) => void) => Promise<string>
  ): Promise<StreamingTestResult> => {
    const startTime = Date.now()
    let chunks = 0
    let totalLength = 0

    try {
      setActiveTest(name)
      
      const result = await testFn((chunk: string) => {
        chunks++
        totalLength += chunk.length
      })

      const duration = Date.now() - startTime
      
      return {
        name,
        success: true,
        duration,
        chunks,
        totalLength
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name,
        success: false,
        duration,
        chunks,
        totalLength,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setStreamingResults([])
    setActiveTest('')

    try {
      // Run builder tests
      setActiveTest('Running Builder Tests...')
      const builderResults = await runBuilderTests()
      setTestResults(prev => [...prev, ...builderResults])

      // Run provider tests
      setActiveTest('Running Provider Tests...')
      const providerResults = await runProviderTests()
      setTestResults(prev => [...prev, ...providerResults])

      // Run streaming tests
      setActiveTest('Running Streaming Tests...')
      const streamingTestResults = await runStreamingTests()
      setStreamingResults(streamingTestResults)

      setActiveTest('All tests completed!')
    } catch (error) {
      setActiveTest(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getSuccessRate = (results: TestResult[]) => {
    if (results.length === 0) return 0
    return Math.round((results.filter(r => r.success).length / results.length) * 100)
  }

  const getAverageDuration = (results: (TestResult | StreamingTestResult)[]) => {
    if (results.length === 0) return 0
    return Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Integration Tests</h2>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run All Integration Tests'}
        </button>
      </div>

      {/* Active Test Indicator */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="font-medium">Currently running: {activeTest}</span>
          </div>
        </div>
      )}

      {/* Test Results Summary */}
      {(testResults.length > 0 || streamingResults.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
            <div className="text-sm text-gray-600">Integration Tests</div>
          </div>
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{getSuccessRate(testResults)}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{streamingResults.length}</div>
            <div className="text-sm text-gray-600">Streaming Tests</div>
          </div>
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{getAverageDuration([...testResults, ...streamingResults])}ms</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
        </div>
      )}

      {/* Integration Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Integration Test Results</h3>
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{result.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="text-sm text-gray-600">{result.duration}ms</span>
                </div>
              </div>
              
              {result.error && (
                <div className="text-red-600 text-sm mt-2">
                  Error: {result.error}
                </div>
              )}
              
              {result.details && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600">View Details</summary>
                    <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Streaming Test Results */}
      {streamingResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Streaming Test Results</h3>
          {streamingResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{result.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="text-sm text-gray-600">{result.duration}ms</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Chunks: {result.chunks}</div>
                <div>Total Length: {result.totalLength}</div>
              </div>
              
              {result.error && (
                <div className="text-red-600 text-sm mt-2">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Integration Test Coverage</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Builder Pattern: Configuration creation, method chaining, preset application</li>
          <li>• Provider Integration: OpenAI configuration, builder-provider integration</li>
          <li>• Environment Testing: Framework detection, API key validation, configuration validation</li>
          <li>• Streaming Simulation: Chunk processing, error handling, performance metrics</li>
          <li>• Error Handling: Configuration failures, validation errors, runtime exceptions</li>
        </ul>
      </div>
    </div>
  )
} 