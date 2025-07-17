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
  createDevelopmentConfig,
  createProductionConfig 
} from '../../../src/builders/ConfigBuilder'
import { 
  withMockedEnvironment 
} from '../../../src/lib/env.test.utils'

interface UserScenarioResult {
  scenarioName: string
  description: string
  userStory: string
  expectedOutcome: string
  actualResult: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  details: string
  evidence?: any
  recommendations?: string[]
}

export default function UserAcceptanceTest() {
  const [scenarioResults, setScenarioResults] = useState<UserScenarioResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'UNKNOWN' | 'ALL_PASS' | 'SOME_FAIL'>('UNKNOWN')

  const runAllUserScenarios = async () => {
    setIsRunning(true)
    const results: UserScenarioResult[] = []

    // Scenario 1: Next.js Developer with Environment Variable
    results.push(await testNextJSDeveloperScenario())

    // Scenario 2: Vite Developer with Public Key
    results.push(await testViteDeveloperScenario())

    // Scenario 3: Enterprise User with Config Override
    results.push(await testEnterpriseConfigScenario())

    // Scenario 4: New User with No Setup
    results.push(await testNewUserScenario())

    // Scenario 5: Production Deployment
    results.push(await testProductionDeploymentScenario())

    // Scenario 6: Development to Production Migration
    results.push(await testDevToProdMigrationScenario())

    // Scenario 7: Framework Migration
    results.push(await testFrameworkMigrationScenario())

    // Scenario 8: Error Troubleshooting
    results.push(await testErrorTroubleshootingScenario())

    setScenarioResults(results)

    // Determine overall status
    const allSuccess = results.every(r => r.actualResult === 'SUCCESS')
    const anyFailure = results.some(r => r.actualResult === 'FAILURE')
    
    if (allSuccess) {
      setOverallStatus('ALL_PASS')
    } else if (anyFailure) {
      setOverallStatus('SOME_FAIL')
    } else {
      setOverallStatus('UNKNOWN')
    }

    setIsRunning(false)
  }

  // Scenario 1: Next.js Developer with Environment Variable
  const testNextJSDeveloperScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-nextjs-developer-key',
      isClient: false 
    }, () => {
      try {
        // User story: Next.js developer sets OPENAI_API_KEY in .env.local
        const config = createBasicConfig('Next.js Chat App', 'Welcome to our Next.js chat app!')
          .model('openai', 'gpt-4')
          .storage('./data/chat.db', './data/embeddings')
          .systemPrompt('You are a helpful assistant for our Next.js application.')
          .autoDetectEnvironment()
          .build()

        const framework = detectFramework()
        const validation = validateEnvironment()

        return {
          scenarioName: 'Next.js Developer with Environment Variable',
          description: 'Developer sets up API key in .env.local file for Next.js project',
          userStory: 'As a Next.js developer, I want to set OPENAI_API_KEY in my .env.local file and have the copilot package automatically detect and use it.',
          expectedOutcome: 'Package detects Next.js framework, finds API key, builds config successfully',
          actualResult: framework === 'nextjs' && validation.hasApiKey && config.name === 'Next.js Chat App' ? 'SUCCESS' : 'FAILURE',
          details: `Framework: ${framework}, Has API Key: ${validation.hasApiKey}, Config Built: ${!!config}`,
          evidence: { 
            framework, 
            validation, 
            configName: config.name,
            modelProvider: config.modelProvider
          }
        }
      } catch (error) {
        return {
          scenarioName: 'Next.js Developer with Environment Variable',
          description: 'Developer sets up API key in .env.local file for Next.js project',
          userStory: 'As a Next.js developer, I want to set OPENAI_API_KEY in my .env.local file and have the copilot package automatically detect and use it.',
          expectedOutcome: 'Package detects Next.js framework, finds API key, builds config successfully',
          actualResult: 'FAILURE',
          details: `Failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) },
          recommendations: [
            'Check that OPENAI_API_KEY is properly set in .env.local',
            'Ensure Next.js environment variables are properly loaded',
            'Verify framework detection is working correctly'
          ]
        }
      }
    })
  }

  // Scenario 2: Vite Developer with Public Key
  const testViteDeveloperScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('vite', { 
      apiKey: 'sk-vite-developer-key'
    }, () => {
      try {
        // User story: Vite developer sets VITE_OPENAI_API_KEY for client-side access
        const config = createDevelopmentConfig('Vite Dev Chat', 'Development chat interface')
          .model('openai', 'gpt-3.5-turbo')
          .storage('./dev-data/chat.db', './dev-data/embeddings')
          .systemPrompt('You are a development assistant.')
          .autoDetectEnvironment()
          .build()

        const framework = detectFramework()
        const apiKey = getApiKey()

        return {
          scenarioName: 'Vite Developer with Public Key',
          description: 'Developer uses VITE_OPENAI_API_KEY for client-side development',
          userStory: 'As a Vite developer, I want to use VITE_OPENAI_API_KEY for client-side development and have the package automatically detect my framework and API key.',
          expectedOutcome: 'Package detects Vite framework, finds prefixed API key, enables development features',
          actualResult: framework === 'vite' && apiKey === 'sk-vite-developer-key' && config.development?.debugMode ? 'SUCCESS' : 'FAILURE',
          details: `Framework: ${framework}, API Key Found: ${apiKey === 'sk-vite-developer-key'}, Debug Mode: ${config.development?.debugMode}`,
          evidence: { 
            framework, 
            apiKeyFound: apiKey === 'sk-vite-developer-key',
            debugMode: config.development?.debugMode,
            configName: config.name
          }
        }
      } catch (error) {
        return {
          scenarioName: 'Vite Developer with Public Key',
          description: 'Developer uses VITE_OPENAI_API_KEY for client-side development',
          userStory: 'As a Vite developer, I want to use VITE_OPENAI_API_KEY for client-side development and have the package automatically detect my framework and API key.',
          expectedOutcome: 'Package detects Vite framework, finds prefixed API key, enables development features',
          actualResult: 'FAILURE',
          details: `Failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) },
          recommendations: [
            'Ensure VITE_OPENAI_API_KEY is set with VITE_ prefix',
            'Check that import.meta.env is available in your Vite setup',
            'Verify Vite environment variable loading'
          ]
        }
      }
    })
  }

  // Scenario 3: Enterprise User with Config Override
  const testEnterpriseConfigScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('unknown', {}, () => {
      try {
        // User story: Enterprise user wants to provide API key directly in config for security
        const config = createEnterpriseConfig('Enterprise Copilot', 'Secure enterprise assistant')
          .model('openai', 'gpt-4')
          .storage('./secure/enterprise.db', './secure/embeddings')
          .systemPrompt('You are a secure enterprise assistant with compliance requirements.')
          .environmentConfig({
            apiKey: 'sk-enterprise-secure-key',
            requireApiKey: true,
            framework: 'nextjs'
          })
          .security({
            encryptAtRest: true,
            compliance: ['gdpr', 'hipaa'],
            auditLogging: true
          })
          .build()

        const hasEnterpriseSecurity = !!config.enterpriseSecurity?.enabled
        const hasCompliance = !!config.security?.compliance?.includes('gdpr')

        return {
          scenarioName: 'Enterprise User with Config Override',
          description: 'Enterprise user provides API key directly in config for enhanced security',
          userStory: 'As an enterprise user, I want to provide the API key directly in my configuration instead of environment variables for better security control.',
          expectedOutcome: 'Package accepts config API key, enables enterprise features, maintains security compliance',
          actualResult: config.name === 'Enterprise Copilot' && hasEnterpriseSecurity && hasCompliance ? 'SUCCESS' : 'FAILURE',
          details: `Config Built: ${!!config}, Enterprise Security: ${hasEnterpriseSecurity}, GDPR Compliance: ${hasCompliance}`,
          evidence: { 
            configBuilt: !!config,
            enterpriseSecurity: hasEnterpriseSecurity,
            compliance: config.security?.compliance,
            encryptAtRest: config.security?.encryptAtRest
          }
        }
      } catch (error) {
        return {
          scenarioName: 'Enterprise User with Config Override',
          description: 'Enterprise user provides API key directly in config for enhanced security',
          userStory: 'As an enterprise user, I want to provide the API key directly in my configuration instead of environment variables for better security control.',
          expectedOutcome: 'Package accepts config API key, enables enterprise features, maintains security compliance',
          actualResult: 'FAILURE',
          details: `Failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) },
          recommendations: [
            'Verify environmentConfig() accepts apiKey parameter',
            'Check enterprise security features are enabled',
            'Ensure compliance settings are properly configured'
          ]
        }
      }
    })
  }

  // Scenario 4: New User with No Setup
  const testNewUserScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('unknown', {}, () => {
      try {
        // User story: New user tries to use package without any setup
        const result = createBasicConfig('My First Copilot', 'Hello world!')
          .model('openai', 'gpt-3.5-turbo')
          .storage('./data/copilot.db', './data/embeddings')
          .systemPrompt('You are a helpful assistant.')
          .tryBuild()

        const hasHelpfulError = !result.success && result.errors && result.errors.length > 0
        const errorContainsGuidance = hasHelpfulError && 
          result.errors.some(err => err.includes('Add one of the following to your environment'))

        return {
          scenarioName: 'New User with No Setup',
          description: 'New user attempts to use package without any API key configuration',
          userStory: 'As a new user, I want to understand what went wrong and get clear guidance on how to fix setup issues.',
          expectedOutcome: 'Package provides helpful error message with clear setup instructions',
          actualResult: hasHelpfulError && errorContainsGuidance ? 'SUCCESS' : 'FAILURE',
          details: `Build Failed: ${!result.success}, Has Errors: ${!!result.errors?.length}, Contains Guidance: ${errorContainsGuidance}`,
          evidence: { 
            success: result.success,
            errors: result.errors,
            hasGuidance: errorContainsGuidance
          },
          recommendations: hasHelpfulError ? [] : [
            'Ensure tryBuild() returns helpful error messages',
            'Check that error messages contain setup guidance',
            'Verify new user experience is clear and actionable'
          ]
        }
      } catch (error) {
        return {
          scenarioName: 'New User with No Setup',
          description: 'New user attempts to use package without any API key configuration',
          userStory: 'As a new user, I want to understand what went wrong and get clear guidance on how to fix setup issues.',
          expectedOutcome: 'Package provides helpful error message with clear setup instructions',
          actualResult: 'FAILURE',
          details: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) },
          recommendations: [
            'Fix unexpected error in new user flow',
            'Ensure graceful error handling for missing setup',
            'Improve new user experience'
          ]
        }
      }
    })
  }

  // Scenario 5: Production Deployment
  const testProductionDeploymentScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('nextjs', { 
      apiKey: 'sk-production-api-key',
      isClient: false 
    }, () => {
      try {
        // User story: Production deployment with security and performance requirements
        const config = createProductionConfig('Production Chat', 'Production-ready chat interface')
          .model('openai', 'gpt-4')
          .storage('./prod/chat.db', './prod/embeddings')
          .systemPrompt('You are a production assistant.')
          .security({
            encryptAtRest: true,
            compliance: ['gdpr'],
            auditLogging: true
          })
          .performance({
            rateLimiting: {
              maxRequestsPerMinute: 60,
              maxRequestsPerHour: 1000
            },
            caching: {
              enabled: true,
              ttl: 300
            }
          })
          .autoDetectEnvironment()
          .requireApiKey()
          .build()

        const hasProductionSecurity = !!config.security?.encryptAtRest
        const hasRateLimiting = !!config.performance?.rateLimiting?.maxRequestsPerMinute
        const framework = detectFramework()

        return {
          scenarioName: 'Production Deployment',
          description: 'Production deployment with security and performance optimizations',
          userStory: 'As a DevOps engineer, I want to deploy the copilot to production with proper security, performance, and monitoring configurations.',
          expectedOutcome: 'Package configures production-ready settings with security, rate limiting, and monitoring',
          actualResult: framework === 'nextjs' && hasProductionSecurity && hasRateLimiting ? 'SUCCESS' : 'FAILURE',
          details: `Framework: ${framework}, Security: ${hasProductionSecurity}, Rate Limiting: ${hasRateLimiting}`,
          evidence: { 
            framework, 
            security: config.security,
            performance: config.performance,
            configName: config.name
          }
        }
      } catch (error) {
        return {
          scenarioName: 'Production Deployment',
          description: 'Production deployment with security and performance optimizations',
          userStory: 'As a DevOps engineer, I want to deploy the copilot to production with proper security, performance, and monitoring configurations.',
          expectedOutcome: 'Package configures production-ready settings with security, rate limiting, and monitoring',
          actualResult: 'FAILURE',
          details: `Failed: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { error: error instanceof Error ? error.message : String(error) },
          recommendations: [
            'Verify production configuration presets work correctly',
            'Check security and performance settings are applied',
            'Ensure API key validation works in production mode'
          ]
        }
      }
    })
  }

  // Scenario 6: Development to Production Migration
  const testDevToProdMigrationScenario = async (): Promise<UserScenarioResult> => {
    try {
      // First create development config
      const devConfig = await withMockedEnvironment('vite', { 
        apiKey: 'sk-dev-key'
      }, () => {
        return createDevelopmentConfig('Dev Copilot', 'Development version')
          .model('openai', 'gpt-3.5-turbo')
          .storage('./dev/copilot.db', './dev/embeddings')
          .systemPrompt('Development assistant')
          .development({
            debugMode: true,
            mockMode: false
          })
          .build()
      })

      // Then migrate to production config
      const prodConfig = await withMockedEnvironment('nextjs', { 
        apiKey: 'sk-prod-key',
        isClient: false 
      }, () => {
        return createProductionConfig('Prod Copilot', 'Production version')
          .model('openai', 'gpt-4')
          .storage('./prod/copilot.db', './prod/embeddings')
          .systemPrompt('Production assistant')
          .security({
            encryptAtRest: true,
            auditLogging: true
          })
          .build()
      })

      const devBuilt = !!devConfig
      const prodBuilt = !!prodConfig
      const configsCorrect = devConfig.development?.debugMode && !prodConfig.development?.debugMode

      return {
        scenarioName: 'Development to Production Migration',
        description: 'Migrating configuration from development to production environment',
        userStory: 'As a developer, I want to easily migrate my copilot configuration from development to production with appropriate security and performance changes.',
        expectedOutcome: 'Both configs build successfully with appropriate environment-specific settings',
        actualResult: devBuilt && prodBuilt && configsCorrect ? 'SUCCESS' : 'PARTIAL',
        details: `Dev Built: ${devBuilt}, Prod Built: ${prodBuilt}, Settings Correct: ${configsCorrect}`,
        evidence: { 
          devConfig: { built: devBuilt, debugMode: devConfig?.development?.debugMode },
          prodConfig: { built: prodBuilt, debugMode: prodConfig?.development?.debugMode, security: !!prodConfig?.security }
        }
      }
    } catch (error) {
      return {
        scenarioName: 'Development to Production Migration',
        description: 'Migrating configuration from development to production environment',
        userStory: 'As a developer, I want to easily migrate my copilot configuration from development to production with appropriate security and performance changes.',
        expectedOutcome: 'Both configs build successfully with appropriate environment-specific settings',
        actualResult: 'FAILURE',
        details: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        evidence: { error: error instanceof Error ? error.message : String(error) },
        recommendations: [
          'Verify development and production presets work correctly',
          'Check configuration migration process',
          'Ensure environment-specific settings are applied properly'
        ]
      }
    }
  }

  // Scenario 7: Framework Migration
  const testFrameworkMigrationScenario = async (): Promise<UserScenarioResult> => {
    try {
      // Test migration from Vite to Next.js
      const viteConfig = await withMockedEnvironment('vite', { 
        apiKey: 'sk-vite-migration'
      }, () => {
        const framework = detectFramework()
        const apiKey = getApiKey()
        return { framework, apiKey, success: framework === 'vite' && apiKey === 'sk-vite-migration' }
      })

      const nextjsConfig = await withMockedEnvironment('nextjs', { 
        apiKey: 'sk-nextjs-migration',
        isClient: false 
      }, () => {
        const framework = detectFramework()
        const apiKey = getApiKey()
        return { framework, apiKey, success: framework === 'nextjs' && apiKey === 'sk-nextjs-migration' }
      })

      const bothWork = viteConfig.success && nextjsConfig.success

      return {
        scenarioName: 'Framework Migration',
        description: 'Migrating project from one framework to another',
        userStory: 'As a developer, I want to migrate my project from Vite to Next.js and have the copilot package automatically adapt to the new framework.',
        expectedOutcome: 'Package detects framework changes and adapts environment variable patterns accordingly',
        actualResult: bothWork ? 'SUCCESS' : 'FAILURE',
        details: `Vite Detection: ${viteConfig.success}, Next.js Detection: ${nextjsConfig.success}`,
        evidence: { 
          vite: viteConfig,
          nextjs: nextjsConfig
        }
      }
    } catch (error) {
      return {
        scenarioName: 'Framework Migration',
        description: 'Migrating project from one framework to another',
        userStory: 'As a developer, I want to migrate my project from Vite to Next.js and have the copilot package automatically adapt to the new framework.',
        expectedOutcome: 'Package detects framework changes and adapts environment variable patterns accordingly',
        actualResult: 'FAILURE',
        details: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        evidence: { error: error instanceof Error ? error.message : String(error) },
        recommendations: [
          'Verify framework detection works across different environments',
          'Check environment variable pattern adaptation',
          'Ensure seamless framework migration'
        ]
      }
    }
  }

  // Scenario 8: Error Troubleshooting
  const testErrorTroubleshootingScenario = async (): Promise<UserScenarioResult> => {
    return await withMockedEnvironment('nextjs', {}, () => {
      try {
        // User story: Developer encounters error and needs to troubleshoot
        getApiKey() // This should throw with helpful debugging info
        
        return {
          scenarioName: 'Error Troubleshooting',
          description: 'Developer troubleshoots API key configuration issues',
          userStory: 'As a developer facing configuration issues, I want detailed error messages that help me understand and fix the problem.',
          expectedOutcome: 'Error message provides comprehensive debugging information',
          actualResult: 'FAILURE',
          details: 'Expected error was not thrown',
          evidence: { shouldHaveThrown: true }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const hasDebugInfo = errorMessage.includes('Debug Information:')
        const hasAttemptedSources = errorMessage.includes('Attempted sources:')
        const hasFrameworkGuidance = errorMessage.includes('For Next.js:')
        const hasAlternativeSolutions = errorMessage.includes('Alternative: Use environmentConfig()')

        const isHelpful = hasDebugInfo && hasAttemptedSources && hasFrameworkGuidance && hasAlternativeSolutions

        return {
          scenarioName: 'Error Troubleshooting',
          description: 'Developer troubleshoots API key configuration issues',
          userStory: 'As a developer facing configuration issues, I want detailed error messages that help me understand and fix the problem.',
          expectedOutcome: 'Error message provides comprehensive debugging information',
          actualResult: isHelpful ? 'SUCCESS' : 'PARTIAL',
          details: `Debug Info: ${hasDebugInfo}, Sources: ${hasAttemptedSources}, Guidance: ${hasFrameworkGuidance}, Alternatives: ${hasAlternativeSolutions}`,
          evidence: { 
            errorMessage,
            hasDebugInfo,
            hasAttemptedSources,
            hasFrameworkGuidance,
            hasAlternativeSolutions,
            messageLength: errorMessage.length
          },
          recommendations: !isHelpful ? [
            'Enhance error messages with more debugging information',
            'Add framework-specific guidance',
            'Provide alternative solution suggestions'
          ] : []
        }
      }
    })
  }

  const formatScenarioResult = (result: UserScenarioResult) => (
    <div className={`border rounded-lg p-4 ${
      result.actualResult === 'SUCCESS' ? 'border-green-200 bg-green-50' : 
      result.actualResult === 'PARTIAL' ? 'border-yellow-200 bg-yellow-50' :
      'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{result.scenarioName}</h4>
        <span className={`px-3 py-1 rounded font-medium ${
          result.actualResult === 'SUCCESS' ? 'bg-green-100 text-green-800' :
          result.actualResult === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {result.actualResult}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{result.description}</p>

      <div className="mb-4">
        <div className="text-sm font-medium text-blue-700">User Story:</div>
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-1 italic">"{result.userStory}"</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="font-medium text-sm">Expected Outcome:</span>
          <p className="text-sm text-gray-700 bg-green-50 p-2 rounded mt-1">{result.expectedOutcome}</p>
        </div>
        <div>
          <span className="font-medium text-sm">Actual Result:</span>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">{result.details}</p>
        </div>
      </div>

      {result.evidence && (
        <div className="mb-4">
          <span className="font-medium text-sm">Evidence:</span>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(result.evidence, null, 2)}
          </pre>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <span className="font-medium text-sm text-orange-700">Recommendations:</span>
          <ul className="text-sm text-orange-600 mt-1 space-y-1">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Acceptance Test</h2>
          <p className="text-gray-600 mt-1">
            Tests real-world user scenarios to ensure the package meets actual user needs and expectations.
          </p>
        </div>
        <button
          onClick={runAllUserScenarios}
          disabled={isRunning}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          {isRunning ? 'Testing Scenarios...' : 'Run User Scenarios'}
        </button>
      </div>

      {/* Overall Status */}
      {overallStatus !== 'UNKNOWN' && (
        <div className={`border rounded-lg p-4 ${
          overallStatus === 'ALL_PASS' ? 'border-green-200 bg-green-50' :
          overallStatus === 'SOME_FAIL' ? 'border-red-200 bg-red-50' :
          'border-gray-200 bg-gray-50'
        }`}>
          <h3 className="text-lg font-semibold mb-2">User Acceptance Status</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${
              overallStatus === 'ALL_PASS' ? 'text-green-600' :
              overallStatus === 'SOME_FAIL' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {overallStatus === 'ALL_PASS' ? '🎯' :
               overallStatus === 'SOME_FAIL' ? '⚠️' : '❓'}
            </span>
            <span className={`font-medium ${
              overallStatus === 'ALL_PASS' ? 'text-green-800' :
              overallStatus === 'SOME_FAIL' ? 'text-red-800' :
              'text-gray-800'
            }`}>
              {overallStatus === 'ALL_PASS' ? 'All user scenarios pass! Package is ready for users.' :
               overallStatus === 'SOME_FAIL' ? 'Some user scenarios failed. User experience needs improvement.' :
               'User acceptance status unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Scenario Results */}
      <div className="space-y-4">
        {scenarioResults.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Click "Run User Scenarios" to test real-world user acceptance scenarios.
          </div>
        )}
        
        {isRunning && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-gray-600">Testing user acceptance scenarios...</div>
          </div>
        )}
        
        {scenarioResults.map((result, index) => (
          <div key={index}>
            {formatScenarioResult(result)}
          </div>
        ))}
      </div>

      {/* Summary */}
      {scenarioResults.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">📊 Scenario Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {scenarioResults.filter(r => r.actualResult === 'SUCCESS').length}
              </div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {scenarioResults.filter(r => r.actualResult === 'PARTIAL').length}
              </div>
              <div className="text-sm text-gray-600">Partial</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {scenarioResults.filter(r => r.actualResult === 'FAILURE').length}
              </div>
              <div className="text-sm text-gray-600">Failure</div>
            </div>
          </div>
        </div>
      )}

      {/* What This Tests */}
      <div className="border rounded-lg p-4 bg-indigo-50">
        <h3 className="font-semibold mb-2">👥 User Scenarios Tested</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Next.js Developer:</strong> Setting up API key in .env.local file</li>
          <li>• <strong>Vite Developer:</strong> Using VITE_OPENAI_API_KEY for client-side development</li>
          <li>• <strong>Enterprise User:</strong> Providing API key directly in configuration for security</li>
          <li>• <strong>New User:</strong> First-time setup experience and error guidance</li>
          <li>• <strong>Production Deployment:</strong> Production-ready configuration with security</li>
          <li>• <strong>Dev to Prod Migration:</strong> Moving from development to production settings</li>
          <li>• <strong>Framework Migration:</strong> Switching between different frameworks</li>
          <li>• <strong>Error Troubleshooting:</strong> Getting help when things go wrong</li>
        </ul>
        <div className="mt-3 text-sm text-indigo-700">
          <strong>Purpose:</strong> Ensure the package works for real users in real scenarios, not just isolated test cases.
        </div>
      </div>
    </div>
  )
} 