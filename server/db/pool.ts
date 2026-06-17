import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    'postgresql://board:board@localhost:5434/board_governance'
  )
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  }
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export async function pingDatabase(): Promise<boolean> {
  try {
    const res = await getPool().query('SELECT 1 AS ok')
    return res.rows[0]?.ok === 1
  } catch {
    return false
  }
}
