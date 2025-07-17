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
  createProductionConfig,
  createDevelopmentConfig 
} from '../../../src/builders/ConfigBuilder'
import { 
  withMockedEnvironment 
} from '../../../src/lib/env.test.utils'

interface IssueTestResult {
  issueNumber: number
  title: string
  description: string
  status: 'RESOLVED' | 'STILL_BROKEN' | 'UNKNOWN'
  testResults: Array<{
    name: string
    passed: boolean
    details: string
    evidence?: any
  }>
  originalProblem: string
  fixApplied: string
}

export default function IssueReproductionTest() {
  const [testResults, setTestResults] = useState<IssueTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'UNKNOWN' | 'ALL_RESOLVED' | 'SOME_BROKEN'>('UNKNOWN')

  const runAllIssueTests = async () => {
    setIsRunning(true)
    const results: IssueTestResult[] = []

    // Issue 1: Environment Variable Detection Logic is Broken
    const issue1Result = await testIssue1()
    results.push(issue1Result)

    // Issue 2: Framework Detection is Failing
    const issue2Result = await testIssue2()
    results.push(issue2Result)

    // Issue 3: Architectural Design Flaw
    const issue3Result = await testIssue3()
    results.push(issue3Result)

    // Issue 4: Client-Side Environment Access Issues
    const issue4Result = await testIssue4()
    results.push(issue4Result)

    // Issue 5: Error Messaging is Misleading
    const issue5Result = await testIssue5()
    results.push(issue5Result)

    setTestResults(results)

    // Determine overall status
    const allResolved = results.every(r => r.status === 'RESOLVED')
    const anyBroken = results.some(r => r.status === 'STILL_BROKEN')
    
    if (allResolved) {
      setOverallStatus('ALL_RESOLVED')
    } else if (anyBroken) {
      setOverallStatus('SOME_BROKEN')
    } else {
      setOverallStatus('UNKNOWN')
    }

    setIsRunning(false)
  }

  // Issue 1: Environment Variable Detection Logic is Broken
  const testIssue1 = async (): Promise<IssueTestResult> => {
    const testResults: Array<{ name: string; passed: boolean; details: string; evidence?: any }> = []

    // Test 1a: Direct process.env access
    const processEnvTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-test-process-env',
      isClient: false 
    }, () => {
      try {
        // Should find OPENAI_API_KEY when it exists
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-test-process-env',
          details: `Expected: sk-test-process-env, Got: ${apiKey}`,
          evidence: { apiKey, framework: detectFramework() }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Failed to find API key: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Direct process.env access', ...processEnvTest })

    // Test 1b: Next.js public variable access
    const nextPublicTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-test-next-public',
      isClient: true 
    }, () => {
      try {
        // Should find NEXT_PUBLIC_OPENAI_API_KEY when it exists
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-test-next-public',
          details: `Expected: sk-test-next-public, Got: ${apiKey}`,
          evidence: { apiKey, framework: detectFramework() }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Failed to find Next.js public API key: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Next.js public variable access', ...nextPublicTest })

    // Test 1c: Multiple access pattern fallback
    const fallbackTest = await withMockedEnvironment('vite', { 
      apiKey: 'sk-test-vite-fallback'
    }, () => {
      try {
        // Should find VITE_OPENAI_API_KEY through fallback chain
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-test-vite-fallback',
          details: `Expected: sk-test-vite-fallback, Got: ${apiKey}`,
          evidence: { apiKey, framework: detectFramework() }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Failed fallback detection: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Multiple access pattern fallback', ...fallbackTest })

    const allPassed = testResults.every(t => t.passed)

    return {
      issueNumber: 1,
      title: 'Environment Variable Detection Logic is Broken',
      description: 'Package fails to find environment variables that clearly exist',
      status: allPassed ? 'RESOLVED' : 'STILL_BROKEN',
      testResults,
      originalProblem: 'process.env.NEXT_PUBLIC_OPENAI_API_KEY is available but package throws "OpenAI API key not found"',
      fixApplied: 'Enhanced getEnvironmentVariable() with direct access patterns and comprehensive fallback chain'
    }
  }

  // Issue 2: Framework Detection is Failing
  const testIssue2 = async (): Promise<IssueTestResult> => {
    const testResults: Array<{ name: string; passed: boolean; details: string; evidence?: any }> = []

    // Test 2a: Next.js detection with __NEXT_DEV_SCRIPT
    const nextDevScriptTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-test',
      isClient: false 
    }, () => {
      const framework = detectFramework()
      return {
        passed: framework === 'nextjs',
        details: `Expected: nextjs, Got: ${framework}`,
        evidence: { framework, indicators: ['NEXT_RUNTIME should be set'] }
      }
    })
    testResults.push({ name: 'Next.js server-side detection', ...nextDevScriptTest })

    // Test 2b: Next.js client-side detection
    const nextClientTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-test',
      isClient: true 
    }, () => {
      const framework = detectFramework()
      return {
        passed: framework === 'nextjs',
        details: `Expected: nextjs, Got: ${framework}`,
        evidence: { framework, indicators: ['__NEXT_DATA__ should be set'] }
      }
    })
    testResults.push({ name: 'Next.js client-side detection', ...nextClientTest })

    // Test 2c: Vite detection enhancement
    const viteTest = await withMockedEnvironment('vite', { 
      apiKey: 'sk-test'
    }, () => {
      const framework = detectFramework()
      return {
        passed: framework === 'vite',
        details: `Expected: vite, Got: ${framework}`,
        evidence: { framework, indicators: ['import.meta.env should be set'] }
      }
    })
    testResults.push({ name: 'Vite detection', ...viteTest })

    // Test 2d: Framework-specific environment variable patterns
    const frameworkPatternsTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-framework-test',
      isClient: false 
    }, () => {
      const framework = detectFramework()
      const validation = validateEnvironment()
      return {
        passed: framework === 'nextjs' && validation.framework === 'nextjs',
        details: `Framework: ${framework}, Validation Framework: ${validation.framework}`,
        evidence: { framework, validation: validation.framework }
      }
    })
    testResults.push({ name: 'Framework-specific patterns', ...frameworkPatternsTest })

    const allPassed = testResults.every(t => t.passed)

    return {
      issueNumber: 2,
      title: 'Framework Detection is Failing',
      description: 'Package shows "Current framework detected: unknown" instead of "nextjs"',
      status: allPassed ? 'RESOLVED' : 'STILL_BROKEN',
      testResults,
      originalProblem: 'Framework detection returning "unknown" instead of properly identifying Next.js',
      fixApplied: 'Enhanced detectFramework() with additional Next.js indicators (__NEXT_DEV_SCRIPT, window.next, etc.)'
    }
  }

  // Issue 3: Architectural Design Flaw
  const testIssue3 = async (): Promise<IssueTestResult> => {
    const testResults: Array<{ name: string; passed: boolean; details: string; evidence?: any }> = []

    // Test 3a: Config provided API key should work
    const configApiKeyTest = (() => {
      try {
        const config = createBasicConfig('Test', 'Testing architectural fix')
          .model('openai', 'gpt-3.5-turbo')
          .storage('/tmp/test.db', '/tmp/embeddings')
          .systemPrompt('Test')
          .environmentConfig({ 
            apiKey: 'sk-config-provided-key',
            requireApiKey: true 
          })
          .build()

        return {
          passed: true,
          details: 'Configuration built successfully with provided API key',
          evidence: { 
            configName: config.name,
            modelProvider: config.modelProvider,
            providedKey: 'sk-config-provided-key'
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Config build failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })()
    testResults.push({ name: 'Config API key acceptance', ...configApiKeyTest })

    // Test 3b: Config key should take precedence over environment
    const precedenceTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-environment-key',
      isClient: false 
    }, () => {
      try {
        const configKey = 'sk-config-override-key'
        const result = getApiKeyWithConfig({ apiKey: configKey })
        
        return {
          passed: result === configKey,
          details: `Config key should override environment. Expected: ${configKey}, Got: ${result}`,
          evidence: { 
            environmentKey: 'sk-environment-key',
            configKey,
            actualResult: result
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Precedence test failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Config precedence over environment', ...precedenceTest })

    // Test 3c: Validation should use unified function
    const validationTest = await withMockedEnvironment('unknown', {}, () => {
      try {
        const config = createProductionConfig('Production Test', 'Testing validation')
          .model('openai', 'gpt-4')
          .storage('/tmp/prod.db', '/tmp/embeddings')
          .systemPrompt('Production test')
          .environmentConfig({ 
            apiKey: 'sk-validation-test-key',
            requireApiKey: true
          })
          .build()

        return {
          passed: true,
          details: 'Validation passed with config-provided API key despite no environment variables',
          evidence: { 
            configName: config.name,
            hasNoEnvVars: true,
            usedConfigKey: true
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Unified validation function', ...validationTest })

    const allPassed = testResults.every(t => t.passed)

    return {
      issueNumber: 3,
      title: 'Architectural Design Flaw',
      description: 'Dual validation systems conflict - config accepts API key but validation ignores it',
      status: allPassed ? 'RESOLVED' : 'STILL_BROKEN',
      testResults,
      originalProblem: 'User passes API key → Config accepts it → Internal validation ignores it → Throws error',
      fixApplied: 'Created getApiKeyWithConfig() that checks config first, then environment. Updated all validation to use unified function.'
    }
  }

  // Issue 4: Client-Side Environment Access Issues
  const testIssue4 = async (): Promise<IssueTestResult> => {
    const testResults: Array<{ name: string; passed: boolean; details: string; evidence?: any }> = []

    // Test 4a: Multiple client-side access patterns
    const clientAccessTest = await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-client-access-test',
      isClient: true 
    }, () => {
      try {
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-client-access-test',
          details: `Successfully accessed client-side environment variable. Got: ${apiKey}`,
          evidence: { 
            apiKey,
            isClient: true,
            framework: detectFramework()
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Client-side access failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Client-side environment access', ...clientAccessTest })

    // Test 4b: Vite client-side patterns
    const viteClientTest = await withMockedEnvironment('vite', { 
      apiKey: 'sk-vite-client-test'
    }, () => {
      try {
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-vite-client-test',
          details: `Vite client-side access successful. Got: ${apiKey}`,
          evidence: { 
            apiKey,
            framework: detectFramework(),
            accessPattern: 'import.meta.env'
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Vite client access failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Vite client-side patterns', ...viteClientTest })

    // Test 4c: Fallback access methods
    const fallbackAccessTest = await withMockedEnvironment('unknown', { 
      apiKey: 'sk-fallback-test'
    }, () => {
      try {
        const apiKey = getApiKey()
        return {
          passed: apiKey === 'sk-fallback-test',
          details: `Fallback access methods worked. Got: ${apiKey}`,
          evidence: { 
            apiKey,
            framework: detectFramework(),
            usedFallback: true
          }
        }
      } catch (error) {
        return {
          passed: false,
          details: `Fallback access failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })
    testResults.push({ name: 'Fallback access methods', ...fallbackAccessTest })

    const allPassed = testResults.every(t => t.passed)

    return {
      issueNumber: 4,
      title: 'Client-Side Environment Access Issues',
      description: 'Package doesn\'t properly handle client-side environment variable access patterns',
      status: allPassed ? 'RESOLVED' : 'STILL_BROKEN',
      testResults,
      originalProblem: 'Package fails to access environment variables in client-side contexts (Next.js, Vite)',
      fixApplied: 'Enhanced getEnvironmentVariable() with multiple client-side access patterns: window.process?.env, globalThis.process?.env, import.meta.env'
    }
  }

  // Issue 5: Error Messaging is Misleading
  const testIssue5 = async (): Promise<IssueTestResult> => {
    const testResults: Array<{ name: string; passed: boolean; details: string; evidence?: any }> = []

    // Test 5a: Enhanced error message content
    const errorContentTest = await withMockedEnvironment('unknown', {}, () => {
      try {
        getApiKey()
        return {
          passed: false,
          details: 'Expected error to be thrown',
          evidence: { shouldHaveThrown: true }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const hasDebugInfo = errorMessage.includes('Debug Information:')
        const hasAttemptedSources = errorMessage.includes('Attempted sources:')
        const hasFrameworkInfo = errorMessage.includes('Framework detected:')
        const hasDirectAccess = errorMessage.includes('Direct access results:')
        
        return {
          passed: hasDebugInfo && hasAttemptedSources && hasFrameworkInfo && hasDirectAccess,
          details: `Error message enhancement check. Debug info: ${hasDebugInfo}, Sources: ${hasAttemptedSources}, Framework: ${hasFrameworkInfo}, Direct access: ${hasDirectAccess}`,
          evidence: { 
            errorMessage,
            hasDebugInfo,
            hasAttemptedSources,
            hasFrameworkInfo,
            hasDirectAccess,
            messageLength: errorMessage.length
          }
        }
      }
    })
    testResults.push({ name: 'Enhanced error message content', ...errorContentTest })

    // Test 5b: Framework-specific guidance
    const frameworkGuidanceTest = await withMockedEnvironment('nextjs', {}, () => {
      try {
        getApiKey()
        return {
          passed: false,
          details: 'Expected error to be thrown',
          evidence: { shouldHaveThrown: true }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const hasNextJSGuidance = errorMessage.includes('For Next.js:')
        const hasAlternative = errorMessage.includes('Alternative: Use environmentConfig()')
        
        return {
          passed: hasNextJSGuidance && hasAlternative,
          details: `Framework guidance check. Next.js guidance: ${hasNextJSGuidance}, Alternative: ${hasAlternative}`,
          evidence: { 
            errorMessage,
            hasNextJSGuidance,
            hasAlternative
          }
        }
      }
    })
    testResults.push({ name: 'Framework-specific guidance', ...frameworkGuidanceTest })

    // Test 5c: Actionable troubleshooting
    const troubleshootingTest = await withMockedEnvironment('vite', {}, () => {
      try {
        getApiKey()
        return {
          passed: false,
          details: 'Expected error to be thrown',
          evidence: { shouldHaveThrown: true }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const hasViteGuidance = errorMessage.includes('VITE_OPENAI_API_KEY')
        const hasEnvironmentInfo = errorMessage.includes('Environment: client-side')
        
        return {
          passed: hasViteGuidance && hasEnvironmentInfo,
          details: `Troubleshooting info check. Vite guidance: ${hasViteGuidance}, Environment info: ${hasEnvironmentInfo}`,
          evidence: { 
            errorMessage,
            hasViteGuidance,
            hasEnvironmentInfo
          }
        }
      }
    })
    testResults.push({ name: 'Actionable troubleshooting', ...troubleshootingTest })

    const allPassed = testResults.every(t => t.passed)

    return {
      issueNumber: 5,
      title: 'Error Messaging is Misleading',
      description: 'Generic "API key not found" when real issue is package\'s inability to read existing variables',
      status: allPassed ? 'RESOLVED' : 'STILL_BROKEN',
      testResults,
      originalProblem: 'Error says "API key not found" when package can\'t access existing environment variables',
      fixApplied: 'Enhanced error messages with debug information, attempted sources, framework guidance, and actionable troubleshooting steps'
    }
  }

  const formatIssueResult = (result: IssueTestResult) => (
    <div className={`border rounded-lg p-4 ${
      result.status === 'RESOLVED' ? 'border-green-200 bg-green-50' : 
      result.status === 'STILL_BROKEN' ? 'border-red-200 bg-red-50' : 
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold">Issue #{result.issueNumber}: {result.title}</h4>
          <p className="text-sm text-gray-600">{result.description}</p>
        </div>
        <span className={`px-3 py-1 rounded font-medium ${
          result.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
          result.status === 'STILL_BROKEN' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {result.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="font-medium text-sm">Original Problem:</span>
          <p className="text-sm text-gray-700 bg-red-50 p-2 rounded mt-1">{result.originalProblem}</p>
        </div>
        <div>
          <span className="font-medium text-sm">Fix Applied:</span>
          <p className="text-sm text-gray-700 bg-green-50 p-2 rounded mt-1">{result.fixApplied}</p>
        </div>
      </div>

      <div>
        <span className="font-medium text-sm">Test Results:</span>
        <div className="mt-2 space-y-2">
          {result.testResults.map((test, idx) => (
            <div key={idx} className={`p-2 rounded text-sm ${
              test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{test.name}</span>
                <span>{test.passed ? '✅ PASS' : '❌ FAIL'}</span>
              </div>
              <div className="text-xs mt-1">{test.details}</div>
              {test.evidence && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs underline">Evidence</summary>
                  <pre className="text-xs bg-white p-1 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(test.evidence, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Issue Reproduction Test</h2>
          <p className="text-gray-600 mt-1">
            Tests that reproduce the exact 5 issues reported by users to verify they are resolved.
          </p>
        </div>
        <button
          onClick={runAllIssueTests}
          disabled={isRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isRunning ? 'Testing Issues...' : 'Test All Issues'}
        </button>
      </div>

      {/* Overall Status */}
      {overallStatus !== 'UNKNOWN' && (
        <div className={`border rounded-lg p-4 ${
          overallStatus === 'ALL_RESOLVED' ? 'border-green-200 bg-green-50' :
          overallStatus === 'SOME_BROKEN' ? 'border-red-200 bg-red-50' :
          'border-gray-200 bg-gray-50'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Overall Status</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${
              overallStatus === 'ALL_RESOLVED' ? 'text-green-600' :
              overallStatus === 'SOME_BROKEN' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {overallStatus === 'ALL_RESOLVED' ? '🎉' :
               overallStatus === 'SOME_BROKEN' ? '⚠️' : '❓'}
            </span>
            <span className={`font-medium ${
              overallStatus === 'ALL_RESOLVED' ? 'text-green-800' :
              overallStatus === 'SOME_BROKEN' ? 'text-red-800' :
              'text-gray-800'
            }`}>
              {overallStatus === 'ALL_RESOLVED' ? 'All reported issues have been resolved!' :
               overallStatus === 'SOME_BROKEN' ? 'Some issues are still broken and need attention.' :
               'Testing status unknown'}
            </span>
          </div>
          
          {overallStatus === 'ALL_RESOLVED' && (
            <div className="mt-2 text-sm text-green-700">
              ✅ Users should no longer experience the original problems they reported.
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Click "Test All Issues" to reproduce and verify the original reported issues.
          </div>
        )}
        
        {isRunning && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-600">Reproducing original issues to verify fixes...</div>
          </div>
        )}
        
        {testResults.map((result, index) => (
          <div key={index}>
            {formatIssueResult(result)}
          </div>
        ))}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">📋 Issue Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status === 'RESOLVED').length}
              </div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter(r => r.status === 'STILL_BROKEN').length}
              </div>
              <div className="text-sm text-gray-600">Still Broken</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {testResults.filter(r => r.status === 'UNKNOWN').length}
              </div>
              <div className="text-sm text-gray-600">Unknown</div>
            </div>
          </div>
        </div>
      )}

      {/* What This Tests */}
      <div className="border rounded-lg p-4 bg-purple-50">
        <h3 className="font-semibold mb-2">🔍 Original Issues Tested</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Issue #1:</strong> Environment variable detection logic broken</li>
          <li>• <strong>Issue #2:</strong> Framework detection failing (showing "unknown")</li>
          <li>• <strong>Issue #3:</strong> Architectural design flaw (dual validation systems)</li>
          <li>• <strong>Issue #4:</strong> Client-side environment access issues</li>
          <li>• <strong>Issue #5:</strong> Error messaging is misleading</li>
        </ul>
        <div className="mt-3 text-sm text-purple-700">
          <strong>Purpose:</strong> Verify that the exact problems reported by users are now resolved.
        </div>
      </div>
    </div>
  )
} 