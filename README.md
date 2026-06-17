# du Board AI — Prototype

Executive Board AI application prototype for strategic investment programme approval.

## Run locally

```bash
npm install
cp .env.example .env   # add your Cohere / North credentials
npm run dev:all        # frontend + chat API server
```

Open `http://localhost:5173` (Vite proxies `/api` → chat server on port 3001).

Or run separately:

```bash
npm run dev:server   # chat API on :3001
npm run dev          # frontend on :5173
```

## Cohere North integration (POC)

Board AI chat calls a small Express proxy (`server/`) so credentials stay off the frontend.

### How North My Files actually work

| What you're using | Can see North My Files? |
|---|---|
| **North agent** (`CHAT_PROVIDER=north`) | Yes — same as democloud chat UI |
| **Public Cohere API** (`CHAT_PROVIDER=cohere`) | No — only mock board pack documents |

Your dashboard `COHERE_API_KEY` talks to `api.cohere.com`. It cannot see files in North My Files. Those are accessed by your **North agent** on democloud — the Board app must call that agent.

### Connect live North My Files (no local copy)

1. **North Admin → Agents** — copy your agent ID
2. Open **democloud.cohere.com**, log in, open your agent chat
3. **DevTools → Network** — send a message, find the POST request
4. Copy the **Cookie** header → `NORTH_SESSION_COOKIE`
5. Optionally copy the full POST URL → `NORTH_CHAT_URL`

```env
CHAT_PROVIDER=north
NORTH_BASE_URL=https://democloud.cohere.com
NORTH_AGENT_ID=your-agent-id
NORTH_SESSION_COOKIE=session=...; ...
```

Restart `npm run dev:all`, then test: `GET http://localhost:3001/api/north/discover`

If OAuth app registration is blocked on your instance, the **session cookie** is the practical auth path until your admin creates an OAuth app.

### Verify

- **Ask Board AI** badge shows **Cohere North** (not "Cohere Agent")
- 5G questions match what you get in the North UI
- `GET http://localhost:3001/api/chat/health` → `"provider": "north"`

## Role switching

Use the role selector in the header to simulate:

- **Board Member** — preparation, private workspace, read-only actions
- **Chair** — AI-Free Mode, meeting controls
- **Secretariat** — review queue, approve AI outputs, edit actions
- **Governance User** — audit summary, compliance indicators

## End-to-end flow

1. Start on **Dashboard** — review meeting readiness
2. Open **Meetings** → click **Strategic Network Investment Programme**
3. Review **Board Pack** with document viewer, AI insights, and citations
4. Use **Ask Board AI** — live answers from your Cohere North agent
5. Click citation chips to jump to sourced passages in the pack
6. Switch to **Chair** and enable **AI-Free Mode** in Chair Controls
7. Switch to **Secretariat** to approve pending AI drafts

Board pack data is hardcoded; chat uses your North agent when configured.

## Governance Actions (PostgreSQL + MCP)

Action Tracking can use a **live governance register** in PostgreSQL instead of mock data.

### 1. Start Postgres

**Local (Docker):**

```bash
# Start Docker Desktop first, then:
npm run db:up
npm run db:migrate
```

Use `npm run db:up` (not bare `docker compose up`) so Compose does not read your main `.env` — `NORTH_SESSION_COOKIE` contains `$o1`, `$g0`, etc. from Google Analytics cookies, which Docker mis-parses as variables.

**Supabase:** create a project, copy the connection string into `.env`:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
DATABASE_SSL=true
```

### 2. Run the stack

```bash
npm run dev:stack
```

This starts Vite (`5173`), chat API (`3001`), and the **governance MCP server** (`3002`).

Action Tracking shows **“Live governance register”** when the DB is connected.

### 3. Expose MCP to Cohere North (ngrok)

North on democloud cannot reach `localhost`. Tunnel the MCP port:

```bash
ngrok http 3002
```

Add to `.env` (hostname only, no `https://`):

```env
MCP_ALLOWED_HOSTS=your-subdomain.ngrok-free.app
```

In **North Admin → your agent → Tools / MCP**, add a remote MCP connector:

- **URL:** `https://your-subdomain.ngrok-free.app/mcp`
- **Transport:** Streamable HTTP

Restart MCP after changing `MCP_ALLOWED_HOSTS`:

```bash
npm run dev:mcp
```

### MCP tools (for North)

| Tool | Purpose |
|------|---------|
| `list_governance_actions` | List actions (filter by status, owner, document ref) |
| `get_governance_action` | Get one action by UUID |
| `create_governance_action` | Create action (title, owner, due date, notes, document ref, …) |
| `update_governance_action` | Update status or fields |

### REST API (Board app)

| Method | Path |
|--------|------|
| `GET` | `/api/governance/health` |
| `GET` | `/api/governance/actions` |
| `POST` | `/api/governance/actions` |
| `PATCH` | `/api/governance/actions/:id` |

### Action fields

- `title`, `description`, `owner`, `dueDate`, `notes`
- `documentReferenceId` — North My Files ID or board document reference
- `status`, `priority`, `linkedDecision`
