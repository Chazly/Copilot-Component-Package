import { AICopilotConfig } from '../types';
interface OnboardingFlowProps {
    config: AICopilotConfig;
    onComplete: (collectedData: Record<string, any>) => void;
    onSkip?: () => void;
    className?: string;
}
export declare function OnboardingFlow({ config, onComplete, onSkip, className }: OnboardingFlowProps): import("react/jsx-runtime").JSX.Element | null;
export {};
