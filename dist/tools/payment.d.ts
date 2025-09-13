import type { RuntimeTool } from '../types';
export interface PaymentAdapter {
    createCheckout?: (p: {
        planId?: string;
        amount?: number;
        currency?: string;
        metadata?: any;
    }) => Promise<{
        url: string;
    }>;
    charge?: (p: {
        amount: number;
        currency: string;
        customerId?: string;
        sourceId?: string;
        metadata?: any;
    }) => Promise<{
        id: string;
        status: string;
    }>;
    refund?: (p: {
        chargeId: string;
        amount?: number;
        reason?: string;
    }) => Promise<{
        id: string;
        status: string;
    }>;
    getStatus?: (paymentId: string) => Promise<string>;
}
export declare function createPaymentTools(adapter: PaymentAdapter): {
    tools: RuntimeTool[];
    runners: Record<string, (args: any) => Promise<any>>;
};
