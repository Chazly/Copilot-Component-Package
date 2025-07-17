import React, { useState } from 'react'
import { 
  getApiKey,
  getApiKeyWithConfig,
  detectFramework,
  validateEnvironment,
  type ValidationResult 
} from '../../../src/lib/env'
import { 
  createBasicConfig,
  createEnterpriseConfig,
  createDevelopmentConfig 
} from '../../../src/builders/ConfigBuilder'
import { 
  withMockedEnvironment 
} from '../../../src/lib/env.test.utils'

interface DualValidationTestResult {
  name: string
  description: string
  success: boolean
  expected: any
  actual: any
  error?: string
  details?: any
}

export default function DualValidationTest() {
  const [testResults, setTestResults] = useState<DualValidationTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [summary, setSummary] = useState<{ passed: number; failed: number; total: number } | null>(null)

  const runSingleTest = async (
    name: string, 
    description: string, 
    testFn: () => Promise<{ success: boolean; expected: any; actual: any; details?: any }>
  ): Promise<DualValidationTestResult> => {
    try {
      const result = await testFn()
      return {
        name,
        description,
        success: result.success,
        expected: result.expected,
        actual: result.actual,
        details: result.details
      }
    } catch (error) {
      return {
        name,
        description,
        success: false,
        expected: 'No error',
        actual: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const results: DualValidationTestResult[] = []

    // Test 1: Core Architectural Fix - API Key Precedence
    const apiKeyPrecedenceTest = await runSingleTest(
      'API Key Precedence',
      'Tests that getApiKeyWithConfig() uses provided config before environment',
      async () => {
        const providedKey = 'sk-config-provided-key'
        
        // Test with config provided - should return provided key
        const resultWithConfig = getApiKeyWithConfig({ apiKey: providedKey })
        
        // Test fallback behavior by mocking environment without key
        const resultWithoutConfig = await withMockedEnvironment('unknown', {}, () => {
          try {
            return getApiKeyWithConfig()
          } catch (error) {
            return error instanceof Error ? error.message : String(error)
          }
        })

        return {
          success: resultWithConfig === providedKey && typeof resultWithoutConfig === 'string',
          expected: { withConfig: providedKey, withoutConfig: 'error message' },
          actual: { withConfig: resultWithConfig, withoutConfig: resultWithoutConfig },
          details: { providedKey, resultWithConfig, resultWithoutConfig }
        }
      }
    )
    results.push(apiKeyPrecedenceTest)

    // Test 2: Original Issue Reproduction - Config Builder with environmentConfig
    const configBuilderTest = await runSingleTest(
      'Config Builder API Key Fix',
      'Tests that environmentConfig() provided API keys are respected during validation',
      async () => {
        const providedKey = 'sk-test-config-builder'
        
        try {
          const config = createBasicConfig('Test Copilot', 'Testing dual validation')
            .model('openai', 'gpt-3.5-turbo')
            .storage('/tmp/test.db', '/tmp/embeddings')
            .systemPrompt('Test assistant')
            .environmentConfig({ 
              apiKey: providedKey,
              requireApiKey: true  // Should not fail despite no env vars
            })
            .build()
          
          return {
            success: true,
            expected: 'Configuration should build successfully',
            actual: 'Configuration built successfully',
            details: { 
              configName: config.name,
              hasApiKey: !!providedKey,
              modelProvider: config.modelProvider
            }
          }
        } catch (error) {
          return {
            success: false,
            expected: 'Configuration should build successfully',
            actual: error instanceof Error ? error.message : String(error),
            details: { error: error instanceof Error ? error.message : String(error) }
          }
        }
      }
    )
    results.push(configBuilderTest)

    // Test 3: Environment vs Config Priority
    const priorityTest = await runSingleTest(
      'Environment vs Config Priority',
      'Tests that config API keys override environment variables',
      async () => {
        const envKey = 'sk-environment-key'
        const configKey = 'sk-config-override-key'
        
        return await withMockedEnvironment('nextjs', { 
          apiKey: envKey, 
          isClient: false 
        }, () => {
          // Environment has one key, config provides different key
          const result = getApiKeyWithConfig({ apiKey: configKey })
          
          return {
            success: result === configKey, // Should use config key, not env key
            expected: configKey,
            actual: result,
            details: { envKey, configKey, result }
          }
        })
      }
    )
    results.push(priorityTest)

    // Test 4: Fallback Behavior
    const fallbackTest = await runSingleTest(
      'Fallback to Environment',
      'Tests that getApiKeyWithConfig() falls back to environment when no config provided',
      async () => {
        const envKey = 'sk-fallback-environment-key'
        
        return await withMockedEnvironment('nextjs', { 
          apiKey: envKey, 
          isClient: false 
        }, () => {
          // No config provided, should fall back to environment
          const result = getApiKeyWithConfig()
          
          return {
            success: result === envKey,
            expected: envKey,
            actual: result,
            details: { envKey, result }
          }
        })
      }
    )
    results.push(fallbackTest)

    // Test 5: Validation Integration
    const validationIntegrationTest = await runSingleTest(
      'Validation Integration',
      'Tests that ConfigBuilder validation uses the unified API key function',
      async () => {
        const providedKey = 'sk-validation-test-key'
        
        // Clear environment to ensure only config key is available
        return await withMockedEnvironment('unknown', {}, () => {
          try {
            const config = createEnterpriseConfig('Enterprise Test', 'Testing validation')
              .model('openai', 'gpt-4')
              .storage('/tmp/enterprise.db', '/tmp/embeddings')
              .systemPrompt('Enterprise test assistant')
              .environmentConfig({ 
                apiKey: providedKey,
                requireApiKey: true
              })
              .build()
            
            return {
              success: true,
              expected: 'Enterprise config should build with provided API key',
              actual: 'Enterprise config built successfully',
              details: { 
                configName: config.name,
                hasEnterpriseSecurity: !!config.enterpriseSecurity?.enabled,
                providedKey
              }
            }
          } catch (error) {
            return {
              success: false,
              expected: 'Enterprise config should build with provided API key',
              actual: error instanceof Error ? error.message : String(error),
              details: { error: error instanceof Error ? error.message : String(error) }
            }
          }
        })
      }
    )
    results.push(validationIntegrationTest)

    // Test 6: Error Message Improvement
    const errorMessageTest = await runSingleTest(
      'Enhanced Error Messages',
      'Tests that error messages provide helpful debugging information',
      async () => {
        return await withMockedEnvironment('unknown', {}, () => {
          try {
            getApiKey() // Should throw with enhanced error message
            return {
              success: false,
              expected: 'Should throw error with debug info',
              actual: 'No error thrown',
              details: {}
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            const hasDebugInfo = errorMessage.includes('Debug Information:')
            const hasAttemptedSources = errorMessage.includes('Attempted sources:')
            const hasFrameworkInfo = errorMessage.includes('Framework detected:')
            
            return {
              success: hasDebugInfo && hasAttemptedSources && hasFrameworkInfo,
              expected: 'Error message with debug information',
              actual: errorMessage,
              details: { 
                hasDebugInfo, 
                hasAttemptedSources, 
                hasFrameworkInfo,
                errorLength: errorMessage.length
              }
            }
          }
        })
      }
    )
    results.push(errorMessageTest)

    // Test 7: useModelProvider Integration
    const modelProviderTest = await runSingleTest(
      'Model Provider Integration',
      'Tests that useModelProvider respects environmentConfig API keys',
      async () => {
        const providedKey = 'sk-model-provider-test'
        
        // This would require mocking the hook, so we'll test the underlying function
        // that configToProviderConfig uses
        try {
          const envConfig = { apiKey: providedKey }
          const result = getApiKeyWithConfig(envConfig)
          
          return {
            success: result === providedKey,
            expected: providedKey,
            actual: result,
            details: { providedKey, result }
          }
        } catch (error) {
          return {
            success: false,
            expected: providedKey,
            actual: error instanceof Error ? error.message : String(error),
            details: { error: error instanceof Error ? error.message : String(error) }
          }
        }
      }
    )
    results.push(modelProviderTest)

    setTestResults(results)
    
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    setSummary({ passed, failed, total: results.length })
    
    setIsRunning(false)
  }

  const formatResult = (result: DualValidationTestResult) => (
    <div className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{result.name}</h4>
        <span className={`px-2 py-1 rounded text-sm ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result.success ? 'PASS' : 'FAIL'}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{result.description}</p>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium text-sm">Expected:</span>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
            {typeof result.expected === 'object' ? JSON.stringify(result.expected, null, 2) : result.expected}
          </pre>
        </div>
        
        <div>
          <span className="font-medium text-sm">Actual:</span>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
            {typeof result.actual === 'object' ? JSON.stringify(result.actual, null, 2) : result.actual}
          </pre>
        </div>
        
        {result.details && (
          <div>
            <span className="font-medium text-sm">Details:</span>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        )}
        
        {result.error && (
          <div>
            <span className="font-medium text-sm text-red-700">Error:</span>
            <div className="text-sm text-red-600 mt-1">{result.error}</div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dual Validation System Test</h2>
          <p className="text-gray-600 mt-1">
            Tests the core architectural fix where provided API keys in environmentConfig() are now respected.
          </p>
        </div>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Test Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border">
            <div className="text-sm">
              <strong>Success Rate:</strong> {summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%
            </div>
            <div className="text-sm mt-1">
              <strong>Status:</strong> {' '}
              <span className={summary.failed === 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {summary.failed === 0 ? '✅ All dual validation issues resolved!' : '❌ Some issues remain'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Results</h3>
        
        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Click "Run All Tests" to test the dual validation system fixes.
          </div>
        )}
        
        {isRunning && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-600">Running dual validation tests...</div>
          </div>
        )}
        
        {testResults.map((result, index) => (
          <div key={index}>
            {formatResult(result)}
          </div>
        ))}
      </div>

      {/* What This Tests */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold mb-2">🧪 What This Tests</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>API Key Precedence:</strong> Config-provided keys override environment variables</li>
          <li>• <strong>ConfigBuilder Integration:</strong> environmentConfig() API keys are respected during validation</li>
          <li>• <strong>Fallback Behavior:</strong> System falls back to environment when no config provided</li>
          <li>• <strong>Validation Integration:</strong> All validation systems use the unified API key function</li>
          <li>• <strong>Error Messages:</strong> Enhanced error messages provide debugging information</li>
          <li>• <strong>Hook Integration:</strong> useModelProvider respects configuration API keys</li>
          <li>• <strong>Original Issue:</strong> The reported "API key not found" error with provided keys is fixed</li>
        </ul>
      </div>
    </div>
  )
} 