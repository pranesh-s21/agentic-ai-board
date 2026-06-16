import { useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import type { ChatMessage } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CitationList } from '@/components/shared/CitationChip'
import { providerLabel } from '@/lib/chatApi'
import { Bot, Bookmark, Loader2, Shield, User } from 'lucide-react'

interface BoardChatMessagesProps {
  messages: ChatMessage[]
  compact?: boolean
  onSaveAnswer?: (question: string, answer: string, citationIds: string[]) => void
  onOpenDecision?: () => void
  onSendToSecretariat?: () => void
  onCitationClick?: (citationId: string) => void
  showActions?: boolean
}

export function BoardChatMessages({
  messages,
  compact = false,
  onSaveAnswer,
  onOpenDecision,
  onSendToSecretariat,
  onCitationClick,
  showActions = true,
}: BoardChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { canAccess, navigateToCitation } = useApp()
  const handleCitationClick = onCitationClick ?? navigateToCitation

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-du-purple-900 shadow-md">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm font-medium text-navy-800">Board AI Assistant</p>
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-navy-500">
          Ask about this agenda item, prior decisions, or risks. Responses are source-cited.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, idx) => (
        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
          {msg.role === 'assistant' && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <Bot className="h-3.5 w-3.5 text-violet-700" />
            </div>
          )}
          <div className={`max-w-[88%] ${msg.role === 'user' ? 'order-first' : ''}`}>
            {msg.loading ? (
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-navy-100 bg-white px-3 py-2.5 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                <span className="text-xs text-navy-500">Querying agent…</span>
              </div>
            ) : msg.role === 'user' ? (
              <div className="rounded-2xl rounded-tr-sm bg-du-purple-900 px-3 py-2 text-sm text-white shadow-sm">
                {msg.content}
              </div>
            ) : (
              <div className="rounded-2xl rounded-tl-sm border border-navy-100 bg-white px-3 py-2.5 shadow-sm">
                <div className="mb-1.5 flex flex-wrap gap-1">
                  <Badge variant="ai" className="text-[10px] px-1.5 py-0">AI-Assisted</Badge>
                  {msg.provider && (
                    <Badge variant="cited" className="text-[10px] px-1.5 py-0">{providerLabel(msg.provider)}</Badge>
                  )}
                  {msg.confidence && (
                    <Badge variant="cited" className="text-[10px] px-1.5 py-0">{msg.confidence}</Badge>
                  )}
                </div>
                {msg.toolPlan && (
                  <p className="mb-2 text-[10px] italic text-navy-500 line-clamp-2">{msg.toolPlan}</p>
                )}
                <p className={`leading-relaxed text-navy-800 ${compact ? 'text-xs' : 'text-sm'}`}>{msg.content}</p>
                {msg.priorDecisions && msg.priorDecisions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold uppercase text-navy-400">Prior Decisions</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {msg.priorDecisions.map((d) => (
                        <li key={d} className="text-xs text-teal-700">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {msg.conditions && msg.conditions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold uppercase text-navy-400">Conditions</p>
                    <ul className="mt-0.5 list-disc pl-3">
                      {msg.conditions.map((c) => (
                        <li key={c} className="text-xs text-navy-700">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {msg.citationIds && msg.citationIds.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-navy-400">Sources — click to view in document</p>
                    <CitationList citationIds={msg.citationIds} onCitationClick={handleCitationClick} />
                  </div>
                )}
                {showActions && !compact && (
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-navy-50 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        onSaveAnswer?.(
                          messages[idx - 1]?.content ?? 'Query',
                          msg.content,
                          msg.citationIds ?? []
                        )
                      }
                    >
                      <Bookmark className="h-3 w-3" /> Save
                    </Button>
                    {canAccess('send_to_secretariat') && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSendToSecretariat}>
                        Send to Secretariat
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpenDecision}>
                      <Shield className="h-3 w-3" /> Decision
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          {msg.role === 'user' && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100">
              <User className="h-3.5 w-3.5 text-navy-700" />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
