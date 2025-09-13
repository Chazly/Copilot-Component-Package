import type { RuntimeTool } from '../types';
export interface NotifyAdapter {
    send: (p: {
        channel: 'email' | 'sms' | 'slack' | 'webhook' | 'push' | 'inapp';
        to: string | string[];
        subject?: string;
        message: string;
        metadata?: any;
    }) => Promise<{
        id?: string;
        accepted?: boolean;
    }>;
}
export declare function createCommunicationTools(adapter: NotifyAdapter): {
    tools: RuntimeTool[];
    runners: Record<string, (args: any) => Promise<any>>;
};
