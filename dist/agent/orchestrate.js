import { emitEvent } from '../lib/observability';
import { sanitizeToolName } from '../lib/tools';
const sanitize = sanitizeToolName;
export function asTool(name, agent, schema = { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }) {
    const id = sanitize(name);
    const tool = {
        id,
        name: id,
        description: `${name} delegated agent`,
        inputSchema: schema,
        route: '__local__',
        transport: 'http'
    };
    const runner = async (args) => {
        const input = typeof (args === null || args === void 0 ? void 0 : args.input) === 'string' ? args.input : JSON.stringify(args);
        await agent.send(input);
        const assistantMessages = agent.getMessages().filter(m => m.sender === 'assistant');
        const last = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : undefined;
        return (last === null || last === void 0 ? void 0 : last.content) || '';
    };
    return { tool, runnerKey: id, runner };
}
export function createOrchestratorConfig(base, children, opts) {
    const accTools = [...(base.tools || [])];
    const runners = Object.assign({}, (base.toolRunners || {}));
    for (const c of children) {
        const { tool, runnerKey, runner } = asDelegatingTool(base, c.name, c.agent, opts, c.schema);
        accTools.push(tool);
        runners[runnerKey] = runner;
    }
    return Object.assign(Object.assign({}, base), { tools: accTools, toolRunners: runners });
}
export function asDelegatingTool(masterCfg, name, child, opts, schema = { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }) {
    const id = sanitize(name);
    const tool = {
        id,
        name: id,
        description: `${name} delegated agent`,
        inputSchema: schema,
        route: '__local__',
        transport: 'http'
    };
    const runner = async (args) => {
        const correlationId = crypto.randomUUID();
        const input = typeof (args === null || args === void 0 ? void 0 : args.input) === 'string' ? args.input : JSON.stringify(args);
        const parentMessages = [];
        try {
            emitEvent('delegate_start', masterCfg, { correlationId, child: name, args: args || {} });
        }
        catch (_a) { }
        try {
            // Build delegation context for brief
            const parent = masterCfg;
            const ctx = {
                parentMessages,
                lastUserMessage: typeof input === 'string' ? input : JSON.stringify(input),
                chosenChildName: name,
                businessId: ((parent === null || parent === void 0 ? void 0 : parent.businessId) || undefined),
                sessionId: ((parent === null || parent === void 0 ? void 0 : parent.sessionId) || undefined),
                userId: ((parent === null || parent === void 0 ? void 0 : parent.userId) || undefined),
                constraints: ((parent === null || parent === void 0 ? void 0 : parent.constraints) || undefined),
                childTools: child.tools
            };
            let brief = '';
            if (opts === null || opts === void 0 ? void 0 : opts.preDelegate)
                brief = await opts.preDelegate(ctx);
            if (!brief && masterCfg.briefFormatter)
                brief = masterCfg.briefFormatter(ctx);
            brief = String(brief || '').trim();
            // Guarantee: seed child's first assistant message with brief if missing
            if (brief)
                child.seedFirstAssistant(brief, { reset: !!(opts === null || opts === void 0 ? void 0 : opts.seedPersistentChild) });
            // Single-turn child invoke
            await child.send(input);
            const assistantMessages = child.getMessages().filter(m => m.sender === 'assistant');
            const last = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : undefined;
            const result = (last === null || last === void 0 ? void 0 : last.content) || '';
            emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: true });
            return result;
        }
        catch (e) {
            emitEvent('delegate_end', masterCfg, { correlationId, child: name, ok: false, error: e instanceof Error ? e.message : String(e) });
            throw e;
        }
    };
    return { tool, runnerKey: id, runner };
}
