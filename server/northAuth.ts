/** Resolve auth headers for Cohere North API calls. */

let cachedToken: { value: string; expiresAt: number } | null = null

export interface NorthAuthHeaders {
  Authorization?: string
  Cookie?: string
  [key: string]: string | undefined
}

function readCookieValue(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`))
  return match?.[1]
}

export async function getNorthAuthHeaders(): Promise<NorthAuthHeaders> {
  const sessionCookie = process.env.NORTH_SESSION_COOKIE?.trim()
  if (sessionCookie) {
    const headers: NorthAuthHeaders = { Cookie: sessionCookie }
    // North chat often accepts the authToken JWT as Bearer (also sent via Cookie).
    const authToken = readCookieValue(sessionCookie, 'authToken')
    if (authToken) headers.Authorization = `Bearer ${authToken}`
    return headers
  }

  const clientId = process.env.NORTH_CLIENT_ID?.trim()
  const clientSecret = process.env.NORTH_CLIENT_SECRET?.trim() ?? process.env.NORTH_API_KEY?.trim()
  if (clientId && clientSecret) {
    const token = await fetchOAuthToken(clientId, clientSecret)
    return { Authorization: `Bearer ${token}` }
  }

  const apiKey = process.env.NORTH_API_KEY?.trim() ?? process.env.COHERE_API_KEY?.trim()
  if (apiKey) {
    return { Authorization: `Bearer ${apiKey}` }
  }

  throw new Error('North auth not configured — set NORTH_SESSION_COOKIE, OAuth credentials, or NORTH_API_KEY')
}

async function fetchOAuthToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const base = (process.env.NORTH_BASE_URL ?? '').replace(/\/$/, '')
  const tokenPaths = [
    process.env.NORTH_OAUTH_TOKEN_URL,
    base ? `${base}/oauth/token` : null,
    base ? `${base}/internal/v1/oauth/token` : null,
    base ? `${base}/api/v1/oauth/token` : null,
  ].filter(Boolean) as string[]

  let lastError = 'No token URL configured'
  for (const url of tokenPaths) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })
      if (!response.ok) {
        lastError = await response.text()
        continue
      }
      const data = (await response.json()) as { access_token?: string; expires_in?: number }
      if (!data.access_token) continue
      cachedToken = {
        value: data.access_token,
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      }
      return data.access_token
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }

  throw new Error(`North OAuth token exchange failed: ${lastError.slice(0, 200)}`)
}

export function getNorthBaseUrl(): string | null {
  const base = process.env.NORTH_BASE_URL?.replace(/\/$/, '')
  return base || null
}
