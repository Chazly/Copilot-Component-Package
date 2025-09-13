const sanitize = (s) => String(s).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_');
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
export function createOrchestratorConfig(base, children) {
    const accTools = [...(base.tools || [])];
    const runners = Object.assign({}, (base.toolRunners || {}));
    for (const c of children) {
        const { tool, runnerKey, runner } = asTool(c.name, c.agent, c.schema);
        accTools.push(tool);
        runners[runnerKey] = runner;
    }
    return Object.assign(Object.assign({}, base), { tools: accTools, toolRunners: runners });
}
