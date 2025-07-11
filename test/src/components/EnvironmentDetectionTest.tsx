import React, { useState, useEffect } from 'react'
import { 
  detectFramework, 
  getApiKey, 
  getDefaultModel, 
  validateEnvironment,
  type FrameworkType,
  type ValidationResult 
} from '../../../src/lib/env'
import { 
  createEnvironmentMocker, 
  withMockedEnvironment, 
  testScenarios,
  type MockEnvironmentConfig 
} from '../../../src/lib/env.test.utils'

interface TestResult {
  framework: FrameworkType
  apiKey: string | null
  defaultModel: string
  validation: ValidationResult
  errors: string[]
}

interface TestScenario {
  name: string
  description: string
  framework: MockEnvironmentConfig['framework']
  config: { apiKey?: string; model?: string; isClient?: boolean }
}

export default function EnvironmentDetectionTest() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [currentEnvironment, setCurrentEnvironment] = useState<TestResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const scenarios: TestScenario[] = [
    {
      name: 'Next.js Server-Side',
      description: 'Tests Next.js server environment with OPENAI_API_KEY',
      framework: 'nextjs',
      config: { isClient: false, apiKey: 'sk-test-server-key', model: 'gpt-4' }
    },
    {
      name: 'Next.js Client-Side',
      description: 'Tests Next.js client environment with NEXT_PUBLIC_OPENAI_API_KEY',
      framework: 'nextjs',
      config: { isClient: true, apiKey: 'sk-test-client-key', model: 'gpt-3.5-turbo' }
    },
    {
      name: 'Vite Environment',
      description: 'Tests Vite environment with VITE_OPENAI_API_KEY',
      framework: 'vite',
      config: { apiKey: 'sk-test-vite-key', model: 'gpt-4' }
    },
    {
      name: 'Nuxt Environment',
      description: 'Tests Nuxt environment with NUXT_OPENAI_API_KEY',
      framework: 'nuxt',
      config: { apiKey: 'sk-test-nuxt-key', model: 'gpt-3.5-turbo' }
    },
    {
      name: 'SvelteKit Environment',
      description: 'Tests SvelteKit environment with OPENAI_API_KEY',
      framework: 'sveltekit',
      config: { apiKey: 'sk-test-sveltekit-key', model: 'gpt-4' }
    },
    {
      name: 'Remix Environment',
      description: 'Tests Remix environment with OPENAI_API_KEY',
      framework: 'remix',
      config: { apiKey: 'sk-test-remix-key', model: 'gpt-3.5-turbo' }
    },
    {
      name: 'Astro Environment',
      description: 'Tests Astro environment with VITE_OPENAI_API_KEY',
      framework: 'astro',
      config: { apiKey: 'sk-test-astro-key', model: 'gpt-4' }
    },
    {
      name: 'Missing API Key',
      description: 'Tests error handling when API key is missing',
      framework: 'unknown',
      config: {}
    },
    {
      name: 'Client-Side Exposure Warning',
      description: 'Tests security warning for server-side keys on client',
      framework: 'unknown',
      config: { apiKey: 'sk-exposed-server-key' }
    }
  ]

  const runSingleTest = async (scenario: TestScenario): Promise<TestResult> => {
    return withMockedEnvironment(
      scenario.framework,
      scenario.config,
      () => {
        const errors: string[] = []
        
        try {
          const framework = detectFramework()
          
          let apiKey: string | null = null
          try {
            apiKey = getApiKey()
          } catch (error) {
            errors.push(`API Key Error: ${error instanceof Error ? error.message : String(error)}`)
          }

          let defaultModel = 'gpt-3.5-turbo'
          try {
            defaultModel = getDefaultModel()
          } catch (error) {
            errors.push(`Default Model Error: ${error instanceof Error ? error.message : String(error)}`)
          }

          let validation: ValidationResult
          try {
            validation = validateEnvironment()
          } catch (error) {
                         validation = {
               isValid: false,
               framework: framework,
               hasApiKey: false,
               warnings: [],
               errors: [error instanceof Error ? error.message : String(error)],
               environmentInfo: {
                 isClient: typeof window !== 'undefined',
                 isServer: typeof process !== 'undefined',
                 hasProcessEnv: typeof process !== 'undefined' && !!process.env,
                 hasImportMeta: !!(globalThis as any).import?.meta?.env
               }
             }
          }

          return {
            framework,
            apiKey,
            defaultModel,
            validation,
            errors
          }
        } catch (error) {
          return {
            framework: 'unknown' as FrameworkType,
            apiKey: null,
            defaultModel: 'gpt-3.5-turbo',
            validation: {
              isValid: false,
              framework: 'unknown' as FrameworkType,
              hasApiKey: false,
              warnings: [],
              errors: [error instanceof Error ? error.message : String(error)],
              environmentInfo: {
                isClient: typeof window !== 'undefined',
                isServer: typeof process !== 'undefined',
                hasProcessEnv: typeof process !== 'undefined' && !!process.env,
                hasImportMeta: !!(globalThis as any).import?.meta?.env
              }
            },
            errors: [error instanceof Error ? error.message : String(error)]
          }
        }
      }
    )
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const results: Record<string, TestResult> = {}

    for (const scenario of scenarios) {
      try {
        results[scenario.name] = await runSingleTest(scenario)
      } catch (error) {
                 results[scenario.name] = {
           framework: 'unknown' as FrameworkType,
           apiKey: null,
           defaultModel: 'gpt-3.5-turbo',
           validation: {
             isValid: false,
             framework: 'unknown' as FrameworkType,
             hasApiKey: false,
             warnings: [],
             errors: [error instanceof Error ? error.message : String(error)],
             environmentInfo: {
               isClient: typeof window !== 'undefined',
               isServer: typeof process !== 'undefined',
               hasProcessEnv: typeof process !== 'undefined' && !!process.env,
               hasImportMeta: !!(globalThis as any).import?.meta?.env
             }
           },
          errors: [error instanceof Error ? error.message : String(error)]
        }
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const detectCurrentEnvironment = () => {
    try {
      const framework = detectFramework()
      
      let apiKey: string | null = null
      const errors: string[] = []
      
      try {
        apiKey = getApiKey()
      } catch (error) {
        errors.push(`API Key: ${error instanceof Error ? error.message : String(error)}`)
      }

      const defaultModel = getDefaultModel()
      const validation = validateEnvironment()

      setCurrentEnvironment({
        framework,
        apiKey,
        defaultModel,
        validation,
        errors
      })
    } catch (error) {
             setCurrentEnvironment({
         framework: 'unknown',
         apiKey: null,
         defaultModel: 'gpt-3.5-turbo',
         validation: {
           isValid: false,
           framework: 'unknown',
           hasApiKey: false,
           warnings: [],
           errors: [error instanceof Error ? error.message : String(error)],
           environmentInfo: {
             isClient: typeof window !== 'undefined',
             isServer: typeof process !== 'undefined',
             hasProcessEnv: typeof process !== 'undefined' && !!process.env,
             hasImportMeta: !!(globalThis as any).import?.meta?.env
           }
         },
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  useEffect(() => {
    detectCurrentEnvironment()
  }, [])

  const formatResult = (result: TestResult) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium">Framework:</span>
        <span className={`px-2 py-1 rounded text-sm ${
          result.framework === 'unknown' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
        }`}>
          {result.framework}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium">API Key:</span>
        <span className={`px-2 py-1 rounded text-sm ${
          result.apiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result.apiKey ? `${result.apiKey.substring(0, 8)}...` : 'Not Found'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium">Default Model:</span>
        <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
          {result.defaultModel}
        </span>
      </div>

      <div className="space-y-1">
        <span className="font-medium">Validation:</span>
        <div className={`p-2 rounded text-sm ${
          result.validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              result.validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.validation.isValid ? 'Valid' : 'Invalid'}
            </span>
            <span className="text-gray-600">
              API Key: {result.validation.hasApiKey ? 'Found' : 'Missing'}
            </span>
          </div>

          {result.validation.warnings.length > 0 && (
            <div className="mt-2">
              <div className="text-orange-700 font-medium text-xs">Warnings:</div>
              {result.validation.warnings.map((warning, idx) => (
                <div key={idx} className="text-orange-600 text-xs">{warning}</div>
              ))}
            </div>
          )}

          {result.validation.errors.length > 0 && (
            <div className="mt-2">
              <div className="text-red-700 font-medium text-xs">Errors:</div>
              {result.validation.errors.map((error, idx) => (
                <div key={idx} className="text-red-600 text-xs">{error}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1">
          <span className="font-medium text-red-700">Test Errors:</span>
          {result.errors.map((error, idx) => (
            <div key={idx} className="text-red-600 text-sm">{error}</div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Environment Detection Test</h2>
        <div className="space-x-2">
          <button
            onClick={detectCurrentEnvironment}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Detect Current
          </button>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Current Environment */}
      {currentEnvironment && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Current Environment</h3>
          {formatResult(currentEnvironment)}
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Scenarios</h3>
        
        {scenarios.map((scenario) => (
          <div key={scenario.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{scenario.name}</h4>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
              <button
                onClick={() => runSingleTest(scenario).then(result => 
                  setTestResults(prev => ({ ...prev, [scenario.name]: result }))
                )}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Run Test
              </button>
            </div>
            
            {testResults[scenario.name] && formatResult(testResults[scenario.name])}
          </div>
        ))}
      </div>

      {/* Summary */}
      {Object.keys(testResults).length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Test Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(testResults).filter(r => r.validation.isValid).length}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(testResults).filter(r => !r.validation.isValid).length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(testResults).reduce((sum, r) => sum + r.validation.warnings.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 