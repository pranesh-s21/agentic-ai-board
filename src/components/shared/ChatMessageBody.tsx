import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Copy } from 'lucide-react'

type ListItem = { text: string; subItems: string[] }

type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; level: 1 | 2 | 3; text: string }
  | { type: 'ul'; items: ListItem[] }
  | { type: 'ol'; items: ListItem[] }

type TableCell = { content: string; isHeader: boolean; colSpan?: number }
type TableRow = { cells: TableCell[] }

type Segment =
  | { type: 'text'; content: string }
  | { type: 'html-table'; rows: TableRow[] }
  | { type: 'markdown-table'; headers: string[]; rows: string[][] }

function htmlCellToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<\/?[^>]+>/g, '')
    .trim()
}

function parseHtmlTable(html: string): TableRow[] {
  const rows: TableRow[] = []
  const trRegex = /<tr[\s\S]*?<\/tr>/gi
  let trMatch: RegExpExecArray | null

  while ((trMatch = trRegex.exec(html)) !== null) {
    const cells: TableCell[] = []
    const cellRegex = /<(t[hd])([^>]*)>([\s\S]*?)<\/\1>/gi
    let cellMatch: RegExpExecArray | null

    while ((cellMatch = cellRegex.exec(trMatch[0])) !== null) {
      const tag = cellMatch[1].toLowerCase()
      const attrs = cellMatch[2]
      const colSpanMatch = attrs.match(/colspan\s*=\s*["']?(\d+)/i)
      cells.push({
        content: htmlCellToText(cellMatch[3]),
        isHeader: tag === 'th',
        colSpan: colSpanMatch ? Number(colSpanMatch[1]) : undefined,
      })
    }

    if (cells.length > 0) rows.push({ cells })
  }

  return rows
}

function isMarkdownTableSeparator(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]+$/.test(line.trim())
}

function parseMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function extractMarkdownTables(text: string): Segment[] {
  const lines = text.split('\n')
  const segments: Segment[] = []
  let textBuffer: string[] = []
  let index = 0

  const flushText = () => {
    if (textBuffer.length > 0) {
      segments.push({ type: 'text', content: textBuffer.join('\n') })
      textBuffer = []
    }
  }

  while (index < lines.length) {
    const line = lines[index]
    const next = lines[index + 1]

    if (
      line.includes('|') &&
      next &&
      isMarkdownTableSeparator(next)
    ) {
      flushText()
      const headers = parseMarkdownTableRow(line)
      index += 2
      const rows: string[][] = []
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseMarkdownTableRow(lines[index]))
        index += 1
      }
      segments.push({ type: 'markdown-table', headers, rows })
      continue
    }

    textBuffer.push(line)
    index += 1
  }

  flushText()
  return segments
}

function splitContentSegments(content: string): Segment[] {
  const segments: Segment[] = []
  const tableRegex = /<table[\s\S]*?<\/table>/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tableRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...extractMarkdownTables(content.slice(lastIndex, match.index)))
    }
    segments.push({ type: 'html-table', rows: parseHtmlTable(match[0]) })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push(...extractMarkdownTables(content.slice(lastIndex)))
  }

  return segments.length > 0 ? segments : extractMarkdownTables(content)
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let ulBuffer: ListItem[] = []
  let olBuffer: ListItem[] = []

  const flushUl = () => {
    if (ulBuffer.length) {
      blocks.push({ type: 'ul', items: [...ulBuffer] })
      ulBuffer = []
    }
  }
  const flushOl = () => {
    if (olBuffer.length) {
      blocks.push({ type: 'ol', items: [...olBuffer] })
      olBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const bulletMatch = line.match(/^[-*•]\s+(.+)/)
    if (bulletMatch) {
      const text = bulletMatch[1]
      if (olBuffer.length > 0) {
        olBuffer[olBuffer.length - 1].subItems.push(text)
        continue
      }
      flushOl()
      ulBuffer.push({ text, subItems: [] })
      continue
    }

    const numberedMatch = line.match(/^\d+[.)]\s+(.+)/)
    if (numberedMatch) {
      flushUl()
      olBuffer.push({ text: numberedMatch[1], subItems: [] })
      continue
    }

    flushUl()
    flushOl()

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      blocks.push({
        type: 'h',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      })
    } else if (/^\*\*[^*]+\*\*:?\s*$/.test(line)) {
      blocks.push({ type: 'h', level: 3, text: line.replace(/^\*\*|\*\*:?\s*$/g, '') })
    } else {
      blocks.push({ type: 'p', text: line })
    }
  }

  flushUl()
  flushOl()
  return blocks
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-navy-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  })
}

function renderMultiline(text: string, keyPrefix: string) {
  const lines = text.split('\n')
  if (lines.length === 1) return renderInline(text, keyPrefix)

  return lines.map((line, i) => (
    <span key={`${keyPrefix}-line-${i}`}>
      {i > 0 && <br />}
      {renderInline(line, `${keyPrefix}-${i}`)}
    </span>
  ))
}

function plainCellText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
}

function tableToTsv(rows: string[][]): string {
  return rows.map((row) => row.map(plainCellText).join('\t')).join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tableToHtml(rows: string[][], headerRow = true): string {
  if (!rows.length) return '<table></table>'

  const renderRow = (row: string[], cellTag: 'th' | 'td') =>
    `<tr>${row.map((cell) => `<${cellTag}>${escapeHtml(plainCellText(cell))}</${cellTag}>`).join('')}</tr>`

  const [first, ...rest] = rows
  const body = headerRow
    ? `<thead>${renderRow(first, 'th')}</thead><tbody>${rest.map((r) => renderRow(r, 'td')).join('')}</tbody>`
    : `<tbody>${rows.map((r) => renderRow(r, 'td')).join('')}</tbody>`

  return `<table xmlns="http://www.w3.org/1999/xhtml" border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">${body}</table>`
}

async function copyTableToClipboard(rows: string[][], headerRow = true): Promise<void> {
  const tsv = tableToTsv(rows)
  const html = tableToHtml(rows, headerRow)

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([tsv], { type: 'text/plain' }),
      }),
    ])
    return
  }

  await navigator.clipboard.writeText(tsv)
}

function htmlTableToCopyRows(rows: TableRow[]): string[][] {
  return rows.map((row) =>
    row.cells.flatMap((cell) => {
      const text = plainCellText(cell.content)
      if (cell.colSpan && cell.colSpan > 1) {
        return [text, ...Array(cell.colSpan - 1).fill('')]
      }
      return [text]
    })
  )
}

function CopyableTable({
  copyRows,
  headerRow = true,
  compact,
  children,
}: {
  copyRows: string[][]
  headerRow?: boolean
  compact?: boolean
  children: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyTableToClipboard(copyRows, headerRow)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-navy-200/80">
      <div className="flex items-center justify-end border-b border-navy-100 bg-navy-50/60 px-2 py-1.5">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy table for Word or Excel"
          aria-label={copied ? 'Table copied' : 'Copy table'}
          className={cn(
            'flex items-center gap-1 rounded-md border border-navy-200/80 bg-white px-2 py-1 font-medium text-navy-600 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800',
            copied && 'border-teal-400 bg-teal-50 text-teal-800',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy table
            </>
          )}
        </button>
      </div>
      {children}
    </div>
  )
}

function renderListItem(item: ListItem, keyPrefix: string, compact?: boolean) {
  const isMetadata = item.subItems.every((sub) => /^[^:]+:\s/.test(sub))

  return (
    <>
      {renderInline(item.text, keyPrefix)}
      {item.subItems.length > 0 && (
        <ul
          className={cn(
            'mt-1.5 space-y-1',
            isMetadata ? 'list-none pl-0' : 'list-disc pl-4 marker:text-teal-600'
          )}
        >
          {item.subItems.map((sub, k) => (
            <li
              key={k}
              className={cn(
                isMetadata && 'text-navy-600',
                compact ? 'text-[11px]' : 'text-xs'
              )}
            >
              {renderInline(sub, `${keyPrefix}-sub-${k}`)}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function BoardTable({ rows, compact }: { rows: TableRow[]; compact?: boolean }) {
  const cellClass = cn(
    'border border-navy-200/80 px-3 py-2 align-top text-navy-800',
    compact ? 'text-[11px]' : 'text-xs'
  )
  const headerClass = cn(cellClass, 'bg-navy-50 font-semibold text-navy-900')

  if (!rows.length) return null

  return (
    <CopyableTable copyRows={htmlTableToCopyRows(rows)} headerRow={false} compact={compact}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse">
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={row.cells.every((c) => c.isHeader) ? '' : 'bg-white even:bg-navy-50/40'}>
                {row.cells.map((cell, ci) => {
                  const Tag = cell.isHeader ? 'th' : 'td'
                  return (
                    <Tag
                      key={ci}
                      colSpan={cell.colSpan}
                      className={cell.isHeader ? headerClass : cellClass}
                    >
                      {renderMultiline(cell.content, `html-${ri}-${ci}`)}
                    </Tag>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CopyableTable>
  )
}

function MarkdownTable({
  headers,
  rows,
  compact,
}: {
  headers: string[]
  rows: string[][]
  compact?: boolean
}) {
  const cellClass = cn(
    'border border-navy-200/80 px-3 py-2 align-top text-navy-800',
    compact ? 'text-[11px]' : 'text-xs'
  )
  const headerClass = cn(cellClass, 'bg-navy-50 font-semibold text-navy-900')

  const copyRows = [headers, ...rows]

  return (
    <CopyableTable copyRows={copyRows} headerRow compact={compact}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} className={headerClass}>
                  {renderInline(header, `md-h-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="bg-white even:bg-navy-50/40">
                {row.map((cell, ci) => (
                  <td key={ci} className={cellClass}>
                    {renderMultiline(cell, `md-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CopyableTable>
  )
}

function TextBlocks({ content, compact }: { content: string; compact?: boolean }) {
  const blocks = parseBlocks(content)
  if (blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'h') {
          const headingClass =
            block.level === 1
              ? 'text-base font-semibold text-navy-900'
              : block.level === 2
                ? 'text-[15px] font-semibold text-navy-900'
                : 'pt-0.5 text-[13px] font-semibold text-navy-900'
          return (
            <p key={i} className={headingClass}>
              {renderInline(block.text, `h-${i}`)}
            </p>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="ml-1 list-disc space-y-2 pl-4 marker:text-teal-600">
              {block.items.map((item, j) => (
                <li key={j}>{renderListItem(item, `ul-${i}-${j}`, compact)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="ml-1 list-decimal space-y-3 pl-4 marker:font-semibold marker:text-teal-700">
              {block.items.map((item, j) => (
                <li key={j} className="pl-1">
                  {renderListItem(item, `ol-${i}-${j}`, compact)}
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="text-navy-800">
            {renderInline(block.text, `p-${i}`)}
          </p>
        )
      })}
    </>
  )
}

interface ChatMessageBodyProps {
  content: string
  compact?: boolean
}

export function ChatMessageBody({ content, compact }: ChatMessageBodyProps) {
  const segments = splitContentSegments(content)

  return (
    <div
      className={cn(
        'space-y-3 leading-relaxed text-navy-800',
        compact ? 'text-xs' : 'text-sm'
      )}
    >
      {segments.map((segment, i) => {
        if (segment.type === 'html-table') {
          return <BoardTable key={i} rows={segment.rows} compact={compact} />
        }
        if (segment.type === 'markdown-table') {
          return (
            <MarkdownTable
              key={i}
              headers={segment.headers}
              rows={segment.rows}
              compact={compact}
            />
          )
        }
        return <TextBlocks key={i} content={segment.content} compact={compact} />
      })}
    </div>
  )
}
