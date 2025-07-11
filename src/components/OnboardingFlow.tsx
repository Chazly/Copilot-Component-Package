import React, { useState, useCallback, useEffect } from 'react'
import { AICopilotConfig } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface OnboardingFlowProps {
  config: AICopilotConfig
  onComplete: (collectedData: Record<string, any>) => void
  onSkip?: () => void
  className?: string
}

interface OnboardingStep {
  stepId: string
  message: string
  fieldToCollect?: string
}

interface CollectedData {
  [key: string]: any
}

export function OnboardingFlow({ 
  config, 
  onComplete, 
  onSkip, 
  className = '' 
}: OnboardingFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [collectedData, setCollectedData] = useState<CollectedData>({})
  const [currentFieldValue, setCurrentFieldValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const steps = config.onboardingSteps || []
  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1
  const canSkip = config.development?.debugMode || false

  // Field validation
  const validateField = useCallback((value: string, fieldName?: string): string | null => {
    if (!fieldName) return null
    
    if (!value.trim()) {
      return `${fieldName} is required`
    }

    // Custom validation patterns
    switch (fieldName.toLowerCase()) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? null : 'Please enter a valid email address'
      
      case 'name':
      case 'fullname':
        return value.length >= 2 ? null : 'Name must be at least 2 characters'
      
      case 'role':
        const allowedRoles = config.visibility?.rolesAllowed || []
        return allowedRoles.length === 0 || allowedRoles.includes(value.toLowerCase()) 
          ? null 
          : `Role must be one of: ${allowedRoles.join(', ')}`
      
      default:
        return value.length >= 1 ? null : `${fieldName} cannot be empty`
    }
  }, [config.visibility?.rolesAllowed])

  // Handle field input change
  const handleFieldChange = useCallback((value: string) => {
    setCurrentFieldValue(value)
    setValidationError(null)
  }, [])

  // Handle next step
  const handleNext = useCallback(async () => {
    if (!currentStep) return

    // Validate current field if exists
    if (currentStep.fieldToCollect) {
      const error = validateField(currentFieldValue, currentStep.fieldToCollect)
      if (error) {
        setValidationError(error)
        return
      }

      // Store the collected data
      setCollectedData(prev => ({
        ...prev,
        [currentStep.fieldToCollect!]: currentFieldValue
      }))
    }

    setIsLoading(true)

    // Simulate API call for compliance/GDPR data processing
    if (config.security?.compliance !== 'none') {
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    if (isLastStep) {
      // Complete onboarding
      const finalData = currentStep.fieldToCollect 
        ? { ...collectedData, [currentStep.fieldToCollect]: currentFieldValue }
        : collectedData

      // Add metadata
      const enrichedData = {
        ...finalData,
        completedAt: new Date().toISOString(),
        version: '1.0',
        compliance: config.security?.compliance || 'none'
      }

      onComplete(enrichedData)
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1)
      setCurrentFieldValue('')
    }

    setIsLoading(false)
  }, [currentStep, currentFieldValue, isLastStep, collectedData, onComplete, validateField, config.security?.compliance])

  // Handle skip
  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip()
    } else {
      // Default skip behavior - complete with partial data
      onComplete({
        ...collectedData,
        skipped: true,
        skippedAt: new Date().toISOString()
      })
    }
  }, [onSkip, onComplete, collectedData])

  // Handle back
  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
      
      // Restore previous field value if exists
      const prevStep = steps[currentStepIndex - 1]
      if (prevStep.fieldToCollect && collectedData[prevStep.fieldToCollect]) {
        setCurrentFieldValue(collectedData[prevStep.fieldToCollect])
      } else {
        setCurrentFieldValue('')
      }
      
      setValidationError(null)
    }
  }, [currentStepIndex, steps, collectedData])

  // Auto-focus input on step change
  useEffect(() => {
    setValidationError(null)
  }, [currentStepIndex])

  if (!steps.length) {
    return null
  }

  return (
    <div className={`max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          {canSkip && (
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip setup
            </button>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step content */}
      <div className="mb-6">
        {/* Avatar and name */}
        <div className="flex items-center mb-4">
          {config.persona?.avatarUrl ? (
            <img 
              src={config.persona.avatarUrl} 
              alt={config.name}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <span className="text-blue-600 dark:text-blue-300 font-semibold">
                {config.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {config.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {config.description || 'AI Assistant'}
            </p>
          </div>
        </div>

        {/* Step message */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <p className="text-gray-800 dark:text-gray-200">
            {currentStep.message}
          </p>
        </div>

        {/* Field input if required */}
        {currentStep.fieldToCollect && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentStep.fieldToCollect.charAt(0).toUpperCase() + 
               currentStep.fieldToCollect.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            <Input
              type={currentStep.fieldToCollect.toLowerCase().includes('email') ? 'email' : 'text'}
              value={currentFieldValue}
              onChange={(e) => handleFieldChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleNext()
                }
              }}
              placeholder={`Enter your ${currentStep.fieldToCollect.toLowerCase()}`}
              className={validationError ? 'border-red-500' : ''}
              autoFocus
            />
            {validationError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between space-x-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || isLoading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </div>
          ) : isLastStep ? (
            'Complete Setup'
          ) : (
            'Continue'
          )}
        </Button>
      </div>

      {/* Compliance notice */}
      {config.security?.compliance && config.security.compliance !== 'none' && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          By continuing, you agree to our data processing policies ({config.security.compliance.toUpperCase()})
        </div>
      )}
    </div>
  )
} 