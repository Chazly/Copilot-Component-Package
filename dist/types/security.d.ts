export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    conditions: SecurityCondition[];
    actions: SecurityAction[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        version: string;
        author: string;
    };
}
export interface SecurityCondition {
    type: 'user' | 'request' | 'data' | 'time' | 'location' | 'device' | 'behavior';
    operator: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
    field: string;
    value: any;
    negated?: boolean;
}
export interface SecurityAction {
    type: 'allow' | 'deny' | 'log' | 'alert' | 'quarantine' | 'challenge' | 'redirect';
    parameters?: Record<string, any>;
    message?: string;
}
export interface ThreatDetectionConfig {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
    rules: ThreatRule[];
    anomalyDetection: {
        enabled: boolean;
        learningPeriod: number;
        threshold: number;
        models: ('usage_pattern' | 'content_analysis' | 'temporal_analysis' | 'behavioral_analysis')[];
    };
    responseActions: {
        onSuspiciousActivity: SecurityAction[];
        onDataExfiltration: SecurityAction[];
        onBruteForce: SecurityAction[];
        onAnomalousAccess: SecurityAction[];
    };
}
export interface ThreatRule {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'injection' | 'data_loss' | 'unauthorized_access' | 'abuse' | 'anomaly';
    pattern: string | RegExp;
    conditions: SecurityCondition[];
    enabled: boolean;
}
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    type: 'authentication' | 'authorization' | 'data_access' | 'threat_detected' | 'policy_violation' | 'admin_action';
    severity: 'info' | 'warning' | 'error' | 'critical';
    source: {
        userId?: string;
        sessionId: string;
        ipAddress: string;
        userAgent: string;
        location?: GeoLocation;
    };
    target: {
        resource: string;
        action: string;
        scope: string;
    };
    details: {
        description: string;
        data?: any;
        riskScore: number;
        mitigated: boolean;
        falsePositive?: boolean;
    };
    metadata: Record<string, any>;
}
export interface AuditTrail {
    id: string;
    timestamp: Date;
    userId: string;
    sessionId: string;
    action: string;
    resource: string;
    parameters?: Record<string, any>;
    result: 'success' | 'failure' | 'partial';
    ipAddress: string;
    userAgent: string;
    duration: number;
    metadata: {
        checksum: string;
        signature: string;
        previousHash?: string;
    };
}
export interface ComplianceReport {
    id: string;
    type: 'gdpr' | 'hipaa' | 'sox' | 'pci' | 'iso27001' | 'custom';
    period: {
        start: Date;
        end: Date;
    };
    scope: string[];
    findings: ComplianceFinding[];
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        warnings: number;
        score: number;
    };
    generatedAt: Date;
    generatedBy: string;
}
export interface ComplianceFinding {
    checkId: string;
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pass' | 'fail' | 'warning' | 'manual_review';
    evidence: string[];
    recommendation?: string;
    remediation?: {
        automatic: boolean;
        steps: string[];
        estimatedTime: number;
    };
}
export interface DataClassification {
    level: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
    categories: string[];
    retention: {
        period: number;
        action: 'delete' | 'archive' | 'anonymize';
    };
    access: {
        roles: string[];
        conditions: SecurityCondition[];
    };
    protection: {
        encryptionRequired: boolean;
        maskingRules: string[];
        auditLevel: 'none' | 'basic' | 'detailed' | 'comprehensive';
    };
}
export interface PIIDetectionResult {
    found: boolean;
    types: PIIType[];
    confidence: number;
    locations: PIILocation[];
    suggestions: PIIHandlingSuggestion[];
}
export interface PIIType {
    type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'passport' | 'license' | 'address' | 'name' | 'custom';
    pattern: string;
    confidence: number;
    jurisdiction?: string[];
}
export interface PIILocation {
    field: string;
    start: number;
    end: number;
    value: string;
    masked: string;
}
export interface PIIHandlingSuggestion {
    action: 'mask' | 'encrypt' | 'hash' | 'remove' | 'flag';
    field: string;
    method: string;
    justification: string;
}
export interface SecurityDashboardMetrics {
    overview: {
        totalEvents: number;
        threatLevel: 'low' | 'medium' | 'high' | 'critical';
        activeIncidents: number;
        blockedAttacks: number;
        complianceScore: number;
    };
    realtime: {
        activeUsers: number;
        suspiciousActivities: number;
        dataTransfers: number;
        authenticationFailures: number;
    };
    trends: {
        period: 'hour' | 'day' | 'week' | 'month';
        events: TimeSeriesData[];
        threats: TimeSeriesData[];
        compliance: TimeSeriesData[];
    };
    topThreats: ThreatSummary[];
    recentEvents: SecurityEvent[];
}
export interface TimeSeriesData {
    timestamp: Date;
    value: number;
    category?: string;
}
export interface ThreatSummary {
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    trend: 'increasing' | 'stable' | 'decreasing';
    lastOccurrence: Date;
}
export interface GeoLocation {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    accuracy: number;
}
export interface SecurityConfiguration {
    policies: SecurityPolicy[];
    threatDetection: ThreatDetectionConfig;
    auditSettings: {
        enabled: boolean;
        retention: number;
        encryption: boolean;
        compression: boolean;
        realTimeAlerts: boolean;
    };
    compliance: {
        framework: ('gdpr' | 'hipaa' | 'sox' | 'pci' | 'iso27001')[];
        autoRemediation: boolean;
        reportingSchedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        contactEmail: string;
    };
    dataClassification: {
        enabled: boolean;
        rules: DataClassificationRule[];
        defaultLevel: DataClassification['level'];
    };
    piiProtection: {
        enabled: boolean;
        autoDetection: boolean;
        autoMasking: boolean;
        detectionPatterns: PIIType[];
    };
}
export interface DataClassificationRule {
    pattern: string | RegExp;
    classification: DataClassification;
    priority: number;
}
export interface SecurityHookResult {
    policies: SecurityPolicy[];
    addPolicy: (policy: Omit<SecurityPolicy, 'id' | 'metadata'>) => Promise<string>;
    updatePolicy: (id: string, policy: Partial<SecurityPolicy>) => Promise<void>;
    removePolicy: (id: string) => Promise<void>;
    evaluateRequest: (request: any) => Promise<SecurityEvaluationResult>;
    threats: SecurityEvent[];
    reportThreat: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
    getThreatSummary: (period?: 'hour' | 'day' | 'week' | 'month') => Promise<ThreatSummary[]>;
    auditEvents: AuditTrail[];
    logAuditEvent: (event: Omit<AuditTrail, 'id' | 'timestamp' | 'metadata'>) => Promise<void>;
    getAuditTrail: (filters?: AuditFilters) => Promise<AuditTrail[]>;
    complianceStatus: ComplianceReport | null;
    runComplianceCheck: (framework?: string) => Promise<ComplianceReport>;
    getComplianceHistory: () => Promise<ComplianceReport[]>;
    classifyData: (data: any) => Promise<DataClassification>;
    detectPII: (text: string) => Promise<PIIDetectionResult>;
    maskSensitiveData: (data: any, rules?: string[]) => Promise<any>;
    getDashboardMetrics: () => Promise<SecurityDashboardMetrics>;
    exportSecurityReport: (format: 'pdf' | 'json' | 'csv') => Promise<string>;
    validateConfiguration: () => Promise<ValidationResult>;
}
export interface SecurityEvaluationResult {
    allowed: boolean;
    risk: number;
    triggers: string[];
    actions: SecurityAction[];
    message?: string;
}
export interface AuditFilters {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    result?: 'success' | 'failure' | 'partial';
    limit?: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
export interface PerformanceMetrics {
    responseTime: {
        current: number;
        average: number;
        p95: number;
        p99: number;
    };
    throughput: {
        requestsPerSecond: number;
        tokensPerSecond: number;
        errorsPerSecond: number;
    };
    latency: {
        network: number;
        processing: number;
        queue: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkUsage: number;
    };
    availability: {
        uptime: number;
        downtime: number;
        lastIncident: Date | null;
    };
}
export interface MemoryScopeStats {
    scopeId: string;
    scopeType: 'session' | 'user' | 'organization' | 'global';
    memoryUsage: {
        current: number;
        maximum: number;
        allocated: number;
        available: number;
    };
    entryCount: {
        total: number;
        active: number;
        cached: number;
        expired: number;
    };
    performance: {
        averageRetrievalTime: number;
        cacheHitRate: number;
        compressionRatio: number;
    };
    lastAccessed: Date;
    createdAt: Date;
}
export interface PerformanceAlert {
    id: string;
    type: 'latency' | 'throughput' | 'error_rate' | 'resource_usage' | 'availability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    threshold: number;
    currentValue: number;
    message: string;
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledged: boolean;
    tags: string[];
}
export interface OptimizationRecommendation {
    id: string;
    category: 'performance' | 'security' | 'cost' | 'reliability' | 'compliance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: {
        metric: string;
        estimatedImprovement: number;
        unit: string;
    };
    implementation: {
        effort: 'low' | 'medium' | 'high';
        complexity: 'simple' | 'moderate' | 'complex';
        estimatedTime: number;
        dependencies: string[];
    };
    recommendation: {
        action: string;
        steps: string[];
        resources: string[];
        risks: string[];
    };
    createdAt: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}
