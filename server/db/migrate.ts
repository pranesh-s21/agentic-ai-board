import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool, pingDatabase } from './pool.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SEED_ACTIONS = [
  {
    title: 'Final vendor due diligence',
    description:
      'Complete independent vendor due diligence including financial stability, security posture, and concentration risk assessment.',
    documentReferenceId: null,
    owner: 'Procurement and Technology',
    dueDate: '2026-07-30',
    notes: 'Board condition from June 2026 meeting.',
    status: 'Open',
    priority: 'High',
    linkedDecision: 'Strategic Network Investment Programme',
    linkedMeetingId: 'meeting-2026-06',
  },
  {
    title: 'Quarterly risk reporting',
    description: 'Establish quarterly risk reporting framework for the investment programme.',
    documentReferenceId: null,
    owner: 'Chief Risk Officer',
    dueDate: '2026-09-30',
    notes: '',
    status: 'Open',
    priority: 'High',
    linkedDecision: 'Strategic Network Investment Programme',
    linkedMeetingId: 'meeting-2026-06',
  },
  {
    title: 'Updated financial model before next meeting',
    description:
      'Provide updated financial model incorporating sensitivity analysis and revised demand forecasts.',
    documentReferenceId: null,
    owner: 'Chief Financial Officer',
    dueDate: '2026-06-10',
    notes: 'Escalate if not received by 12 June.',
    status: 'Overdue',
    priority: 'High',
    linkedDecision: 'Strategic Network Investment Programme',
    linkedMeetingId: 'meeting-2026-06',
  },
]

export async function runMigrations(): Promise<void> {
  const schema = await readFile(path.join(__dirname, 'schema.sql'), 'utf8')
  await getPool().query(schema)
}

export async function seedGovernanceActionsIfEmpty(): Promise<number> {
  const countRes = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM governance_actions'
  )
  const count = Number(countRes.rows[0]?.count ?? 0)
  if (count > 0) return 0

  for (const action of SEED_ACTIONS) {
    await getPool().query(
      `INSERT INTO governance_actions (
        title, description, document_reference_id, owner, due_date, notes,
        status, priority, linked_decision, linked_meeting_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        action.title,
        action.description,
        action.documentReferenceId,
        action.owner,
        action.dueDate,
        action.notes,
        action.status,
        action.priority,
        action.linkedDecision,
        action.linkedMeetingId,
      ]
    )
  }

  return SEED_ACTIONS.length
}

export async function initDatabase(): Promise<{ ok: boolean; seeded: number }> {
  const ok = await pingDatabase()
  if (!ok) return { ok: false, seeded: 0 }

  await runMigrations()
  const seeded = await seedGovernanceActionsIfEmpty()
  return { ok: true, seeded }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then((result) => {
      if (!result.ok) {
        console.error('Database not reachable. Start Postgres: docker compose up -d')
        process.exit(1)
      }
      console.log(`Migrations applied. Seeded ${result.seeded} action(s).`)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
