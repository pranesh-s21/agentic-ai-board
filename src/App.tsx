import { AppProvider, useApp } from '@/context/AppContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardPage } from '@/pages/DashboardPage'
import { MeetingsPage } from '@/pages/MeetingsPage'
import { BoardPackReviewPage } from '@/pages/BoardPackReviewPage'
import { FilesPage } from '@/pages/FilesPage'
import { AskBoardAIPage } from '@/pages/AskBoardAIPage'
import { PrivateWorkspacePage } from '@/pages/PrivateWorkspacePage'
import { DecisionMemoryPage } from '@/pages/DecisionMemoryPage'
import { ActionTrackingPage } from '@/pages/ActionTrackingPage'
import { SecretariatReviewPage } from '@/pages/SecretariatReviewPage'
import { PackPreparationPage } from '@/pages/PackPreparationPage'
import { ChairControlsPage } from '@/pages/ChairControlsPage'
import { GovernancePage } from '@/pages/GovernancePage'
import { NorthDocumentViewer } from '@/components/shared/NorthDocumentViewer'
import { Drawer } from '@/components/ui/Drawer'
import type { Screen } from '@/types'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function ScreenRouter() {
  const { screen } = useApp()

  const pages: Record<Screen, React.ReactNode> = {
    dashboard: <DashboardPage />,
    meetings: <MeetingsPage />,
    pack_preparation: <PackPreparationPage />,
    board_pack: <BoardPackReviewPage />,
    files: <FilesPage />,
    ask_ai: <AskBoardAIPage />,
    private_workspace: <PrivateWorkspacePage />,
    decision_memory: <DecisionMemoryPage />,
    action_tracking: <ActionTrackingPage />,
    secretariat_review: <SecretariatReviewPage />,
    chair_controls: <ChairControlsPage />,
    governance: <GovernancePage />,
  }

  return <>{pages[screen]}</>
}

function Toast() {
  const { toast, screen } = useApp()
  if (!toast) return null

  const isBoardPack = screen === 'board_pack'

  return (
    <div className={`fixed z-50 flex items-center gap-2 rounded-xl border border-du-magenta-200 bg-white px-4 py-3 du-card-shadow-lg ${isBoardPack ? 'bottom-6 left-6' : 'bottom-6 right-6'}`}>
      <CheckCircle2 className="h-5 w-5 text-du-magenta-500" />
      <span className="text-sm font-semibold text-du-purple-900">{toast}</span>
    </div>
  )
}

function NorthDocumentDrawer() {
  const { northDocumentView, setNorthDocumentView } = useApp()
  return (
    <Drawer
      open={!!northDocumentView}
      onClose={() => setNorthDocumentView(null)}
      title="North document"
      className="!max-w-4xl"
    >
      {northDocumentView && (
        <NorthDocumentViewer view={northDocumentView} />
      )}
    </Drawer>
  )
}

function AppLayout() {
  const { screen } = useApp()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className={cn(
            'flex-1 p-5 lg:p-6 scrollbar-thin',
            screen === 'files' ? 'overflow-hidden' : 'overflow-y-auto'
          )}
        >
          <ScreenRouter />
        </main>
      </div>
      <Toast />
      <NorthDocumentDrawer />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  )
}
