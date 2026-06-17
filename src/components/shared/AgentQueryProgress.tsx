import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const PHASES = [
  'Reviewing your query',
  'Searching board materials',
  'Locating source documents',
  'Cross-referencing prior decisions',
  'Drafting cited response',
] as const

/** Restrained progress while the agent retrieves board materials — briefing-note tone, not consumer AI. */
export function AgentQueryProgress({ compact = false }: { compact?: boolean }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const started = Date.now()
    const tick = window.setInterval(() => {
      const ms = Date.now() - started
      setElapsed(ms)
      setProgress(Math.min(88, (1 - Math.exp(-ms / 11000)) * 88))
    }, 150)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        setPhaseIndex((i) => Math.min(i + 1, PHASES.length - 1))
        setVisible(true)
      }, 220)
    }, 3200)
    return () => window.clearInterval(interval)
  }, [])

  const seconds = Math.round(elapsed / 1000)

  return (
    <div
      className={cn(
        'rounded-2xl rounded-tl-sm border border-navy-200/70 bg-white shadow-sm',
        compact ? 'px-3 py-2.5 min-w-[220px]' : 'px-4 py-3.5 min-w-[280px]'
      )}
    >
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p
          className={cn(
            'font-medium uppercase tracking-[0.14em] text-navy-500',
            compact ? 'text-[9px]' : 'text-[10px]'
          )}
        >
          Briefing in progress
        </p>
        <span className={cn('tabular-nums text-navy-400', compact ? 'text-[9px]' : 'text-[10px]')}>
          {seconds}s
        </span>
      </div>

      <p
        className={cn(
          'font-medium text-navy-900 transition-opacity duration-200',
          compact ? 'min-h-[2rem] text-xs leading-snug' : 'min-h-[2.25rem] text-sm leading-snug',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {PHASES[phaseIndex]}…
      </p>

      <div className="mt-3">
        <div className="h-px overflow-hidden rounded-full bg-navy-100">
          <div
            className="briefing-progress h-px rounded-full bg-navy-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className={cn('text-navy-500', compact ? 'text-[9px]' : 'text-[10px]')}>
            Board materials · source-cited
          </p>
          <p className={cn('tabular-nums text-navy-400', compact ? 'text-[9px]' : 'text-[10px]')}>
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  )
}
