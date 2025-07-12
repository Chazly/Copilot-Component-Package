import React from 'react';
import { CopilotConfigType } from '../types';
export interface FloatingCopilotProps {
    config: CopilotConfigType;
    onSendMessage?: (message: string) => Promise<string> | string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size?: 'small' | 'medium' | 'large';
    triggerIcon?: 'bot' | 'message' | 'custom';
    customTriggerIcon?: React.ReactNode;
    closeOnClickOutside?: boolean;
    showBadge?: boolean;
    badgeText?: string;
    className?: string;
}
export declare function FloatingCopilot({ config, onSendMessage, position, size, triggerIcon, customTriggerIcon, closeOnClickOutside, showBadge, badgeText, className }: FloatingCopilotProps): import("react/jsx-runtime").JSX.Element;
export default FloatingCopilot;
