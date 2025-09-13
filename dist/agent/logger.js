export const ConsoleLogger = (scope = 'agent') => ({
    debug: (...a) => { try {
        console.debug(`[${scope}]`, ...a);
    }
    catch (_a) { } },
    info: (...a) => { try {
        console.info(`[${scope}]`, ...a);
    }
    catch (_a) { } },
    warn: (...a) => { try {
        console.warn(`[${scope}]`, ...a);
    }
    catch (_a) { } },
    error: (...a) => { try {
        console.error(`[${scope}]`, ...a);
    }
    catch (_a) { } },
    withScope(s) { return ConsoleLogger(`${scope}:${s}`); }
});
