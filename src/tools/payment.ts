import type { RuntimeTool } from '../types'

const id = (s: string) => s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)

export interface PaymentAdapter {
  createCheckout?: (p: { planId?: string; amount?: number; currency?: string; metadata?: any }) => Promise<{ url: string }>
  charge?: (p: { amount: number; currency: string; customerId?: string; sourceId?: string; metadata?: any }) => Promise<{ id: string; status: string }>
  refund?: (p: { chargeId: string; amount?: number; reason?: string }) => Promise<{ id: string; status: string }>
  getStatus?: (paymentId: string) => Promise<string>
}

export function createPaymentTools(adapter: PaymentAdapter): {
  tools: RuntimeTool[]
  runners: Record<string, (args: any) => Promise<any>>
} {
  const tools: RuntimeTool[] = []
  const runners: Record<string, (args: any) => Promise<any>> = {}

  if (adapter.createCheckout) {
    const name = id('payment_create_checkout')
    tools.push({ id: name, name, description: 'Create a checkout session', inputSchema: { type: 'object', properties: { planId: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, metadata: { type: 'object' } }, additionalProperties: true }, route: '__local__', transport: 'http' })
    runners[name] = adapter.createCheckout
  }
  if (adapter.charge) {
    const name = id('payment_charge')
    tools.push({ id: name, name, description: 'Charge a customer', inputSchema: { type: 'object', properties: { amount: { type: 'number' }, currency: { type: 'string' }, customerId: { type: 'string' }, sourceId: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount','currency'], additionalProperties: true }, route: '__local__', transport: 'http' })
    runners[name] = adapter.charge
  }
  if (adapter.refund) {
    const name = id('payment_refund')
    tools.push({ id: name, name, description: 'Refund a charge', inputSchema: { type: 'object', properties: { chargeId: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string' } }, required: ['chargeId'], additionalProperties: true }, route: '__local__', transport: 'http' })
    runners[name] = adapter.refund
  }
  if (adapter.getStatus) {
    const name = id('payment_status')
    tools.push({ id: name, name, description: 'Get payment status', inputSchema: { type: 'object', properties: { paymentId: { type: 'string' } }, required: ['paymentId'] }, route: '__local__', transport: 'http' })
    runners[name] = async ({ paymentId }: any) => adapter.getStatus!(paymentId)
  }

  return { tools, runners }
}


