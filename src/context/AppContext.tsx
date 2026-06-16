import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type {
  UserRole,
  Screen,
  ChatMessage,
  ChatHealth,
  PrivateNote,
  PrivateWorkspace,
  WorkspaceFolder,
  WorkspaceItem,
  SavedAIAnswer,
  SavedCitation,
  DraftQuestion,
  ReviewStatus,
  ActionStatus,
} from '@/types'
import {
  meeting,
  secretariatReviewItems as initialReviewItems,
  actions as initialActions,
  STRATEGIC_AGENDA_ID,
  DEFAULT_WORKSPACE_ID,
  initialPrivateWorkspaces,
  initialWorkspaceFolders,
  initialWorkspaceItems,
  documents,
  getCitationById,
  getDocumentById,
} from '@/data/mockData'
import { fetchChatHealth, sendChatToAgent } from '@/lib/chatApi'

interface AppContextValue {
  role: UserRole
  setRole: (role: UserRole) => void
  screen: Screen
  setScreen: (screen: Screen) => void
  selectedMeetingId: string
  selectedAgendaItemId: string
  setSelectedAgendaItemId: (id: string) => void
  selectedDocumentId: string
  setSelectedDocumentId: (id: string) => void
  selectedDocumentPage: number
  setSelectedDocumentPage: (page: number) => void
  selectedDecisionId: string | null
  setSelectedDecisionId: (id: string | null) => void
  selectedActionId: string | null
  setSelectedActionId: (id: string | null) => void
  selectedCitationId: string | null
  setSelectedCitationId: (id: string | null) => void
  aiFreeMode: boolean
  setAiFreeMode: (enabled: boolean) => void
  aiEnabledByAgenda: Record<string, boolean>
  setAiEnabledForAgenda: (agendaId: string, enabled: boolean) => void
  restrictedSession: boolean
  chatMessages: ChatMessage[]
  sendChatMessage: (content: string, scope: string) => void
  chatHealth: ChatHealth
  refreshChatHealth: () => Promise<void>
  chatScope: string
  setChatScope: (scope: string) => void
  privateNotes: PrivateNote[]
  addPrivateNote: (content: string, source?: string) => void
  privateWorkspaces: PrivateWorkspace[]
  workspaceFolders: WorkspaceFolder[]
  workspaceItems: WorkspaceItem[]
  activeWorkspaceId: string
  activeFolderId: string | null
  setActiveWorkspaceId: (id: string) => void
  setActiveFolderId: (id: string | null) => void
  createPrivateWorkspace: (name: string, notes?: string) => void
  updateWorkspaceNotes: (workspaceId: string, notes: string) => void
  createWorkspaceFolder: (workspaceId: string, name: string) => void
  addWorkspaceNote: (folderId: string, title: string, content: string, source?: string) => void
  addWorkspaceDocument: (folderId: string, documentId: string) => void
  addWorkspaceFile: (folderId: string, file: { fileName: string; fileType: string; fileSize: string }) => void
  deleteWorkspaceItem: (itemId: string) => void
  savedAnswers: SavedAIAnswer[]
  saveAIAnswer: (question: string, answer: string, citationIds: string[]) => void
  savedCitations: SavedCitation[]
  saveCitation: (citationId: string, note?: string) => void
  draftQuestions: DraftQuestion[]
  addDraftQuestion: (question: string) => void
  reviewItems: typeof initialReviewItems
  updateReviewStatus: (id: string, status: ReviewStatus) => void
  actionItems: typeof initialActions
  updateActionStatus: (id: string, status: ActionStatus) => void
  showComparisonModal: boolean
  setShowComparisonModal: (show: boolean) => void
  showReviewPreview: string | null
  setShowReviewPreview: (id: string | null) => void
  navigateToBoardPack: (agendaItemId?: string) => void
  navigateToMeetings: () => void
  navigateToCitation: (citationId: string) => void
  toast: string | null
  showToast: (message: string) => void
  canAccess: (feature: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('board_member')
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState(STRATEGIC_AGENDA_ID)
  const [selectedDocumentId, setSelectedDocumentId] = useState('doc-1')
  const [selectedDocumentPage, setSelectedDocumentPage] = useState(1)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null)
  const [aiFreeMode, setAiFreeMode] = useState(false)
  const [aiEnabledByAgenda, setAiEnabledByAgenda] = useState<Record<string, boolean>>({
    'agenda-1': true,
    'agenda-2': true,
    'agenda-3': true,
  })
  const [restrictedSession] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatHealth, setChatHealth] = useState<ChatHealth>({ provider: 'unknown', configured: false })
  const [chatScope, setChatScope] = useState('Current agenda item')
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([
    {
      id: 'note-1',
      content: 'Need to compare vendor concentration with 2025 cloud programme before meeting.',
      createdAt: '2026-06-03T14:00:00',
    },
  ])
  const [privateWorkspaces, setPrivateWorkspaces] = useState<PrivateWorkspace[]>(initialPrivateWorkspaces)
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>(initialWorkspaceFolders)
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>(initialWorkspaceItems)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(DEFAULT_WORKSPACE_ID)
  const [activeFolderId, setActiveFolderId] = useState<string | null>('folder-notes')
  const [savedAnswers, setSavedAnswers] = useState<SavedAIAnswer[]>([])
  const [savedCitations, setSavedCitations] = useState<SavedCitation[]>([])
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      id: 'q-1',
      question: 'What cyber dependencies must be resolved before implementation?',
      agendaItemId: STRATEGIC_AGENDA_ID,
      createdAt: '2026-06-03T10:00:00',
    },
  ])
  const [reviewItems, setReviewItems] = useState(initialReviewItems)
  const [actionItems, setActionItems] = useState(initialActions)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [showReviewPreview, setShowReviewPreview] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const setAiEnabledForAgenda = useCallback((agendaId: string, enabled: boolean) => {
    setAiEnabledByAgenda((prev) => ({ ...prev, [agendaId]: enabled }))
  }, [])

  const refreshChatHealth = useCallback(async () => {
    const health = await fetchChatHealth()
    setChatHealth(health)
  }, [])

  useEffect(() => {
    refreshChatHealth()
  }, [refreshChatHealth])

  const sendChatMessage = useCallback(
    (content: string, scope: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        scope,
      }
      const loadingMsg: ChatMessage = {
        id: `msg-${Date.now()}-loading`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        loading: true,
      }
      setChatMessages((prev) => [...prev, userMsg, loadingMsg])

      const history = chatMessages
        .filter((m) => !m.loading && m.scope === scope)
        .slice(-10)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      sendChatToAgent({ message: content, scope, history })
        .then((response) => {
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-response`,
            role: 'assistant',
            content: response.answer,
            timestamp: new Date().toISOString(),
            scope,
            priorDecisions: response.priorDecisions,
            conditions: response.conditions,
            citationIds: response.citationIds,
            confidence: response.confidence,
            provider: response.provider === 'unknown' ? 'mock' : response.provider,
            toolPlan: response.toolPlan,
          }
          setChatMessages((prev) => [...prev.filter((m) => !m.loading), assistantMsg])
        })
        .catch((error) => {
          console.error('Chat error:', error)
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-error`,
            role: 'assistant',
            content: 'Unable to reach the Board AI agent. Check that the chat server is running (`npm run dev:server`) and your Cohere North credentials are configured.',
            timestamp: new Date().toISOString(),
            scope,
            provider: 'mock',
            confidence: 'Error',
          }
          setChatMessages((prev) => [...prev.filter((m) => !m.loading), assistantMsg])
        })
    },
    [chatMessages]
  )

  const getSaveFolderId = useCallback(
    (workspaceId: string, preferSavedFromBoard?: boolean) => {
      const folders = workspaceFolders.filter((f) => f.workspaceId === workspaceId)
      if (preferSavedFromBoard) {
        const saved = folders.find((f) => f.name === 'Saved from Board')
        if (saved) return saved.id
      }
      const notes = folders.find((f) => f.name === 'Preparation Notes')
      return notes?.id ?? folders[0]?.id ?? ''
    },
    [workspaceFolders]
  )

  const createPrivateWorkspace = useCallback(
    (name: string, notes = '') => {
      const id = `ws-${Date.now()}`
      const now = new Date().toISOString()
      const folderBase = Date.now()
      const defaultFolders: WorkspaceFolder[] = [
        { id: `folder-${folderBase}-notes`, workspaceId: id, name: 'Preparation Notes', createdAt: now },
        { id: `folder-${folderBase}-docs`, workspaceId: id, name: 'Reference Documents', createdAt: now },
        { id: `folder-${folderBase}-files`, workspaceId: id, name: 'Uploaded Files', createdAt: now },
        { id: `folder-${folderBase}-saved`, workspaceId: id, name: 'Saved from Board', createdAt: now },
      ]
      setPrivateWorkspaces((prev) => [
        { id, name, notes, createdAt: now, updatedAt: now },
        ...prev,
      ])
      setWorkspaceFolders((prev) => [...defaultFolders, ...prev])
      setActiveWorkspaceId(id)
      setActiveFolderId(defaultFolders[0].id)
      showToast('Private workspace created')
    },
    [showToast]
  )

  const updateWorkspaceNotes = useCallback(
    (workspaceId: string, notes: string) => {
      setPrivateWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId ? { ...w, notes, updatedAt: new Date().toISOString() } : w
        )
      )
    },
    []
  )

  const createWorkspaceFolder = useCallback(
    (workspaceId: string, name: string) => {
      const id = `folder-${Date.now()}`
      setWorkspaceFolders((prev) => [
        { id, workspaceId, name, createdAt: new Date().toISOString() },
        ...prev,
      ])
      setActiveFolderId(id)
      showToast('Folder created')
    },
    [showToast]
  )

  const addWorkspaceNote = useCallback(
    (folderId: string, title: string, content: string, source?: string) => {
      const folder = workspaceFolders.find((f) => f.id === folderId)
      if (!folder) return
      const now = new Date().toISOString()
      setWorkspaceItems((prev) => [
        {
          id: `item-${Date.now()}`,
          workspaceId: folder.workspaceId,
          folderId,
          type: 'note',
          title,
          content,
          source,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ])
      showToast('Note saved')
    },
    [workspaceFolders, showToast]
  )

  const addWorkspaceDocument = useCallback(
    (folderId: string, documentId: string) => {
      const folder = workspaceFolders.find((f) => f.id === folderId)
      const doc = getDocumentById(documentId)
      if (!folder || !doc) return
      const now = new Date().toISOString()
      setWorkspaceItems((prev) => [
        {
          id: `item-${Date.now()}`,
          workspaceId: folder.workspaceId,
          folderId,
          type: 'document',
          title: doc.title,
          documentId,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ])
      showToast('Document added to workspace')
    },
    [workspaceFolders, showToast]
  )

  const addWorkspaceFile = useCallback(
    (folderId: string, file: { fileName: string; fileType: string; fileSize: string }) => {
      const folder = workspaceFolders.find((f) => f.id === folderId)
      if (!folder) return
      const now = new Date().toISOString()
      setWorkspaceItems((prev) => [
        {
          id: `item-${Date.now()}`,
          workspaceId: folder.workspaceId,
          folderId,
          type: 'file',
          title: file.fileName,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ])
      showToast('File added to workspace')
    },
    [workspaceFolders, showToast]
  )

  const deleteWorkspaceItem = useCallback(
    (itemId: string) => {
      setWorkspaceItems((prev) => prev.filter((i) => i.id !== itemId))
      showToast('Item removed')
    },
    [showToast]
  )

  const addPrivateNote = useCallback((content: string, source?: string) => {
    const workspaceId = activeWorkspaceId || DEFAULT_WORKSPACE_ID
    const folderId = getSaveFolderId(workspaceId, !!source)
    const title = content.split('\n')[0].slice(0, 80) || 'Private note'
    addWorkspaceNote(folderId, title, content, source)

    setPrivateNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        source,
      },
      ...prev,
    ])
  }, [activeWorkspaceId, getSaveFolderId, addWorkspaceNote])

  const saveAIAnswer = useCallback(
    (question: string, answer: string, citationIds: string[]) => {
      const folderId = getSaveFolderId(activeWorkspaceId, true)
      addWorkspaceNote(folderId, question, answer, 'Ask Board AI')

      setSavedAnswers((prev) => [
        {
          id: `saved-${Date.now()}`,
          question,
          answer,
          savedAt: new Date().toISOString(),
          citationIds,
        },
        ...prev,
      ])
      showToast('Answer saved to workspace')
    },
    [activeWorkspaceId, getSaveFolderId, addWorkspaceNote, showToast]
  )

  const saveCitation = useCallback(
    (citationId: string, note?: string) => {
      const citation = getCitationById(citationId)
      const docsFolder = workspaceFolders.find(
        (f) => f.workspaceId === activeWorkspaceId && f.name === 'Reference Documents'
      )
      if (citation && docsFolder) {
        addWorkspaceDocument(docsFolder.id, citation.documentId)
      }
      if (note) {
        const folderId = getSaveFolderId(activeWorkspaceId, true)
        addWorkspaceNote(folderId, `Citation note — ${citation?.documentTitle ?? 'Source'}`, note, 'Saved citation')
      }

      setSavedCitations((prev) => [
        {
          id: `sc-${Date.now()}`,
          citationId,
          savedAt: new Date().toISOString(),
          note,
        },
        ...prev,
      ])
      showToast('Citation saved to workspace')
    },
    [activeWorkspaceId, workspaceFolders, addWorkspaceDocument, addWorkspaceNote, getSaveFolderId, showToast]
  )

  const addDraftQuestion = useCallback(
    (question: string) => {
      const folderId = getSaveFolderId(activeWorkspaceId)
      addWorkspaceNote(folderId, 'Draft question', question, 'Meeting prep')

      setDraftQuestions((prev) => [
        {
          id: `dq-${Date.now()}`,
          question,
          agendaItemId: selectedAgendaItemId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      showToast('Question added to workspace')
    },
    [activeWorkspaceId, getSaveFolderId, addWorkspaceNote, selectedAgendaItemId, showToast]
  )

  const updateReviewStatus = useCallback(
    (id: string, status: ReviewStatus) => {
      setReviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
      showToast(`Item ${status.toLowerCase()}`)
    },
    [showToast]
  )

  const updateActionStatus = useCallback(
    (id: string, status: ActionStatus) => {
      setActionItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
      showToast(`Action status updated to ${status}`)
    },
    [showToast]
  )

  const navigateToBoardPack = useCallback((agendaItemId?: string) => {
    if (agendaItemId) setSelectedAgendaItemId(agendaItemId)
    setScreen('board_pack')
  }, [])

  const navigateToCitation = useCallback((citationId: string) => {
    const citation = getCitationById(citationId)
    if (!citation) return

    const doc = documents.find((d) => d.id === citation.documentId)
    if (!doc) return

    const agendaItem = meeting.agendaItems.find((a) => a.documentIds.includes(doc.id))
    if (agendaItem) setSelectedAgendaItemId(agendaItem.id)

    setSelectedDocumentId(doc.id)
    setSelectedDocumentPage(citation.page)
    setSelectedCitationId(citationId)
    setScreen('board_pack')
  }, [])

  const navigateToMeetings = useCallback(() => {
    setScreen('meetings')
  }, [])

  const canAccess = useCallback(
    (feature: string) => {
      switch (feature) {
        case 'chair_controls':
          return role === 'chair'
        case 'secretariat_review':
          return role === 'secretariat' || role === 'chair'
        case 'governance_audit':
          return role === 'governance' || role === 'chair'
        case 'edit_actions':
          return role === 'secretariat'
        case 'toggle_ai_free':
          return role === 'chair'
        case 'approve_ai':
          return role === 'secretariat'
        case 'send_to_secretariat':
          return role === 'board_member' || role === 'chair'
        default:
          return true
      }
    },
    [role]
  )

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        screen,
        setScreen,
        selectedMeetingId: meeting.id,
        selectedAgendaItemId,
        setSelectedAgendaItemId,
        selectedDocumentId,
        setSelectedDocumentId,
        selectedDocumentPage,
        setSelectedDocumentPage,
        selectedDecisionId,
        setSelectedDecisionId,
        selectedActionId,
        setSelectedActionId,
        selectedCitationId,
        setSelectedCitationId,
        aiFreeMode,
        setAiFreeMode,
        aiEnabledByAgenda,
        setAiEnabledForAgenda,
        restrictedSession,
        chatMessages,
        sendChatMessage,
        chatHealth,
        refreshChatHealth,
        chatScope,
        setChatScope,
        privateNotes,
        addPrivateNote,
        privateWorkspaces,
        workspaceFolders,
        workspaceItems,
        activeWorkspaceId,
        activeFolderId,
        setActiveWorkspaceId,
        setActiveFolderId,
        createPrivateWorkspace,
        updateWorkspaceNotes,
        createWorkspaceFolder,
        addWorkspaceNote,
        addWorkspaceDocument,
        addWorkspaceFile,
        deleteWorkspaceItem,
        savedAnswers,
        saveAIAnswer,
        savedCitations,
        saveCitation,
        draftQuestions,
        addDraftQuestion,
        reviewItems,
        updateReviewStatus,
        actionItems,
        updateActionStatus,
        showComparisonModal,
        setShowComparisonModal,
        showReviewPreview,
        setShowReviewPreview,
        navigateToBoardPack,
        navigateToMeetings,
        navigateToCitation,
        toast,
        showToast,
        canAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
