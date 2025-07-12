import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
export function OnboardingFlow({ config, onComplete, onSkip, className = '' }) {
    var _a, _b, _c, _d, _e;
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [collectedData, setCollectedData] = useState({});
    const [currentFieldValue, setCurrentFieldValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const steps = config.onboardingSteps || [];
    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;
    const canSkip = ((_a = config.development) === null || _a === void 0 ? void 0 : _a.debugMode) || false;
    // Field validation
    const validateField = useCallback((value, fieldName) => {
        var _a;
        if (!fieldName)
            return null;
        if (!value.trim()) {
            return `${fieldName} is required`;
        }
        // Custom validation patterns
        switch (fieldName.toLowerCase()) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? null : 'Please enter a valid email address';
            case 'name':
            case 'fullname':
                return value.length >= 2 ? null : 'Name must be at least 2 characters';
            case 'role':
                const allowedRoles = ((_a = config.visibility) === null || _a === void 0 ? void 0 : _a.rolesAllowed) || [];
                return allowedRoles.length === 0 || allowedRoles.includes(value.toLowerCase())
                    ? null
                    : `Role must be one of: ${allowedRoles.join(', ')}`;
            default:
                return value.length >= 1 ? null : `${fieldName} cannot be empty`;
        }
    }, [(_b = config.visibility) === null || _b === void 0 ? void 0 : _b.rolesAllowed]);
    // Handle field input change
    const handleFieldChange = useCallback((value) => {
        setCurrentFieldValue(value);
        setValidationError(null);
    }, []);
    // Handle next step
    const handleNext = useCallback(async () => {
        var _a, _b;
        if (!currentStep)
            return;
        // Validate current field if exists
        if (currentStep.fieldToCollect) {
            const error = validateField(currentFieldValue, currentStep.fieldToCollect);
            if (error) {
                setValidationError(error);
                return;
            }
            // Store the collected data
            setCollectedData(prev => (Object.assign(Object.assign({}, prev), { [currentStep.fieldToCollect]: currentFieldValue })));
        }
        setIsLoading(true);
        // Simulate API call for compliance/GDPR data processing
        if (((_a = config.security) === null || _a === void 0 ? void 0 : _a.compliance) !== 'none') {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (isLastStep) {
            // Complete onboarding
            const finalData = currentStep.fieldToCollect
                ? Object.assign(Object.assign({}, collectedData), { [currentStep.fieldToCollect]: currentFieldValue }) : collectedData;
            // Add metadata
            const enrichedData = Object.assign(Object.assign({}, finalData), { completedAt: new Date().toISOString(), version: '1.0', compliance: ((_b = config.security) === null || _b === void 0 ? void 0 : _b.compliance) || 'none' });
            onComplete(enrichedData);
        }
        else {
            // Move to next step
            setCurrentStepIndex(prev => prev + 1);
            setCurrentFieldValue('');
        }
        setIsLoading(false);
    }, [currentStep, currentFieldValue, isLastStep, collectedData, onComplete, validateField, (_c = config.security) === null || _c === void 0 ? void 0 : _c.compliance]);
    // Handle skip
    const handleSkip = useCallback(() => {
        if (onSkip) {
            onSkip();
        }
        else {
            // Default skip behavior - complete with partial data
            onComplete(Object.assign(Object.assign({}, collectedData), { skipped: true, skippedAt: new Date().toISOString() }));
        }
    }, [onSkip, onComplete, collectedData]);
    // Handle back
    const handleBack = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            // Restore previous field value if exists
            const prevStep = steps[currentStepIndex - 1];
            if (prevStep.fieldToCollect && collectedData[prevStep.fieldToCollect]) {
                setCurrentFieldValue(collectedData[prevStep.fieldToCollect]);
            }
            else {
                setCurrentFieldValue('');
            }
            setValidationError(null);
        }
    }, [currentStepIndex, steps, collectedData]);
    // Auto-focus input on step change
    useEffect(() => {
        setValidationError(null);
    }, [currentStepIndex]);
    if (!steps.length) {
        return null;
    }
    return (_jsxs("div", { className: `max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`, children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: ["Step ", currentStepIndex + 1, " of ", steps.length] }), canSkip && (_jsx("button", { onClick: handleSkip, className: "text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200", children: "Skip setup" }))] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${((currentStepIndex + 1) / steps.length) * 100}%` } }) })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [((_d = config.persona) === null || _d === void 0 ? void 0 : _d.avatarUrl) ? (_jsx("img", { src: config.persona.avatarUrl, alt: config.name, className: "w-10 h-10 rounded-full mr-3" })) : (_jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3", children: _jsx("span", { className: "text-blue-600 dark:text-blue-300 font-semibold", children: config.name.charAt(0).toUpperCase() }) })), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: config.name }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: config.description || 'AI Assistant' })] })] }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4", children: _jsx("p", { className: "text-gray-800 dark:text-gray-200", children: currentStep.message }) }), currentStep.fieldToCollect && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: currentStep.fieldToCollect.charAt(0).toUpperCase() +
                                    currentStep.fieldToCollect.slice(1).replace(/([A-Z])/g, ' $1') }), _jsx(Input, { type: currentStep.fieldToCollect.toLowerCase().includes('email') ? 'email' : 'text', value: currentFieldValue, onChange: (e) => handleFieldChange(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter' && !isLoading) {
                                        handleNext();
                                    }
                                }, placeholder: `Enter your ${currentStep.fieldToCollect.toLowerCase()}`, className: validationError ? 'border-red-500' : '', autoFocus: true }), validationError && (_jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: validationError }))] }))] }), _jsxs("div", { className: "flex justify-between space-x-3", children: [_jsx(Button, { variant: "outline", onClick: handleBack, disabled: currentStepIndex === 0 || isLoading, className: "flex-1", children: "Back" }), _jsx(Button, { onClick: handleNext, disabled: isLoading, className: "flex-1", children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Processing..."] })) : isLastStep ? ('Complete Setup') : ('Continue') })] }), ((_e = config.security) === null || _e === void 0 ? void 0 : _e.compliance) && config.security.compliance !== 'none' && (_jsxs("div", { className: "mt-4 text-xs text-gray-500 dark:text-gray-400 text-center", children: ["By continuing, you agree to our data processing policies (", config.security.compliance.toUpperCase(), ")"] }))] }));
}
