// Performance monitoring and analytics types

export interface PerformanceMetrics {
  id: string
  timestamp: Date
  category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'user_experience'
  metrics: {
    // Response time metrics
    responseTime?: {
      average: number
      median: number
      p95: number
      p99: number
      min: number
      max: number
    }
    
    // Throughput metrics
    throughput?: {
      requestsPerSecond: number
      requestsPerMinute: number
      requestsPerHour: number
      totalRequests: number
    }
    
    // Error rate metrics
    errorRate?: {
      percentage: number
      totalErrors: number
      errorsByType: Record<string, number>
      criticalErrors: number
    }
    
    // Resource usage metrics
    resourceUsage?: {
      cpuUsage: number // percentage
      memoryUsage: number // MB
      networkUsage: number // KB/s
      storageUsage: number // MB
    }
    
    // User experience metrics
    userExperience?: {
      loadTime: number
      interactionDelay: number
      satisfactionScore: number // 0-100
      bounceRate: number // percentage
    }
  }
  metadata: {
    source: string
    environment: 'development' | 'staging' | 'production'
    version: string
    region?: string
  }
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  metric: string
  condition: 'above' | 'below' | 'equals' | 'change'
  threshold: number
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  actions: AlertAction[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    lastTriggered?: Date
    triggerCount: number
  }
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'sms' | 'log' | 'auto_scale' | 'circuit_breaker'
  target: string
  parameters?: Record<string, any>
  enabled: boolean
}

export interface PerformanceAlert {
  id: string
  ruleId: string
  ruleName: string
  timestamp: Date
  metric: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'triggered' | 'acknowledged' | 'resolved' | 'suppressed'
  description: string
  recommendations?: string[]
  metadata: {
    duration: number
    acknowledgedBy?: string
    acknowledgedAt?: Date
    resolvedAt?: Date
    autoResolved: boolean
  }
}

export interface PerformanceDashboard {
  id: string
  name: string
  description: string
  layout: DashboardWidget[]
  filters: DashboardFilter[]
  refreshInterval: number // seconds
  timeRange: TimeRange
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    isPublic: boolean
    tags: string[]
  }
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'alert_list' | 'heatmap' | 'gauge'
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: {
    metric: string
    aggregation: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'p95' | 'p99'
    groupBy?: string[]
    filters?: Record<string, any>
    visualization?: {
      chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
      showLegend: boolean
      showTooltips: boolean
      colors?: string[]
    }
  }
}

export interface DashboardFilter {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
  value: any
  label: string
}

export interface TimeRange {
  start: Date | 'now-1h' | 'now-24h' | 'now-7d' | 'now-30d'
  end: Date | 'now'
  timezone?: string
}

export interface OptimizationRecommendation {
  id: string
  category: 'performance' | 'cost' | 'reliability' | 'security' | 'scalability'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: {
    performanceGain?: number // percentage
    costSavings?: number // dollars
    reliabilityImprovement?: number // percentage
    riskReduction?: number // percentage
  }
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: number // hours
    requiredSkills: string[]
    steps: string[]
    codeChanges?: string[]
  }
  evidence: {
    dataPoints: string[]
    trends: string[]
    benchmarks?: string[]
  }
  metadata: {
    createdAt: Date
    status: 'new' | 'acknowledged' | 'implementing' | 'completed' | 'dismissed'
    acknowledgedBy?: string
    completedAt?: Date
  }
}

export interface AnalyticsQuery {
  metric: string
  aggregation: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'p50' | 'p95' | 'p99'
  timeRange: TimeRange
  groupBy?: string[]
  filters?: Record<string, any>
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit?: number
}

export interface AnalyticsResult {
  query: AnalyticsQuery
  data: TimeSeriesPoint[]
  summary: {
    total: number
    average: number
    min: number
    max: number
    trend: 'increasing' | 'decreasing' | 'stable'
    changePercentage: number
  }
  metadata: {
    executionTime: number
    dataPoints: number
    cacheHit: boolean
  }
}

export interface TimeSeriesPoint {
  timestamp: Date
  value: number
  groupBy?: Record<string, string>
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  period: {
    start: Date
    end: Date
  }
  sections: ReportSection[]
  summary: {
    overallScore: number // 0-100
    keyFindings: string[]
    recommendations: string[]
    trends: string[]
  }
  metadata: {
    generatedAt: Date
    generatedBy: string
    recipients: string[]
    format: 'pdf' | 'html' | 'json'
  }
}

export interface ReportSection {
  title: string
  description: string
  widgets: DashboardWidget[]
  insights: string[]
  recommendations?: string[]
}

export interface UserJourney {
  id: string
  userId: string
  sessionId: string
  startTime: Date
  endTime?: Date
  steps: JourneyStep[]
  metrics: {
    totalDuration: number
    stepCount: number
    completionRate: number
    dropOffPoints: string[]
    satisfactionScore?: number
  }
  metadata: {
    device: string
    browser: string
    location?: string
    referrer?: string
  }
}

export interface JourneyStep {
  id: string
  action: string
  timestamp: Date
  duration: number
  success: boolean
  errorMessage?: string
  metadata: {
    component?: string
    data?: any
    context?: Record<string, any>
  }
}

export interface PerformanceConfiguration {
  collection: {
    enabled: boolean
    sampleRate: number // 0-1
    batchSize: number
    flushInterval: number // seconds
    excludePatterns: string[]
  }
  
  storage: {
    retention: number // days
    compression: boolean
    aggregation: {
      enabled: boolean
      intervals: ('minute' | 'hour' | 'day')[]
    }
  }
  
  alerting: {
    enabled: boolean
    rules: AlertRule[]
    defaultActions: AlertAction[]
    suppressionRules: {
      metric: string
      duration: number // seconds
    }[]
  }
  
  analytics: {
    enabled: boolean
    realTimeEnabled: boolean
    customMetrics: CustomMetric[]
    userJourneyTracking: boolean
  }
  
  optimization: {
    enabled: boolean
    analysisInterval: number // hours
    minDataPoints: number
    confidenceThreshold: number // 0-1
  }
}

export interface CustomMetric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
  description: string
  unit: string
  tags: string[]
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max'
}

export interface PerformanceHookResult {
  // Metrics collection
  recordMetric: (category: string, value: number, metadata?: any) => void
  recordUserJourney: (step: Omit<JourneyStep, 'id' | 'timestamp'>) => void
  
  // Real-time monitoring
  currentMetrics: PerformanceMetrics[]
  alerts: PerformanceAlert[]
  isHealthy: boolean
  overallScore: number
  
  // Analytics
  query: (query: AnalyticsQuery) => Promise<AnalyticsResult>
  getDashboard: (id: string) => Promise<PerformanceDashboard | null>
  createDashboard: (dashboard: Omit<PerformanceDashboard, 'id' | 'metadata'>) => Promise<string>
  
  // Alerts
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'metadata'>) => Promise<string>
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  
  // Optimization
  recommendations: OptimizationRecommendation[]
  getRecommendations: (category?: string) => Promise<OptimizationRecommendation[]>
  applyRecommendation: (id: string) => Promise<void>
  dismissRecommendation: (id: string) => Promise<void>
  
  // Reporting
  generateReport: (type: 'daily' | 'weekly' | 'monthly', options?: any) => Promise<PerformanceReport>
  exportData: (query: AnalyticsQuery, format: 'csv' | 'json' | 'excel') => Promise<string>
  
  // User journeys
  userJourneys: UserJourney[]
  getCurrentJourney: () => UserJourney | null
  startJourney: (userId: string) => string
  endJourney: (journeyId: string) => void
  
  // Configuration
  updateConfiguration: (config: Partial<PerformanceConfiguration>) => Promise<void>
  getConfiguration: () => PerformanceConfiguration
  validateConfiguration: () => Promise<ValidationResult>
  
  // Real-time data
  subscribe: (event: PerformanceEvent, callback: (data: any) => void) => () => void
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export type PerformanceEvent = 
  | 'metric_recorded'
  | 'alert_triggered'
  | 'alert_resolved'
  | 'threshold_exceeded'
  | 'anomaly_detected'
  | 'optimization_recommended'
  | 'journey_started'
  | 'journey_completed' 