import { useApp } from '@/context/AppContext'
import { providerLabel } from '@/lib/chatApi'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export function ChatProviderStatus({ className }: { className?: string }) {
  const { chatHealth, refreshChatHealth } = useApp()
  const live = chatHealth.configured && chatHealth.provider !== 'mock' && chatHealth.provider !== 'unknown'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={live ? 'approved' : chatHealth.provider === 'mock' ? 'pending' : 'muted'} className="gap-1">
        {live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {providerLabel(chatHealth.provider)}
      </Badge>
      {chatHealth.model && chatHealth.provider === 'cohere' && (
        <span className="text-[10px] text-navy-500">{chatHealth.model}</span>
      )}
      {chatHealth.northAgentId && chatHealth.provider === 'north' && (
        <span className="text-[10px] text-navy-500 truncate max-w-[120px]">Agent {chatHealth.northAgentId}</span>
      )}
      <button
        type="button"
        onClick={() => refreshChatHealth()}
        className="rounded p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
        title="Refresh connection"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
