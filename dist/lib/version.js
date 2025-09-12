export const COPILOT_VERSION = '1.0.0-phase5';
import { PKG_COMMIT } from './commit';
function getEnvVar(key) {
    var _a, _b, _c, _d, _e;
    try {
        if (typeof window !== 'undefined') {
            // Browser environments: Vite / Next public envs or injected globals
            const viteVal = (_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b[key];
            const nextVal = (_d = (_c = window === null || window === void 0 ? void 0 : window.process) === null || _c === void 0 ? void 0 : _c.env) === null || _d === void 0 ? void 0 : _d[key];
            const injected = window === null || window === void 0 ? void 0 : window.__COPILOT_COMMIT;
            return viteVal || nextVal || injected;
        }
    }
    catch (_f) { }
    try {
        return (_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e[key];
    }
    catch (_g) { }
    return undefined;
}
const rawCommit = 
// Preferred public envs for browser builds
getEnvVar('VITE_COMMIT') ||
    getEnvVar('NEXT_PUBLIC_COMMIT') ||
    // Common CI envs
    getEnvVar('GITHUB_SHA') ||
    getEnvVar('VERCEL_GIT_COMMIT_SHA') ||
    getEnvVar('COMMIT_SHA') ||
    getEnvVar('SOURCE_VERSION') ||
    // Generated at build time inside this package
    PKG_COMMIT ||
    // Fallback
    'dev';
export const COPILOT_COMMIT = String(rawCommit).slice(0, 7);
export function getVersion() {
    return { version: COPILOT_VERSION, commit: COPILOT_COMMIT };
}
