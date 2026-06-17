import { useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import type { ChatMessage } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CitationList } from '@/components/shared/CitationChip'
import { answerReferencesGovernanceRegister } from '@/lib/governanceCitation'
import { AgentQueryProgress } from '@/components/shared/AgentQueryProgress'
import { ChatMessageBody } from '@/components/shared/ChatMessageBody'
import { providerLabel } from '@/lib/chatApi'
import { Bot, Bookmark, Shield, User } from 'lucide-react'

interface BoardChatMessagesProps {
  messages: ChatMessage[]
  compact?: boolean
  suggestedPrompts?: string[]
  onPromptClick?: (prompt: string) => void
  promptsDisabled?: boolean
  onSaveAnswer?: (question: string, answer: string, citationIds: string[]) => void
  onOpenDecision?: () => void
  onSendToSecretariat?: () => void
  onCitationClick?: (citationId: string) => void
  showActions?: boolean
}

export function BoardChatMessages({
  messages,
  compact = false,
  suggestedPrompts,
  onPromptClick,
  promptsDisabled = false,
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
        <div className={`mb-3 flex items-center justify-center rounded-full bg-du-purple-900 shadow-md ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
          <Bot className={compact ? 'h-5 w-5 text-white' : 'h-6 w-6 text-white'} />
        </div>
        <p className={`font-medium text-navy-800 ${compact ? 'text-xs' : 'text-sm'}`}>Board AI Assistant</p>
        <p className={`mt-1 leading-relaxed text-navy-500 ${compact ? 'max-w-[220px] text-[11px]' : 'max-w-md text-xs'}`}>
          Ask about this agenda item, prior decisions, or risks. Responses are source-cited.
        </p>
        {suggestedPrompts && suggestedPrompts.length > 0 && onPromptClick && (
          <div className={`mt-4 flex flex-wrap justify-center gap-2 ${compact ? 'max-w-full' : 'max-w-lg'}`}>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={promptsDisabled}
                onClick={() => onPromptClick(prompt)}
                className={
                  compact
                    ? 'rounded-full border border-du-purple-200 bg-white px-2 py-0.5 text-[10px] text-du-purple-700 transition-colors hover:border-du-magenta-300 hover:bg-du-magenta-50 disabled:opacity-40'
                    : 'rounded-full border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-600 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 disabled:opacity-50'
                }
              >
                {compact && prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt}
              </button>
            ))}
          </div>
        )}
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
              <AgentQueryProgress compact={compact} />
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
                <ChatMessageBody content={msg.content} compact={compact} />
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
                    <p className="mb-1 text-[10px] font-semibold uppercase text-navy-400">
                      {answerReferencesGovernanceRegister(msg.content)
                        ? 'Sources — click to open register'
                        : 'Sources — click to open document'}
                    </p>
                    <CitationList
                      citationIds={msg.citationIds}
                      citations={msg.citations}
                      answerContent={msg.content}
                      onCitationClick={handleCitationClick}
                    />
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
