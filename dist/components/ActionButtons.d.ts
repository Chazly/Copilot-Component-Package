import { AICopilotConfig } from '../types';
interface ActionButtonsProps {
    config: AICopilotConfig;
    onActionTriggered?: (actionId: string, context?: any) => Promise<void> | void;
    context?: any;
    layout?: 'horizontal' | 'vertical' | 'grid';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
}
export declare function ActionButtons({ config, onActionTriggered, context, layout, size, className }: ActionButtonsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
