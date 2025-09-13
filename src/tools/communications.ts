import type { RuntimeTool } from '../types'

const id = (s: string) => s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64)

export interface NotifyAdapter {
  send: (p: { channel: 'email' | 'sms' | 'slack' | 'webhook' | 'push' | 'inapp'; to: string | string[]; subject?: string; message: string; metadata?: any }) => Promise<{ id?: string; accepted?: boolean }>
}

export function createCommunicationTools(adapter: NotifyAdapter): {
  tools: RuntimeTool[]
  runners: Record<string, (args: any) => Promise<any>>
} {
  const schema = { type: 'object', properties: { channel: { type: 'string', enum: ['email','sms','slack','webhook','push','inapp'] }, to: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] }, subject: { type: 'string' }, message: { type: 'string' }, metadata: { type: 'object' } }, required: ['channel','to','message'], additionalProperties: true }
  const name = id('notify_send')
  const tools: RuntimeTool[] = [{ id: name, name, description: 'Send a notification', inputSchema: schema, route: '__local__', transport: 'http' }]
  const runners: Record<string, (args: any) => Promise<any>> = { [name]: adapter.send }
  return { tools, runners }
}


