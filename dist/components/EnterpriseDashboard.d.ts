import React from 'react';
import { AICopilotConfig } from '../types';
interface EnterpriseDashboardProps {
    config: AICopilotConfig;
    className?: string;
    refreshInterval?: number;
    theme?: 'light' | 'dark';
}
declare const EnterpriseDashboard: React.FC<EnterpriseDashboardProps>;
export default EnterpriseDashboard;
