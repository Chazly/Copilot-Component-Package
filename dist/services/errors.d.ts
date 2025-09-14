export declare class ProviderHttpError extends Error {
    status: number;
    endpoint: string;
    model?: string;
    body?: any;
    pathType?: 'chat' | 'responses' | 'other';
    constructor(message: string, init: {
        status: number;
        endpoint: string;
        model?: string;
        body?: any;
        pathType?: 'chat' | 'responses' | 'other';
    });
}
