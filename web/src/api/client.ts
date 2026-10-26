const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not reach the API. Make sure Django is running on port 8000.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(readErrorMessage(payload) || `The API returned ${response.status}.`)
  return payload as T
}

function readErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return null
}
