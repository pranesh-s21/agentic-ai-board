import { cn } from '@/lib/utils'

export interface SpreadsheetTab {
  page: number
  label: string
}

interface SpreadsheetViewerProps {
  headers: string[]
  rows: string[][]
  highlightPassage?: string | null
  tabs?: SpreadsheetTab[]
  activePage?: number
  onTabChange?: (page: number) => void
}

function HighlightedCell({ text, highlightPassage }: { text: string; highlightPassage?: string | null }) {
  if (!highlightPassage || !text.includes(highlightPassage)) {
    return <>{text}</>
  }

  const parts = text.split(highlightPassage)
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="rounded-sm bg-yellow-200 px-0.5 ring-2 ring-du-magenta-400 ring-offset-1">
              {highlightPassage}
            </mark>
          )}
        </span>
      ))}
    </>
  )
}

function looksNumeric(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '—' || trimmed === '-') return false
  return /^[\d,.%()AED\s+-]+$/.test(trimmed)
}

export function SpreadsheetViewer({
  headers,
  rows,
  highlightPassage,
  tabs = [],
  activePage,
  onTabChange,
}: SpreadsheetViewerProps) {
  const hasTabs = tabs.length > 0 && onTabChange != null

  return (
    <div className="overflow-hidden rounded-md border border-navy-300 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-xs">
          <thead>
            <tr className="bg-[#217346] text-white">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={cn(
                    'border border-[#1a5c38] px-2.5 py-2 text-left font-semibold',
                    i > 0 && 'text-right'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#f8faf9]',
                  row[0]?.startsWith('Total') && 'bg-[#e8f0ec] font-semibold'
                )}
              >
                {headers.map((_, colIndex) => {
                  const cell = row[colIndex] ?? ''
                  const numeric = colIndex > 0 && looksNumeric(cell)
                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        'border border-navy-200 px-2.5 py-1.5 text-navy-800',
                        numeric && 'text-right font-mono tabular-nums',
                        colIndex === 0 && 'font-medium'
                      )}
                    >
                      <HighlightedCell text={cell} highlightPassage={highlightPassage} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasTabs && (
        <div className="flex overflow-x-auto border-t border-navy-300 bg-[#e8e8e8] scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = tab.page === activePage
            return (
              <button
                key={tab.page}
                type="button"
                onClick={() => onTabChange(tab.page)}
                className={cn(
                  'shrink-0 border-r border-navy-300 px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? '-mb-px border-b border-white bg-white text-navy-900'
                    : 'text-navy-600 hover:bg-[#dcdcdc] hover:text-navy-900'
                )}
                aria-selected={isActive}
                role="tab"
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
