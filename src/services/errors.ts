export class ProviderHttpError extends Error {
  status: number
  endpoint: string
  model?: string
  body?: any
  pathType?: 'chat' | 'responses' | 'other'
  constructor(message: string, init: { status: number; endpoint: string; model?: string; body?: any; pathType?: 'chat' | 'responses' | 'other' }) {
    super(message)
    this.name = 'ProviderHttpError'
    this.status = init.status
    this.endpoint = init.endpoint
    this.model = init.model
    this.body = init.body
    this.pathType = init.pathType
  }
}


