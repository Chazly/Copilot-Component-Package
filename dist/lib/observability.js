export function emitEvent(event, cfg, payload) {
    var _a, _b, _c, _d;
    try {
        const redactor = (_a = cfg.observability) === null || _a === void 0 ? void 0 : _a.redact;
        const data = redactor ? redactor(payload) : payload;
        const id = ((_b = cfg.observability) === null || _b === void 0 ? void 0 : _b.correlationId) || undefined;
        const safe = Object.assign({ event, correlationId: id }, data);
        const logger = (cfg.logger || console);
        if (event.endsWith('error')) {
            (_c = logger.error) === null || _c === void 0 ? void 0 : _c.call(logger, '[obs]', safe);
        }
        else {
            (_d = logger.debug) === null || _d === void 0 ? void 0 : _d.call(logger, '[obs]', safe);
        }
    }
    catch (_e) { }
}
