import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { defaultChatPrompts } from '@/data/mockData'
import { meeting } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BoardChatMessages } from '@/components/shared/BoardChatMessages'
import { ChatProviderStatus } from '@/components/shared/ChatProviderStatus'
import { cn } from '@/lib/utils'
import { Bot, X, Send, Minimize2, Ban, Sparkles } from 'lucide-react'

interface BoardAIChatWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Context label shown in header, e.g. agenda item title */
  contextLabel?: string
  /** Force scope to current agenda item when embedded in board pack */
  embedded?: boolean
  className?: string
  onCitationClick?: (citationId: string) => void
}

export function BoardAIChatWidget({
  open,
  onOpenChange,
  contextLabel,
  embedded = true,
  className,
  onCitationClick,
}: BoardAIChatWidgetProps) {
  const {
    chatMessages,
    sendChatMessage,
    chatScope,
    setChatScope,
    aiFreeMode,
    selectedAgendaItemId,
    saveAIAnswer,
    showToast,
    setSelectedDecisionId,
    setScreen,
    navigateToCitation,
  } = useApp()

  const [input, setInput] = useState('')
  const [minimized, setMinimized] = useState(false)

  const agendaItem = meeting.agendaItems.find((a) => a.id === selectedAgendaItemId)
  const scope = embedded ? 'Current agenda item' : chatScope
  const isDisabled = aiFreeMode && selectedAgendaItemId === 'agenda-1' && embedded

  useEffect(() => {
    if (embedded && open) {
      setChatScope('Current agenda item')
    }
  }, [embedded, open, setChatScope])

  const handleSend = () => {
    if (!input.trim() || isDisabled) return
    sendChatMessage(input.trim(), scope)
    setInput('')
  }

  const handleCitationClick = (citationId: string) => {
    if (onCitationClick) {
      onCitationClick(citationId)
    } else {
      navigateToCitation(citationId)
      onOpenChange(false)
    }
  }

  const headerLabel = contextLabel ?? agendaItem?.title ?? 'Board AI'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-du-magenta-600 text-white du-card-shadow-lg transition-all hover:scale-105 hover:bg-du-magenta-700 hover:shadow-2xl',
          isDisabled && 'opacity-60',
          className
        )}
        title={isDisabled ? 'AI-Free Mode active' : 'Ask Board AI'}
      >
        <Bot className="h-6 w-6" />
        {!isDisabled && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-du-cyan-400">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden rounded-2xl border border-du-purple-200 bg-white du-card-shadow-lg transition-all',
        minimized ? 'h-14 w-80' : 'h-[min(560px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))]',
        className
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-du-purple-900 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Ask Board AI</p>
            <p className="truncate text-[11px] font-medium text-white/90">{headerLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMinimized((m) => !m)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {isDisabled && (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2">
              <Ban className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] font-medium text-amber-800">AI-Free Mode — follow-up disabled</p>
            </div>
          )}

          <div className="shrink-0 border-b border-du-purple-100 bg-du-purple-50/50 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {defaultChatPrompts.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => sendChatMessage(prompt, scope)}
                  className="rounded-full border border-du-purple-200 bg-white px-2 py-0.5 text-[10px] text-du-purple-700 transition-colors hover:border-du-magenta-300 hover:bg-du-magenta-50 disabled:opacity-40"
                >
                  {prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt}
                </button>
              ))}
            </div>
            <Badge variant="cited" className="mt-1.5 text-[10px]">Source-Cited · {scope}</Badge>
            <div className="mt-1.5">
              <ChatProviderStatus />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-du-purple-50/30 px-3 py-3 scrollbar-thin">
            <BoardChatMessages
              messages={chatMessages}
              compact
              showActions={false}
              onCitationClick={handleCitationClick}
              onSaveAnswer={saveAIAnswer}
              onSendToSecretariat={() => showToast('Sent to Secretariat')}
              onOpenDecision={() => {
                setSelectedDecisionId('decision-2')
                setScreen('decision_memory')
                onOpenChange(false)
              }}
            />
          </div>

          <div className="shrink-0 border-t border-navy-100 bg-white p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isDisabled ? 'AI disabled for this item' : 'Ask a follow-up question...'}
                disabled={isDisabled}
                className="h-9 flex-1 text-sm"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isDisabled || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
