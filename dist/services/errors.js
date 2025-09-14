export class ProviderHttpError extends Error {
    constructor(message, init) {
        super(message);
        this.name = 'ProviderHttpError';
        this.status = init.status;
        this.endpoint = init.endpoint;
        this.model = init.model;
        this.body = init.body;
        this.pathType = init.pathType;
    }
}
