const id = (s) => s.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64);
export function createPaymentTools(adapter) {
    const tools = [];
    const runners = {};
    if (adapter.createCheckout) {
        const name = id('payment_create_checkout');
        tools.push({ id: name, name, description: 'Create a checkout session', inputSchema: { type: 'object', properties: { planId: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, metadata: { type: 'object' } }, additionalProperties: true }, route: '__local__', transport: 'http' });
        runners[name] = adapter.createCheckout;
    }
    if (adapter.charge) {
        const name = id('payment_charge');
        tools.push({ id: name, name, description: 'Charge a customer', inputSchema: { type: 'object', properties: { amount: { type: 'number' }, currency: { type: 'string' }, customerId: { type: 'string' }, sourceId: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency'], additionalProperties: true }, route: '__local__', transport: 'http' });
        runners[name] = adapter.charge;
    }
    if (adapter.refund) {
        const name = id('payment_refund');
        tools.push({ id: name, name, description: 'Refund a charge', inputSchema: { type: 'object', properties: { chargeId: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string' } }, required: ['chargeId'], additionalProperties: true }, route: '__local__', transport: 'http' });
        runners[name] = adapter.refund;
    }
    if (adapter.getStatus) {
        const name = id('payment_status');
        tools.push({ id: name, name, description: 'Get payment status', inputSchema: { type: 'object', properties: { paymentId: { type: 'string' } }, required: ['paymentId'] }, route: '__local__', transport: 'http' });
        runners[name] = async ({ paymentId }) => adapter.getStatus(paymentId);
    }
    return { tools, runners };
}
