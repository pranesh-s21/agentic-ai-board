import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { defaultChatPrompts } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { BoardChatMessages } from '@/components/shared/BoardChatMessages'
import { ChatProviderStatus } from '@/components/shared/ChatProviderStatus'
import { Bot, Send, Ban } from 'lucide-react'

const scopes = ['Current agenda item', 'Current Board pack', 'Board archive', 'Decision Memory']

export function AskBoardAIPage() {
  const {
    chatMessages,
    sendChatMessage,
    chatScope,
    setChatScope,
    aiFreeMode,
    saveAIAnswer,
    showToast,
    setSelectedDecisionId,
    setScreen,
    navigateToCitation,
  } = useApp()

  const [input, setInput] = useState('')
  const isDisabled = aiFreeMode && chatScope === 'Current agenda item'
  const isQuerying = chatMessages.some((m) => m.loading)

  const handleSend = () => {
    if (!input.trim() || isDisabled || isQuerying) return
    sendChatMessage(input.trim(), chatScope)
    setInput('')
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full flex-col">
      <Card className="mb-4 border-navy-200/80 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-du-purple-900 shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-navy-900">Ask Board AI</p>
              <p className="text-xs text-navy-500">Full workspace for cross-pack queries</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Select value={chatScope} onChange={(e) => setChatScope(e.target.value)} className="w-52">
              {scopes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <ChatProviderStatus />
            <Badge variant="cited">Source-Cited</Badge>
          </div>
        </CardContent>
      </Card>

      {isDisabled && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Ban className="h-5 w-5 text-amber-700" />
          <p className="text-sm font-medium text-amber-800">
            AI-Free Mode is enabled for the Strategic Network Investment Programme agenda item.
          </p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-navy-200/80 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <BoardChatMessages
            messages={chatMessages}
            suggestedPrompts={defaultChatPrompts}
            onPromptClick={(prompt) => sendChatMessage(prompt, chatScope)}
            promptsDisabled={isDisabled || isQuerying}
            onSaveAnswer={saveAIAnswer}
            onCitationClick={(id) => navigateToCitation(id)}
            onSendToSecretariat={() => showToast('Sent to Secretariat')}
            onOpenDecision={() => {
              setSelectedDecisionId('decision-2')
              setScreen('decision_memory')
            }}
          />
        </div>

        <div className="border-t border-navy-100 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isDisabled ? 'AI queries disabled for this agenda item' : isQuerying ? 'Briefing note in preparation…' : 'Ask about prior decisions, conditions, or risks...'}
              disabled={isDisabled || isQuerying}
              className="flex-1 shadow-sm"
            />
            <Button onClick={handleSend} disabled={isDisabled || isQuerying || !input.trim()} className="shadow-sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
