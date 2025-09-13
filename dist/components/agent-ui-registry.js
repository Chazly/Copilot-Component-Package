class AgentUIRegistryClass {
    constructor() {
        this.map = new Map();
    }
    register(key, comp) { this.map.set(key, comp); }
    get(key) { return this.map.get(key); }
}
export const AgentUIRegistry = new AgentUIRegistryClass();
