import React, { ReactNode } from 'react';
import { CopilotConfigType, CopilotContextValue } from '../types';
interface CopilotProviderProps {
    config: CopilotConfigType;
    children: ReactNode;
}
export declare function CopilotProvider({ config, children }: CopilotProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCopilotContext(): CopilotContextValue;
export declare function withCopilot<P extends object>(WrappedComponent: React.ComponentType<P>, config: CopilotConfigType): (props: P) => import("react/jsx-runtime").JSX.Element;
export default CopilotProvider;
