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

Board AI chat calls a small Express proxy (`server/`) so API keys stay off the frontend.

### Option A — Cohere North agent (recommended)

Configure the agent you built in North Agent Studio:

```env
CHAT_PROVIDER=north
COHERE_API_KEY=your-key
NORTH_CHAT_URL=https://your-north-instance.example.com/api/v1/agents/YOUR_AGENT_ID/chat
```

Or use base URL + agent ID:

```env
NORTH_BASE_URL=https://your-north-instance.example.com
NORTH_AGENT_ID=your-agent-id
```

### Option B — Cohere Chat API with board pack RAG

Uses Cohere Chat v2 with board pack documents as RAG context (good fallback if North URL isn't ready):

```env
CHAT_PROVIDER=cohere
COHERE_API_KEY=your-key
COHERE_MODEL=command-a-03-2025
```

### Option C — Mock (no keys)

If no keys are set, the server returns hardcoded demo answers so the UI still works.

### Verify connection

- Open **Ask Board AI** — status badge shows `Cohere North`, `Cohere Agent`, or `Mock (offline)`
- Or hit `GET http://localhost:3001/api/chat/health`

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

Board pack data is hardcoded; chat uses Cohere North / Cohere API when configured.
