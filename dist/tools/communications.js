const id = (s) => s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64);
export function createCommunicationTools(adapter) {
    const schema = { type: 'object', properties: { channel: { type: 'string', enum: ['email', 'sms', 'slack', 'webhook', 'push', 'inapp'] }, to: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] }, subject: { type: 'string' }, message: { type: 'string' }, metadata: { type: 'object' } }, required: ['channel', 'to', 'message'], additionalProperties: true };
    const name = id('notify_send');
    const tools = [{ id: name, name, description: 'Send a notification', inputSchema: schema, route: '__local__', transport: 'http' }];
    const runners = { [name]: adapter.send };
    return { tools, runners };
}
