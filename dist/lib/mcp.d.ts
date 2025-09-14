export type McpSseEvent = {
    type: 'progress' | 'data' | 'done' | 'error';
    data?: any;
    message?: string;
};
export declare function aggregateSseToPromise(stream: ReadableStream<Uint8Array>, onProgress?: (p: any) => void): Promise<any>;
export type ToolSuccess<T = any> = {
    ok: true;
    data: T;
    error?: undefined;
};
export type ToolFailure = {
    ok: false;
    error: {
        code?: string;
        message: string;
        details?: any;
    };
};
export type ToolResult<T = any> = ToolSuccess<T> | ToolFailure;
export declare function ok<T = any>(data: T): ToolResult<T>;
export declare function fail(message: string, details?: any, code?: string): ToolResult<never>;
