export const COPILOT_VERSION = '1.0.0-phase5'
import { PKG_COMMIT } from './commit'

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof window !== 'undefined') {
      // Browser environments: Vite / Next public envs or injected globals
      const viteVal = (import.meta as any)?.env?.[key]
      const nextVal = (window as any)?.process?.env?.[key]
      const injected = (window as any)?.__COPILOT_COMMIT
      return viteVal || nextVal || injected
    }
  } catch {}
  try {
    return (process as any)?.env?.[key]
  } catch {}
  return undefined
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
  'dev'

export const COPILOT_COMMIT = String(rawCommit).slice(0, 7)

export function getVersion() {
  return { version: COPILOT_VERSION, commit: COPILOT_COMMIT }
}

