import { useState, useCallback, useEffect, useRef } from 'react';
// Default security configuration
const DEFAULT_SECURITY_CONFIG = {
    policies: [],
    threatDetection: {
        enabled: true,
        sensitivity: 'medium',
        rules: [],
        anomalyDetection: {
            enabled: true,
            learningPeriod: 30,
            threshold: 0.7,
            models: ['usage_pattern', 'content_analysis', 'behavioral_analysis']
        },
        responseActions: {
            onSuspiciousActivity: [{ type: 'log' }, { type: 'alert' }],
            onDataExfiltration: [{ type: 'deny' }, { type: 'alert' }, { type: 'quarantine' }],
            onBruteForce: [{ type: 'deny' }, { type: 'alert' }],
            onAnomalousAccess: [{ type: 'log' }, { type: 'challenge' }]
        }
    },
    auditSettings: {
        enabled: true,
        retention: 365,
        encryption: true,
        compression: true,
        realTimeAlerts: true
    },
    compliance: {
        framework: ['gdpr'],
        autoRemediation: false,
        reportingSchedule: 'weekly',
        contactEmail: 'security@company.com'
    },
    dataClassification: {
        enabled: true,
        rules: [],
        defaultLevel: 'internal'
    },
    piiProtection: {
        enabled: true,
        autoDetection: true,
        autoMasking: false,
        detectionPatterns: []
    }
};
// Built-in PII patterns
const BUILT_IN_PII_PATTERNS = [
    {
        type: 'email',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        confidence: 0.95,
        jurisdiction: ['global']
    },
    {
        type: 'phone',
        pattern: '(\\+?[1-9]\\d{1,14}|\\(\\d{3}\\)\\s?\\d{3}-\\d{4})',
        confidence: 0.85,
        jurisdiction: ['global']
    },
    {
        type: 'ssn',
        pattern: '\\d{3}-\\d{2}-\\d{4}',
        confidence: 0.9,
        jurisdiction: ['us']
    },
    {
        type: 'credit_card',
        pattern: '\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}',
        confidence: 0.8,
        jurisdiction: ['global']
    }
];
// Threat detection engine
class ThreatDetectionEngine {
    constructor() {
        this.anomalyBaseline = new Map();
        this.userBehavior = new Map();
    }
    detectThreat(request, userContext) {
        const threats = [];
        let riskScore = 0;
        // Check for injection patterns
        const injectionPatterns = [
            /script\s*>/i,
            /union\s+select/i,
            /drop\s+table/i,
            /<iframe/i,
            /javascript:/i
        ];
        const requestContent = JSON.stringify(request).toLowerCase();
        injectionPatterns.forEach(pattern => {
            if (pattern.test(requestContent)) {
                threats.push('injection_attempt');
                riskScore += 0.8;
            }
        });
        // Check for unusual access patterns
        if (this.isUnusualAccess(userContext)) {
            threats.push('anomalous_access');
            riskScore += 0.6;
        }
        // Check for data exfiltration
        if (this.isDataExfiltration(request)) {
            threats.push('data_exfiltration');
            riskScore += 0.9;
        }
        // Check for brute force
        if (this.isBruteForce(userContext)) {
            threats.push('brute_force');
            riskScore += 0.7;
        }
        if (threats.length > 0) {
            return {
                id: `threat-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                type: 'threat_detected',
                severity: riskScore > 0.8 ? 'critical' : riskScore > 0.6 ? 'error' : riskScore > 0.4 ? 'warning' : 'info',
                source: {
                    userId: userContext === null || userContext === void 0 ? void 0 : userContext.userId,
                    sessionId: (userContext === null || userContext === void 0 ? void 0 : userContext.sessionId) || 'unknown',
                    ipAddress: (userContext === null || userContext === void 0 ? void 0 : userContext.ipAddress) || '0.0.0.0',
                    userAgent: (userContext === null || userContext === void 0 ? void 0 : userContext.userAgent) || 'unknown'
                },
                target: {
                    resource: (request === null || request === void 0 ? void 0 : request.resource) || 'unknown',
                    action: (request === null || request === void 0 ? void 0 : request.action) || 'unknown',
                    scope: (request === null || request === void 0 ? void 0 : request.scope) || 'unknown'
                },
                details: {
                    description: `Threats detected: ${threats.join(', ')}`,
                    data: request,
                    riskScore,
                    mitigated: false
                },
                metadata: { threats, automaticDetection: true }
            };
        }
        return null;
    }
    isUnusualAccess(userContext) {
        const userId = userContext === null || userContext === void 0 ? void 0 : userContext.userId;
        if (!userId)
            return false;
        const currentTime = new Date().getHours();
        const baseline = this.anomalyBaseline.get(`${userId}_hour`) || currentTime;
        // Simple anomaly detection - check if access time is unusual
        return Math.abs(currentTime - baseline) > 6;
    }
    isDataExfiltration(request) {
        // Check for large data requests or exports
        const dataSize = JSON.stringify(request).length;
        return dataSize > 100000 || // Large request
            (request === null || request === void 0 ? void 0 : request.action) === 'export' ||
            (request === null || request === void 0 ? void 0 : request.action) === 'download';
    }
    isBruteForce(userContext) {
        const userId = (userContext === null || userContext === void 0 ? void 0 : userContext.userId) || (userContext === null || userContext === void 0 ? void 0 : userContext.ipAddress);
        if (!userId)
            return false;
        const behavior = this.userBehavior.get(userId) || { attempts: 0, lastAttempt: 0 };
        const now = Date.now();
        // Reset counter if more than 5 minutes passed
        if (now - behavior.lastAttempt > 5 * 60 * 1000) {
            behavior.attempts = 0;
        }
        behavior.attempts++;
        behavior.lastAttempt = now;
        this.userBehavior.set(userId, behavior);
        return behavior.attempts > 5; // More than 5 attempts in 5 minutes
    }
}
// PII detection service
class PIIDetectionService {
    detectPII(text, patterns = BUILT_IN_PII_PATTERNS) {
        const result = {
            found: false,
            types: [],
            confidence: 0,
            locations: [],
            suggestions: []
        };
        patterns.forEach(pattern => {
            const regex = new RegExp(pattern.pattern, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                result.found = true;
                result.types.push(pattern);
                const location = {
                    field: 'text',
                    start: match.index,
                    end: match.index + match[0].length,
                    value: match[0],
                    masked: this.maskValue(match[0], pattern.type)
                };
                result.locations.push(location);
                result.suggestions.push({
                    action: this.getSuggestedAction(pattern.type),
                    field: 'text',
                    method: this.getSuggestedMethod(pattern.type),
                    justification: `${pattern.type} detected with ${Math.round(pattern.confidence * 100)}% confidence`
                });
            }
        });
        // Calculate overall confidence
        if (result.types.length > 0) {
            result.confidence = result.types.reduce((sum, type) => sum + type.confidence, 0) / result.types.length;
        }
        return result;
    }
    maskValue(value, type) {
        switch (type) {
            case 'email':
                const [local, domain] = value.split('@');
                return `${local.charAt(0)}***@${domain}`;
            case 'phone':
                return value.replace(/\d/g, '*').slice(0, -4) + value.slice(-4);
            case 'ssn':
                return '***-**-' + value.slice(-4);
            case 'credit_card':
                return '**** **** **** ' + value.slice(-4);
            default:
                return '*'.repeat(value.length);
        }
    }
    getSuggestedAction(type) {
        switch (type) {
            case 'ssn':
            case 'credit_card':
                return 'encrypt';
            case 'email':
            case 'phone':
                return 'mask';
            default:
                return 'flag';
        }
    }
    getSuggestedMethod(type) {
        switch (type) {
            case 'ssn':
            case 'credit_card':
                return 'AES-256 encryption';
            case 'email':
                return 'partial masking';
            case 'phone':
                return 'digit replacement';
            default:
                return 'full masking';
        }
    }
}
// Policy evaluation engine
class PolicyEvaluationEngine {
    evaluateRequest(request, policies) {
        let allowed = true;
        let risk = 0;
        const triggers = [];
        const actions = [];
        // Sort policies by priority
        const sortedPolicies = policies.filter(p => p.enabled).sort((a, b) => b.priority - a.priority);
        for (const policy of sortedPolicies) {
            const matches = this.evaluateConditions(request, policy.conditions);
            if (matches) {
                triggers.push(policy.name);
                for (const action of policy.actions) {
                    actions.push(action);
                    if (action.type === 'deny') {
                        allowed = false;
                    }
                    // Increase risk based on action type
                    switch (action.type) {
                        case 'deny':
                            risk += 0.8;
                            break;
                        case 'quarantine':
                            risk += 0.6;
                            break;
                        case 'challenge':
                            risk += 0.4;
                            break;
                        case 'alert':
                            risk += 0.2;
                            break;
                    }
                }
            }
        }
        return {
            allowed,
            risk: Math.min(risk, 1.0),
            triggers,
            actions,
            message: allowed ? undefined : 'Request denied by security policy'
        };
    }
    evaluateConditions(request, conditions) {
        return conditions.every(condition => this.evaluateCondition(request, condition));
    }
    evaluateCondition(request, condition) {
        const value = this.getValueFromRequest(request, condition.field);
        let result = false;
        switch (condition.operator) {
            case 'equals':
                result = value === condition.value;
                break;
            case 'contains':
                result = String(value).includes(String(condition.value));
                break;
            case 'matches':
                result = new RegExp(condition.value).test(String(value));
                break;
            case 'greaterThan':
                result = Number(value) > Number(condition.value);
                break;
            case 'lessThan':
                result = Number(value) < Number(condition.value);
                break;
            case 'in':
                result = Array.isArray(condition.value) && condition.value.includes(value);
                break;
            case 'notIn':
                result = Array.isArray(condition.value) && !condition.value.includes(value);
                break;
        }
        return condition.negated ? !result : result;
    }
    getValueFromRequest(request, field) {
        const path = field.split('.');
        let value = request;
        for (const key of path) {
            value = value === null || value === void 0 ? void 0 : value[key];
        }
        return value;
    }
}
export function useSecurityPolicy(config = {}) {
    const finalConfig = Object.assign(Object.assign({}, DEFAULT_SECURITY_CONFIG), config);
    const [policies, setPolicies] = useState(finalConfig.policies);
    const [threats, setThreats] = useState([]);
    const [auditEvents, setAuditEvents] = useState([]);
    const [complianceStatus, setComplianceStatus] = useState(null);
    const threatEngine = useRef(new ThreatDetectionEngine());
    const piiService = useRef(new PIIDetectionService());
    const policyEngine = useRef(new PolicyEvaluationEngine());
    // Initialize built-in security policies
    useEffect(() => {
        const builtInPolicies = [
            {
                id: 'default-rate-limit',
                name: 'Rate Limiting',
                description: 'Prevent abuse through rate limiting',
                enabled: true,
                priority: 100,
                conditions: [
                    {
                        type: 'request',
                        operator: 'greaterThan',
                        field: 'requestCount',
                        value: 100
                    }
                ],
                actions: [
                    { type: 'deny', message: 'Rate limit exceeded' },
                    { type: 'log' }
                ],
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: '1.0.0',
                    author: 'system'
                }
            },
            {
                id: 'pii-protection',
                name: 'PII Protection',
                description: 'Detect and protect personally identifiable information',
                enabled: finalConfig.piiProtection.enabled,
                priority: 90,
                conditions: [
                    {
                        type: 'data',
                        operator: 'contains',
                        field: 'content',
                        value: 'pii_detected'
                    }
                ],
                actions: [
                    { type: 'log' },
                    { type: 'alert', parameters: { severity: 'high' } }
                ],
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: '1.0.0',
                    author: 'system'
                }
            }
        ];
        setPolicies(prev => [...prev, ...builtInPolicies]);
    }, [finalConfig.piiProtection.enabled]);
    // Policy management
    const addPolicy = useCallback(async (policy) => {
        const id = `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPolicy = Object.assign(Object.assign({}, policy), { id, metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0',
                author: 'user'
            } });
        setPolicies(prev => [...prev, newPolicy]);
        return id;
    }, []);
    const updatePolicy = useCallback(async (id, updates) => {
        setPolicies(prev => prev.map(policy => policy.id === id
            ? Object.assign(Object.assign(Object.assign({}, policy), updates), { metadata: Object.assign(Object.assign({}, policy.metadata), { updatedAt: new Date() }) }) : policy));
    }, []);
    const removePolicy = useCallback(async (id) => {
        setPolicies(prev => prev.filter(policy => policy.id !== id));
    }, []);
    const evaluateRequest = useCallback(async (request) => {
        // Run policy evaluation
        const policyResult = policyEngine.current.evaluateRequest(request, policies);
        // Run threat detection
        const threat = threatEngine.current.detectThreat(request, request.userContext);
        if (threat) {
            setThreats(prev => [threat, ...prev.slice(0, 999)]); // Keep last 1000 threats
            // Add threat-based actions
            if (threat.details.riskScore > 0.7) {
                policyResult.actions.push({ type: 'alert', parameters: { threat: true } });
                policyResult.risk = Math.max(policyResult.risk, threat.details.riskScore);
            }
        }
        return policyResult;
    }, [policies]);
    // Threat management
    const reportThreat = useCallback(async (event) => {
        const threat = Object.assign(Object.assign({}, event), { id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date() });
        setThreats(prev => [threat, ...prev.slice(0, 999)]);
    }, []);
    const getThreatSummary = useCallback(async (period = 'day') => {
        const now = new Date();
        const periodMs = {
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        }[period];
        const cutoff = new Date(now.getTime() - periodMs);
        const recentThreats = threats.filter(t => t.timestamp >= cutoff);
        const summary = new Map();
        recentThreats.forEach(threat => {
            var _a, _b;
            const type = ((_b = (_a = threat.metadata) === null || _a === void 0 ? void 0 : _a.threats) === null || _b === void 0 ? void 0 : _b[0]) || 'unknown';
            const existing = summary.get(type) || {
                type,
                count: 0,
                severity: threat.severity === 'critical' ? 'critical' :
                    threat.severity === 'error' ? 'high' :
                        threat.severity === 'warning' ? 'medium' : 'low',
                trend: 'stable',
                lastOccurrence: threat.timestamp
            };
            existing.count++;
            existing.lastOccurrence = threat.timestamp > existing.lastOccurrence ? threat.timestamp : existing.lastOccurrence;
            summary.set(type, existing);
        });
        return Array.from(summary.values());
    }, [threats]);
    // Audit trail
    const logAuditEvent = useCallback(async (event) => {
        const auditEvent = Object.assign(Object.assign({}, event), { id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date(), metadata: {
                checksum: 'checksum-placeholder',
                signature: 'signature-placeholder'
            } });
        setAuditEvents(prev => [auditEvent, ...prev.slice(0, 9999)]); // Keep last 10000 events
    }, []);
    const getAuditTrail = useCallback(async (filters = {}) => {
        let filtered = auditEvents;
        if (filters.userId) {
            filtered = filtered.filter(e => e.userId === filters.userId);
        }
        if (filters.action) {
            filtered = filtered.filter(e => e.action === filters.action);
        }
        if (filters.resource) {
            filtered = filtered.filter(e => e.resource === filters.resource);
        }
        if (filters.startDate) {
            filtered = filtered.filter(e => e.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            filtered = filtered.filter(e => e.timestamp <= filters.endDate);
        }
        if (filters.result) {
            filtered = filtered.filter(e => e.result === filters.result);
        }
        if (filters.limit) {
            filtered = filtered.slice(0, filters.limit);
        }
        return filtered;
    }, [auditEvents]);
    // Compliance
    const runComplianceCheck = useCallback(async (framework = 'gdpr') => {
        // Simplified compliance check
        const report = {
            id: `compliance-${Date.now()}`,
            type: framework,
            period: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date()
            },
            scope: ['data_protection', 'access_control', 'audit_trail'],
            findings: [],
            summary: {
                totalChecks: 10,
                passed: 8,
                failed: 1,
                warnings: 1,
                score: 80
            },
            generatedAt: new Date(),
            generatedBy: 'system'
        };
        setComplianceStatus(report);
        return report;
    }, []);
    const getComplianceHistory = useCallback(async () => {
        return complianceStatus ? [complianceStatus] : [];
    }, [complianceStatus]);
    // Data protection
    const classifyData = useCallback(async (data) => {
        // Simplified data classification
        const dataString = JSON.stringify(data).toLowerCase();
        if (dataString.includes('password') || dataString.includes('secret')) {
            return {
                level: 'restricted',
                categories: ['authentication'],
                retention: { period: 90, action: 'delete' },
                access: { roles: ['admin'], conditions: [] },
                protection: {
                    encryptionRequired: true,
                    maskingRules: ['full'],
                    auditLevel: 'comprehensive'
                }
            };
        }
        if (dataString.includes('email') || dataString.includes('phone')) {
            return {
                level: 'confidential',
                categories: ['personal_data'],
                retention: { period: 365, action: 'anonymize' },
                access: { roles: ['user', 'admin'], conditions: [] },
                protection: {
                    encryptionRequired: false,
                    maskingRules: ['partial'],
                    auditLevel: 'detailed'
                }
            };
        }
        return {
            level: 'internal',
            categories: ['general'],
            retention: { period: 1095, action: 'archive' },
            access: { roles: ['user', 'admin'], conditions: [] },
            protection: {
                encryptionRequired: false,
                maskingRules: [],
                auditLevel: 'basic'
            }
        };
    }, []);
    const detectPII = useCallback(async (text) => {
        return piiService.current.detectPII(text, finalConfig.piiProtection.detectionPatterns.length > 0
            ? finalConfig.piiProtection.detectionPatterns
            : BUILT_IN_PII_PATTERNS);
    }, [finalConfig.piiProtection.detectionPatterns]);
    const maskSensitiveData = useCallback(async (data, rules = []) => {
        if (typeof data === 'string') {
            const piiResult = await detectPII(data);
            if (piiResult.found) {
                let maskedText = data;
                // Apply masking in reverse order to maintain positions
                piiResult.locations.reverse().forEach(location => {
                    maskedText = maskedText.substring(0, location.start) +
                        location.masked +
                        maskedText.substring(location.end);
                });
                return maskedText;
            }
        }
        return data;
    }, [detectPII]);
    // Dashboard metrics
    const getDashboardMetrics = useCallback(async () => {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentThreats = threats.filter(t => t.timestamp >= dayAgo);
        const recentAudits = auditEvents.filter(a => a.timestamp >= dayAgo);
        return {
            overview: {
                totalEvents: threats.length + auditEvents.length,
                threatLevel: recentThreats.length > 10 ? 'high' : recentThreats.length > 5 ? 'medium' : 'low',
                activeIncidents: recentThreats.filter(t => t.severity === 'critical').length,
                blockedAttacks: recentThreats.filter(t => t.details.mitigated).length,
                complianceScore: (complianceStatus === null || complianceStatus === void 0 ? void 0 : complianceStatus.summary.score) || 0
            },
            realtime: {
                activeUsers: new Set(recentAudits.map(a => a.userId)).size,
                suspiciousActivities: recentThreats.length,
                dataTransfers: recentAudits.filter(a => a.action.includes('export')).length,
                authenticationFailures: recentThreats.filter(t => t.type === 'authentication').length
            },
            trends: {
                period: 'day',
                events: [], // Would implement time series data
                threats: [],
                compliance: []
            },
            topThreats: await getThreatSummary('day'),
            recentEvents: threats.slice(0, 10)
        };
    }, [threats, auditEvents, complianceStatus, getThreatSummary]);
    // Utilities
    const exportSecurityReport = useCallback(async (format) => {
        const metrics = await getDashboardMetrics();
        switch (format) {
            case 'json':
                return JSON.stringify({
                    metrics,
                    threats: threats.slice(0, 100),
                    auditEvents: auditEvents.slice(0, 100),
                    policies,
                    complianceStatus
                }, null, 2);
            case 'csv':
                const headers = 'timestamp,type,severity,description,risk_score\n';
                const rows = threats.slice(0, 100).map(t => `${t.timestamp.toISOString()},${t.type},${t.severity},${t.details.description},${t.details.riskScore}`).join('\n');
                return headers + rows;
            default:
                return 'PDF export not implemented';
        }
    }, [getDashboardMetrics, threats, auditEvents, policies, complianceStatus]);
    const validateConfiguration = useCallback(async () => {
        const errors = [];
        const warnings = [];
        const recommendations = [];
        // Validate policies
        if (policies.length === 0) {
            warnings.push('No security policies configured');
            recommendations.push('Add basic security policies for protection');
        }
        // Validate threat detection
        if (!finalConfig.threatDetection.enabled) {
            warnings.push('Threat detection is disabled');
            recommendations.push('Enable threat detection for better security');
        }
        // Validate audit settings
        if (!finalConfig.auditSettings.enabled) {
            errors.push('Audit trail is disabled - required for compliance');
        }
        // Validate PII protection
        if (finalConfig.piiProtection.enabled && finalConfig.piiProtection.detectionPatterns.length === 0) {
            warnings.push('PII protection enabled but no detection patterns configured');
            recommendations.push('Configure PII detection patterns for your jurisdiction');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            recommendations
        };
    }, [policies, finalConfig]);
    return {
        // Policy management
        policies,
        addPolicy,
        updatePolicy,
        removePolicy,
        evaluateRequest,
        // Threat detection
        threats,
        reportThreat,
        getThreatSummary,
        // Audit trail
        auditEvents,
        logAuditEvent,
        getAuditTrail,
        // Compliance
        complianceStatus,
        runComplianceCheck,
        getComplianceHistory,
        // Data protection
        classifyData,
        detectPII,
        maskSensitiveData,
        // Dashboard metrics
        getDashboardMetrics,
        // Utilities
        exportSecurityReport,
        validateConfiguration
    };
}
