import { ConsoleLogger } from './logger';
export class CopilotAgent {
    constructor(provider, normalizedConfig, agentConfig) {
        this.listeners = {};
        this.history = [];
        this.log = ConsoleLogger('agent');
        this.provider = provider;
        this.cfg = normalizedConfig;
        this.agentCfg = agentConfig;
        this.log = (agentConfig.logger || ConsoleLogger('agent')).withScope(agentConfig.name || normalizedConfig.name);
        this.push({ id: crypto.randomUUID(), content: normalizedConfig.firstMessage, sender: 'assistant', timestamp: new Date() });
    }
    get name() { return this.agentCfg.name || this.cfg.name; }
    get description() { return this.agentCfg.description || this.cfg.description; }
    get avatarUrl() { return this.agentCfg.logo_or_avatar || this.cfg.persona.avatarUrl; }
    get uiKey() { return this.agentCfg.ui_to_use || 'default'; }
    get tools() { return this.agentCfg.tools || []; }
    on(event, cb) { this.listeners[event] = cb; }
    getMessages() { return [...this.history]; }
    async send(text, opts) {
        var _a;
        const content = String(text || '').trim();
        if (!content)
            return;
        const user = { id: crypto.randomUUID(), content, sender: 'user', timestamp: new Date() };
        this.push(user);
        this.emit('loading', true);
        const t0 = Date.now();
        try {
            this.log.info('send', { len: content.length });
            const resp = await this.provider.sendMessage(this.toProviderMessages(user), await this.resolveSystemPrompt(), this.tools, this.toToolChoice(opts === null || opts === void 0 ? void 0 : opts.toolChoice), !!this.agentCfg.debug);
            await this.handleToolCalls((_a = resp === null || resp === void 0 ? void 0 : resp.metadata) === null || _a === void 0 ? void 0 : _a.toolCalls);
            this.push({ id: crypto.randomUUID(), content: (resp === null || resp === void 0 ? void 0 : resp.content) || '', sender: 'assistant', timestamp: new Date() });
            this.log.debug('send:ok', { ms: Date.now() - t0 });
        }
        catch (e) {
            this.log.error('send:fail', e);
            this.emit('error', e);
            this.push({ id: crypto.randomUUID(), content: this.cfg.fallbackMessage, sender: 'assistant', timestamp: new Date() });
        }
        finally {
            this.emit('loading', false);
        }
    }
    async sendStream(text, opts) {
        const content = String(text || '').trim();
        if (!content)
            return;
        const user = { id: crypto.randomUUID(), content, sender: 'user', timestamp: new Date() };
        this.push(user);
        this.emit('loading', true);
        const placeholderId = crypto.randomUUID();
        this.push({ id: placeholderId, content: '', sender: 'assistant', timestamp: new Date() });
        const t0 = Date.now();
        try {
            this.log.info('stream', { len: content.length });
            await this.provider.sendMessageStream(this.toProviderMessages(user), (chunk) => {
                const delta = chunk.content || '';
                if (delta) {
                    this.append(placeholderId, delta);
                    this.emit('stream', delta);
                }
                if (chunk.isComplete)
                    this.emit('loading', false);
            }, await this.resolveSystemPrompt(), this.tools, this.toToolChoice(opts === null || opts === void 0 ? void 0 : opts.toolChoice), !!this.agentCfg.debug);
            this.log.debug('stream:ok', { ms: Date.now() - t0 });
        }
        catch (e) {
            this.log.error('stream:fail', e);
            this.emit('error', e);
            this.replace(placeholderId, this.cfg.fallbackMessage);
        }
        finally {
            this.emit('loading', false);
        }
    }
    async handleToolCalls(toolCalls) {
        var _a;
        if (!toolCalls || !toolCalls.length)
            return;
        this.log.info('tool_calls', toolCalls.map(t => t.name));
        for (const call of toolCalls) {
            const key = String(call.name || '').slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_');
            const runner = (_a = this.agentCfg.toolRunners) === null || _a === void 0 ? void 0 : _a[key];
            if (!runner) {
                this.log.warn('tool_missing', key);
                continue;
            }
            try {
                const args = typeof call.arguments === 'object' ? call.arguments : (() => { try {
                    return JSON.parse(call.arguments || '{}');
                }
                catch (_a) {
                    return {};
                } })();
                this.log.debug('tool_invoke', { key, args });
                const result = await runner(args);
                const content = typeof result === 'string' ? result : '```json\n' + JSON.stringify(result, null, 2) + '\n```';
                this.push({ id: crypto.randomUUID(), content, sender: 'assistant', timestamp: new Date() });
            }
            catch (e) {
                this.log.error('tool_error', e);
                this.push({ id: crypto.randomUUID(), content: `Tool '${key}' failed.`, sender: 'assistant', timestamp: new Date() });
            }
        }
    }
    async resolveSystemPrompt() {
        const ctx = await this.resolveContext();
        const prompt = this.pickPrompt(this.agentCfg.system_prompts, ctx) || this.cfg.systemPrompt;
        if (!ctx)
            return prompt;
        const prefix = '[SESSION_CONTEXT]\n';
        return prompt ? `${prefix}${ctx}\n${prompt}` : `${prefix}${ctx}`;
    }
    async resolveContext() {
        const c = this.agentCfg.context;
        if (!c)
            return undefined;
        const v = typeof c === 'function' ? await c() : c;
        if (typeof v === 'string')
            return v;
        try {
            const obj = v;
            if (this.agentCfg.contextFormatter)
                return this.agentCfg.contextFormatter(obj);
            return this.serializeContext(obj);
        }
        catch (_a) {
            return String(v);
        }
    }
    serializeContext(obj) {
        const stable = (o) => {
            if (Array.isArray(o))
                return o.map(stable);
            if (o && typeof o === 'object') {
                return Object.keys(o).sort().reduce((acc, k) => { acc[k] = stable(o[k]); return acc; }, {});
            }
            return o;
        };
        const body = JSON.stringify(stable(obj), null, 2);
        return `CONTEXT_JSON:\n\`\`\`json\n${body}\n\`\`\``;
    }
    pickPrompt(prompts = [], ctx) {
        for (const p of prompts) {
            if (typeof p === 'string')
                return p;
            if (!p.when || p.when(ctx))
                return p.text;
        }
        return undefined;
    }
    toProviderMessages(latest) {
        const base = this.history.map(m => ({
            role: (m.sender === 'user' ? 'user' : 'assistant'),
            content: m.content,
            timestamp: m.timestamp
        }));
        if (latest)
            base.push({ role: 'user', content: latest.content, timestamp: latest.timestamp });
        return base;
    }
    toToolChoice(choice) {
        if (!choice || choice === 'auto')
            return 'auto';
        return { type: 'function', function: { name: String(choice.name).slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '_') } };
    }
    push(msg) { this.history = [...this.history, msg]; this.emit('message', msg); }
    append(id, delta) {
        this.history = this.history.map(m => m.id === id ? Object.assign(Object.assign({}, m), { content: m.content + delta }) : m);
        const updated = this.history.find(m => m.id === id);
        if (updated)
            this.emit('message', updated);
    }
    replace(id, content) {
        this.history = this.history.map(m => m.id === id ? Object.assign(Object.assign({}, m), { content }) : m);
        const updated = this.history.find(m => m.id === id);
        if (updated)
            this.emit('message', updated);
    }
    emit(event, payload) {
        const cb = this.listeners[event];
        if (cb)
            cb(payload);
    }
}
export default CopilotAgent;
