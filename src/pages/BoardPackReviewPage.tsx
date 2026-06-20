import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { aiInsights, getVersionsForDocument } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { CitationList } from '@/components/shared/CitationChip'
import { BoardAIChatWidget } from '@/components/shared/BoardAIChatWidget'
import { DocumentViewer } from '@/components/board-pack/DocumentViewer'
import { VersionCompareModal } from '@/components/board-pack/VersionCompareModal'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Bot,
  Send,
  Bookmark,
  GitCompare,
  MessageSquare,
  Ban,
  Lock,
  Eye,
} from 'lucide-react'

const insightTabs = [
  { value: 'summary', label: 'Summary', type: 'summary' as const },
  { value: 'decision', label: 'Decision', type: 'decision' as const },
  { value: 'risks', label: 'Risks', type: 'risks' as const },
  { value: 'questions', label: 'Questions', type: 'questions' as const },
  { value: 'inconsistencies', label: 'Gaps', type: 'inconsistencies' as const },
]

const CITATION_PAGES: Record<string, number> = {
  'doc-1': 12,
  'doc-3': 7,
}

export function BoardPackReviewPage() {
  const {
    role,
    selectedAgendaItemId,
    setSelectedAgendaItemId,
    selectedDocumentId,
    setSelectedDocumentId,
    selectedDocumentPage,
    setSelectedDocumentPage,
    selectedCitationId,
    setSelectedCitationId,
    aiFreeMode,
    canAccess,
    isPackPublished,
    activeMeeting,
    packDocuments,
    addPrivateNote,
    submitToSecretariat,
    setScreen,
    setShowComparisonModal,
    navigateToCitation,
  } = useApp()

  const [activeTab, setActiveTab] = useState('summary')
  const [chatOpen, setChatOpen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [versionCompareOpen, setVersionCompareOpen] = useState(false)

  const agendaItem = activeMeeting.agendaItems.find((a) => a.id === selectedAgendaItemId) ?? activeMeeting.agendaItems[0]
  const agendaDocs = packDocuments.filter((d) => agendaItem?.documentIds.includes(d.id))
  const currentDoc = packDocuments.find((d) => d.id === selectedDocumentId) ?? agendaDocs[0]
  const hasVersions = currentDoc ? getVersionsForDocument(currentDoc.id).length >= 2 : false
  const isAiFreeForItem = aiFreeMode && selectedAgendaItemId === 'agenda-1'
  const isSecretariatPreview = role === 'secretariat' && !isPackPublished

  if (role === 'board_member' && !isPackPublished) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-navy-200 bg-white py-24 text-center">
        <Lock className="mb-4 h-12 w-12 text-navy-300" />
        <h2 className="text-lg font-bold text-du-purple-900">Board pack not yet published</h2>
        <p className="mt-2 max-w-md text-sm text-navy-600">
          Secretariat is preparing materials for this meeting. You will be able to review the official pack once it is published to the board.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setScreen('dashboard')}>
          Return to dashboard
        </Button>
      </div>
    )
  }

  if (!agendaItem) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-navy-200 bg-white py-24 text-center">
        <p className="text-sm text-navy-600">No agenda items in this pack yet.</p>
        {role === 'secretariat' && (
          <Button className="mt-4" onClick={() => setScreen('pack_preparation')}>
            Prepare board pack
          </Button>
        )}
      </div>
    )
  }

  const openFollowUp = () => {
    if (!isAiFreeForItem) setChatOpen(true)
  }

  const selectDocument = (docId: string) => {
    setSelectedDocumentId(docId)
    setSelectedDocumentPage(CITATION_PAGES[docId] ?? 1)
    setSelectedCitationId(null)
  }

  const handleCitationFromChat = (citationId: string) => {
    navigateToCitation(citationId)
    setChatOpen(false)
  }

  const renderInsightContent = (type: string) => {
    const insight = aiInsights.find((i) => i.type === type)
    if (!insight) return null

    const content = Array.isArray(insight.content) ? insight.content : [insight.content]

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="ai">AI-Assisted Draft</Badge>
          <Badge variant="cited">Source-Cited</Badge>
        </div>
        {type === 'summary' || type === 'decision' ? (
          <p className="text-sm leading-relaxed text-navy-800">{insight.content as string}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-4">
            {content.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed text-navy-800">{item}</li>
            ))}
          </ol>
        )}
        <CitationList citationIds={insight.citationIds} onCitationClick={navigateToCitation} />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-200 bg-white px-5 py-4 du-card-shadow">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-du-magenta-600">Board Pack Review</p>
          <h2 className="text-lg font-bold text-du-purple-900">{agendaItem.title}</h2>
          <p className="text-xs font-medium text-navy-600">{activeMeeting.title} · {formatDate(activeMeeting.date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="official">Official Record</Badge>
          {isSecretariatPreview && <Badge variant="pending"><Eye className="mr-1 h-3 w-3" /> Secretariat preview</Badge>}
          {agendaItem.decisionRequired && <Badge variant="draft">Decision Required</Badge>}
          {isAiFreeForItem && <Badge variant="restricted">AI-Free Mode</Badge>}
        </div>
      </div>

      {isAiFreeForItem && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <Ban className="h-5 w-5 shrink-0 text-amber-800" />
          <p className="text-sm font-medium text-amber-900">
            AI-Free Mode is enabled for this agenda item. AI follow-up and generative features are disabled.
          </p>
        </div>
      )}

      <div className="flex h-[calc(100vh-11rem)] gap-4 overflow-hidden">
        <div className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy-600">Agenda</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeMeeting.agendaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAgendaItemId(item.id)
                  const firstDoc = packDocuments.find((d) => item.documentIds.includes(d.id))
                  if (firstDoc) selectDocument(firstDoc.id)
                }}
                className={`block w-full border-b border-navy-100 px-4 py-3 text-left transition-colors hover:bg-du-purple-50 ${
                  item.id === selectedAgendaItemId ? 'border-l-[3px] border-l-du-magenta-600 bg-du-magenta-50' : 'border-l-[3px] border-l-transparent'
                }`}
              >
                <p className="text-sm font-semibold text-navy-900 leading-snug">{item.title}</p>
                {item.decisionRequired && (
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase text-du-magenta-700">Decision</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-navy-200 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-navy-600">Documents</p>
            <div className="max-h-48 space-y-0.5 overflow-y-auto scrollbar-thin">
              {agendaDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => selectDocument(doc.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold transition-colors ${
                    doc.id === selectedDocumentId
                      ? 'bg-du-purple-900 text-white'
                      : 'text-navy-800 hover:bg-du-purple-50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
            {hasVersions && (
              <p className="mt-2 text-[10px] font-medium text-navy-600">Version history available</p>
            )}
          </div>
        </div>

        <DocumentViewer
          document={currentDoc}
          page={selectedDocumentPage}
          onPageChange={setSelectedDocumentPage}
          zoom={zoom}
          onZoomChange={setZoom}
          onCompareVersions={() => setVersionCompareOpen(true)}
          highlightedCitationId={selectedCitationId}
          onClearHighlight={() => setSelectedCitationId(null)}
          hasVersions={hasVersions}
        />

        <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-du-purple-900">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-du-purple-900">AI Insights</p>
                <Badge variant="pending" className="mt-0.5 text-[10px]">Pending Secretariat Review</Badge>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-3 h-auto w-full flex-wrap">
                {insightTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-[11px] px-2 py-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {insightTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {renderInsightContent(tab.type)}
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="space-y-1.5 border-t border-navy-200 bg-navy-50 p-3">
            <Button variant="default" size="sm" className="w-full" disabled={isAiFreeForItem} onClick={openFollowUp}>
              <MessageSquare className="h-4 w-4" /> Ask follow-up
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => {
              const insight = aiInsights.find((i) => i.type === activeTab as typeof aiInsights[0]['type']) ?? aiInsights[0]
              addPrivateNote(typeof insight.content === 'string' ? insight.content : insight.content.join('\n'), 'Board Pack Review')
            }}>
              <Bookmark className="h-4 w-4" /> Save to private notes
            </Button>
            {canAccess('send_to_secretariat') && (
              <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => {
                const insight = aiInsights.find((i) => i.type === activeTab as typeof aiInsights[0]['type']) ?? aiInsights[0]
                const content = typeof insight.content === 'string' ? insight.content : insight.content.join('\n')
                submitToSecretariat({
                  title: `Director question — ${agendaItem.title}`,
                  content,
                  type: 'question',
                  citationIds: insight.citationIds,
                })
              }}>
                <Send className="h-4 w-4" /> Send to Secretariat
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => setShowComparisonModal(true)}>
              <GitCompare className="h-4 w-4" /> Compare prior decisions
            </Button>
          </div>
        </div>
      </div>

      <BoardAIChatWidget
        open={chatOpen}
        onOpenChange={setChatOpen}
        contextLabel={agendaItem.title}
        embedded
        onCitationClick={handleCitationFromChat}
      />

      <VersionCompareModal
        open={versionCompareOpen}
        onClose={() => setVersionCompareOpen(false)}
        document={currentDoc}
        page={selectedDocumentPage}
      />
    </>
  )
}
