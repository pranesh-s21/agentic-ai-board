import { useApp } from '@/context/AppContext'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CitationList } from '@/components/shared/CitationChip'
import { Modal } from '@/components/ui/Drawer'
import { Check, X, Edit, Send, Eye, Lock } from 'lucide-react'
import type { ReviewStatus } from '@/types'

export function SecretariatReviewPage() {
  const { reviewItems, updateReviewStatus, showReviewPreview, setShowReviewPreview, canAccess, role } = useApp()

  const previewItem = reviewItems.find((r) => r.id === showReviewPreview)

  if (!canAccess('secretariat_review') && role !== 'secretariat') {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-20">
        <Lock className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-red-800">Restricted</p>
        <p className="mt-1 text-sm text-red-600">Secretariat Review is available to Secretariat and Chair roles only.</p>
      </div>
    )
  }

  const handleAction = (id: string, status: ReviewStatus) => {
    updateReviewStatus(id, status)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="pending">Pending Secretariat Review</Badge>
        <span className="text-sm text-navy-500">
          {reviewItems.filter((r) => r.status === 'Pending Review').length} items awaiting review
        </span>
      </div>

      <div className="grid gap-4">
        {reviewItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="ai">AI-Assisted Draft</Badge>
                    <Badge variant={item.status === 'Approved' ? 'approved' : item.status === 'Rejected' ? 'danger' : 'pending'}>
                      {item.status}
                    </Badge>
                    <Badge variant="muted">{item.version}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowReviewPreview(item.id)}>
                  <Eye className="h-4 w-4" /> Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-navy-700 whitespace-pre-line">{item.content}</p>
              <CitationList citationIds={item.citationIds} />
              <div className="rounded-md bg-navy-50 p-3">
                <p className="text-xs font-medium uppercase text-navy-400">Version History</p>
                <ul className="mt-1 space-y-1">
                  {item.versionHistory.map((v) => (
                    <li key={v} className="text-xs text-navy-600">{v}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-navy-400">Created {formatDateTime(item.createdAt)}</p>
              {item.status === 'Pending Review' && canAccess('approve_ai') && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleAction(item.id, 'Approved')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction(item.id, 'Draft')}>
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleAction(item.id, 'Rejected')}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button variant="teal" size="sm" onClick={() => handleAction(item.id, 'Published')}>
                    <Send className="h-4 w-4" /> Publish
                  </Button>
                </div>
              )}
              {item.status === 'Approved' && (
                <Badge variant="official">Approved — Ready for Board Pack</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={!!showReviewPreview}
        onClose={() => setShowReviewPreview(null)}
        title={previewItem?.title ?? 'Preview'}
        size="lg"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="ai">AI-Assisted Draft</Badge>
              <Badge variant="pending">Pending Secretariat Review</Badge>
            </div>
            <p className="text-sm leading-relaxed text-navy-800 whitespace-pre-line">{previewItem.content}</p>
            <CitationList citationIds={previewItem.citationIds} />
            {canAccess('approve_ai') && previewItem.status === 'Pending Review' && (
              <div className="flex gap-2 pt-4">
                <Button onClick={() => { handleAction(previewItem.id, 'Approved'); setShowReviewPreview(null) }}>
                  Approve
                </Button>
                <Button variant="outline" onClick={() => setShowReviewPreview(null)}>Close</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
