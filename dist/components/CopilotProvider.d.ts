import React, { ReactNode } from 'react';
import { CopilotConfigType, CopilotContextValue, RuntimeTool } from '../types';
interface CopilotProviderProps {
    config: CopilotConfigType;
    children: ReactNode;
    tools?: RuntimeTool[];
    context?: string | (() => Promise<string> | string);
    toolContext?: {
        businessId?: string;
        userId?: string;
        sessionId?: string;
    } | (() => Promise<{
        businessId?: string;
        userId?: string;
        sessionId?: string;
    } | undefined> | {
        businessId?: string;
        userId?: string;
        sessionId?: string;
    });
}
export declare function CopilotProvider({ config, children, tools, context, toolContext }: CopilotProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCopilotContext(): CopilotContextValue;
export declare function withCopilot<P extends object>(WrappedComponent: React.ComponentType<P>, config: CopilotConfigType): (props: P) => import("react/jsx-runtime").JSX.Element;
export default CopilotProvider;
