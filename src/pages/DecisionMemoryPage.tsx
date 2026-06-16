import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { priorDecisions, comparisonPoints } from '@/data/mockData'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Drawer'
import { GitCompare, Search, Shield } from 'lucide-react'

export function DecisionMemoryPage() {
  const { selectedDecisionId, setSelectedDecisionId, showComparisonModal, setShowComparisonModal } = useApp()
  const [search, setSearch] = useState('')
  const [committeeFilter, setCommitteeFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = priorDecisions.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.decisionText.toLowerCase().includes(search.toLowerCase())
    const matchesCommittee = committeeFilter === 'all' || d.committee === committeeFilter
    const matchesTopic = topicFilter === 'all' || d.topic === topicFilter
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    return matchesSearch && matchesCommittee && matchesTopic && matchesStatus
  })

  const selected = priorDecisions.find((d) => d.id === selectedDecisionId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="pl-9"
          />
        </div>
        <Select value={committeeFilter} onChange={(e) => setCommitteeFilter(e.target.value)} className="w-44">
          <option value="all">All Committees</option>
          <option value="Board of Directors">Board of Directors</option>
        </Select>
        <Select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="w-44">
          <option value="all">All Topics</option>
          <option value="Network Investment">Network Investment</option>
          <option value="Cloud Infrastructure">Cloud Infrastructure</option>
          <option value="Cyber Security">Cyber Security</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All Status</option>
          <option value="Approved">Approved</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-navy-200 py-16 text-center">
          <p className="text-sm text-navy-500">No decisions match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-muted bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-muted bg-navy-50">
              <tr>
                <th className="px-4 py-3 font-medium text-navy-700">Title</th>
                <th className="px-4 py-3 font-medium text-navy-700">Date</th>
                <th className="px-4 py-3 font-medium text-navy-700">Committee</th>
                <th className="px-4 py-3 font-medium text-navy-700">Topic</th>
                <th className="px-4 py-3 font-medium text-navy-700">Status</th>
                <th className="px-4 py-3 font-medium text-navy-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((decision) => (
                <tr key={decision.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="px-4 py-3 font-medium text-navy-900">{decision.title}</td>
                  <td className="px-4 py-3 text-navy-600">{formatDate(decision.date)}</td>
                  <td className="px-4 py-3 text-navy-600">{decision.committee}</td>
                  <td className="px-4 py-3 text-navy-600">{decision.topic}</td>
                  <td className="px-4 py-3">
                    <Badge variant="official">{decision.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDecisionId(decision.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!selectedDecisionId}
        onClose={() => setSelectedDecisionId(null)}
        title={selected?.title ?? 'Decision Detail'}
        width="xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="official"><Shield className="mr-1 h-3 w-3" /> Official Record</Badge>
              <Badge variant="approved">{selected.status}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Decision</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-800">{selected.decisionText}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Conditions</p>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                {selected.conditions.map((c) => (
                  <li key={c} className="text-sm text-navy-700">{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Assumptions</p>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                {selected.assumptions.map((a) => (
                  <li key={a} className="text-sm text-navy-700">{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Linked Actions</p>
              <ul className="mt-1 space-y-1">
                {selected.linkedActions.map((a) => (
                  <li key={a} className="text-sm text-navy-700">• {a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Source Papers</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {selected.sourcePapers.map((p) => (
                  <Badge key={p} variant="cited">{p}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Approval History</p>
              <div className="mt-2 space-y-2">
                {selected.approvalHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-navy-100 p-2 text-sm">
                    <span className="text-navy-700">{h.action}</span>
                    <span className="text-navy-500">{h.approver} · {formatDate(h.date)}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowComparisonModal(true)}>
              <GitCompare className="h-4 w-4" /> Compare with current proposal
            </Button>
          </div>
        )}
      </Drawer>

      <Modal
        open={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        title="Compare with Current Proposal"
        size="xl"
      >
        <p className="mb-4 text-sm text-navy-600">
          Two prior decisions are relevant: the 2024 Network Expansion Approval, which required phased capex release, and the 2025 Cloud Infrastructure Investment, which required quarterly risk reporting and independent vendor risk review.
        </p>
        <div className="overflow-hidden rounded-lg border border-border-muted">
          <table className="w-full text-sm">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-navy-700">Aspect</th>
                <th className="px-4 py-2 text-left font-medium text-navy-700">Current Proposal</th>
                <th className="px-4 py-2 text-left font-medium text-navy-700">Prior Precedent</th>
              </tr>
            </thead>
            <tbody>
              {comparisonPoints.map((row) => (
                <tr key={row.aspect} className="border-t border-navy-100">
                  <td className="px-4 py-2 font-medium text-navy-800">{row.aspect}</td>
                  <td className="px-4 py-2 text-navy-700">{row.current}</td>
                  <td className="px-4 py-2 text-navy-600">{row.prior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}
