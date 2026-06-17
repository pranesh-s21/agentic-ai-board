import { getNorthAuthHeaders, getNorthBaseUrl } from './northAuth.ts'

export interface NorthProbeResult {
  url: string
  status: number
  ok: boolean
  snippet: string
  note?: string
}

/** Paths that matter for democloud / North tenant chat (not legacy /internal/v1). */
function buildProbePaths(agentId?: string): Array<{ path: string; note: string }> {
  const id = agentId ?? process.env.NORTH_AGENT_ID?.trim()
  return [
    { path: '/api/v1/agents', note: 'List agents (may be empty; use agent ID URL for yours)' },
    ...(id ? [{ path: `/api/v1/agents/${id}`, note: 'Your agent + My Files tools — required for chat' }] : []),
    { path: '/api/v1/conversations', note: 'Your past North chats (proves session cookie works)' },
    { path: '/api/v1/chat', note: 'Chat endpoint (POST only — 405 on GET is normal)' },
  ]
}

export async function probeNorthEndpoints(): Promise<NorthProbeResult[]> {
  const base = getNorthBaseUrl()
  if (!base) {
    return [{ url: '(unset)', status: 0, ok: false, snippet: 'Set NORTH_BASE_URL to your North instance URL' }]
  }

  let headers: Record<string, string | undefined>
  try {
    headers = await getNorthAuthHeaders()
  } catch (error) {
    return [{
      url: base,
      status: 0,
      ok: false,
      snippet: error instanceof Error ? error.message : 'Auth not configured',
    }]
  }

  const results: NorthProbeResult[] = []
  for (const { path, note } of buildProbePaths()) {
    const url = `${base}${path}`
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...headers, Accept: 'application/json', 'X-Client-Name': 'du-board-ai-poc' },
      })
      const body = await response.text()
      // POST-only chat route returns 405 on GET — still means the API is reachable
      const ok = response.ok || (path.endsWith('/chat') && response.status === 405)
      results.push({
        url,
        status: response.status,
        ok,
        note,
        snippet: body.slice(0, 160).replace(/\s+/g, ' '),
      })
    } catch (error) {
      results.push({
        url,
        status: 0,
        ok: false,
        note,
        snippet: error instanceof Error ? error.message : 'Request failed',
      })
    }
  }

  return results
}

export function summarizeProbes(probes: NorthProbeResult[]): { healthy: boolean; summary: string } {
  const agentProbe = probes.find((p) => p.url.includes('/api/v1/agents/') && p.ok)
  const convProbe = probes.find((p) => p.url.endsWith('/conversations') && p.ok)
  if (agentProbe && convProbe) {
    return {
      healthy: true,
      summary: 'North session is valid — agent and conversations API reachable',
    }
  }
  if (convProbe) {
    return { healthy: true, summary: 'Session cookie works; verify NORTH_AGENT_ID' }
  }
  return { healthy: false, summary: 'North session not working — refresh NORTH_SESSION_COOKIE' }
}
