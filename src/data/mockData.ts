import type {
  Meeting,
  CalendarMeeting,
  Document,
  Citation,
  DocumentVersion,
  AIInsight,
  PriorDecision,
  ActionItem,
  Risk,
  AuditEvent,
  AgentStatus,
  SecretariatReviewItem,
  DocumentPageContent,
  PrivateWorkspace,
  WorkspaceFolder,
  WorkspaceItem,
} from '@/types'

export const MEETING_ID = 'meeting-1'
export const STRATEGIC_AGENDA_ID = 'agenda-1'
export const DEFAULT_WORKSPACE_ID = 'ws-default'

export const meeting: Meeting = {
  id: MEETING_ID,
  title: 'Board Meeting - Strategic Investment Review',
  date: '2026-06-18',
  location: 'Board Room, du HQ',
  status: 'In Preparation',
  agendaItems: [
    {
      id: 'agenda-1',
      title: 'Strategic Network Investment Programme',
      order: 1,
      status: 'In Review',
      decisionRequired: true,
      aiAvailable: true,
      preparationProgress: 78,
      documentIds: ['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-6', 'doc-7'],
    },
    {
      id: 'agenda-2',
      title: 'Cyber Resilience Update',
      order: 2,
      status: 'Ready',
      decisionRequired: false,
      aiAvailable: true,
      preparationProgress: 100,
      documentIds: ['doc-5'],
    },
    {
      id: 'agenda-3',
      title: 'Regulatory Affairs Briefing',
      order: 3,
      status: 'Draft',
      decisionRequired: false,
      aiAvailable: true,
      preparationProgress: 45,
      documentIds: [],
    },
  ],
}

export const calendarMeetings: CalendarMeeting[] = [
  {
    id: 'cal-1',
    title: 'Audit Committee — Cyber Review',
    date: '2026-06-12',
    time: '14:00',
    endTime: '16:00',
    type: 'Committee',
    status: 'Scheduled',
    location: 'Committee Room A',
  },
  {
    id: 'cal-2',
    title: 'Board Preparation Session',
    date: '2026-06-16',
    time: '10:00',
    endTime: '11:30',
    type: 'Preparation',
    status: 'Scheduled',
    location: 'Virtual — Secure Link',
  },
  {
    id: MEETING_ID,
    title: 'Board Meeting - Strategic Investment Review',
    date: '2026-06-18',
    time: '09:00',
    endTime: '13:00',
    type: 'Board',
    status: 'In Preparation',
    location: 'Board Room, du HQ',
  },
  {
    id: 'cal-4',
    title: 'Risk Committee Briefing',
    date: '2026-06-25',
    time: '11:00',
    endTime: '12:30',
    type: 'Committee',
    status: 'Scheduled',
    location: 'Committee Room B',
  },
  {
    id: 'cal-5',
    title: 'Board Follow-up — Investment Conditions',
    date: '2026-07-02',
    time: '09:30',
    endTime: '10:30',
    type: 'Board',
    status: 'Scheduled',
    location: 'Virtual — Secure Link',
  },
]

export const documents: Document[] = [
  { id: 'doc-1', title: 'Main Investment Proposal.pdf', type: 'PDF', pages: 42, agendaItemId: 'agenda-1', versions: ['ver-1a', 'ver-1b'] },
  { id: 'doc-2', title: 'Financial Model Summary.xlsx', type: 'XLSX', pages: 12, agendaItemId: 'agenda-1' },
  { id: 'doc-3', title: 'Risk Assessment.pdf', type: 'PDF', pages: 18, agendaItemId: 'agenda-1', versions: ['ver-3a', 'ver-3b'] },
  { id: 'doc-4', title: 'Legal Note.pdf', type: 'PDF', pages: 8, agendaItemId: 'agenda-1' },
  { id: 'doc-5', title: 'Cybersecurity Assessment.pdf', type: 'PDF', pages: 24, agendaItemId: 'agenda-2' },
  { id: 'doc-6', title: 'Vendor Comparison.pptx', type: 'PPTX', pages: 16, agendaItemId: 'agenda-1' },
  { id: 'doc-7', title: 'Prior Board Decisions Extract.pdf', type: 'PDF', pages: 6, agendaItemId: 'agenda-1' },
]

export const initialPrivateWorkspaces: PrivateWorkspace[] = [
  {
    id: DEFAULT_WORKSPACE_ID,
    name: 'June 2026 Board Meeting',
    notes: 'Private preparation for the Strategic Network Investment Programme decision. Compare vendor concentration with the 2025 cloud programme.',
    createdAt: '2026-06-01T09:00:00',
    updatedAt: '2026-06-03T14:00:00',
  },
]

export const initialWorkspaceFolders: WorkspaceFolder[] = [
  { id: 'folder-notes', workspaceId: DEFAULT_WORKSPACE_ID, name: 'Preparation Notes', createdAt: '2026-06-01T09:00:00' },
  { id: 'folder-docs', workspaceId: DEFAULT_WORKSPACE_ID, name: 'Reference Documents', createdAt: '2026-06-01T09:00:00' },
  { id: 'folder-files', workspaceId: DEFAULT_WORKSPACE_ID, name: 'Uploaded Files', createdAt: '2026-06-01T09:00:00' },
  { id: 'folder-saved', workspaceId: DEFAULT_WORKSPACE_ID, name: 'Saved from Board', createdAt: '2026-06-01T09:00:00' },
]

export const initialWorkspaceItems: WorkspaceItem[] = [
  {
    id: 'item-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    folderId: 'folder-notes',
    type: 'note',
    title: 'Vendor concentration check',
    content: 'Need to compare vendor concentration with 2025 cloud programme before meeting.',
    createdAt: '2026-06-03T14:00:00',
    updatedAt: '2026-06-03T14:00:00',
  },
  {
    id: 'item-2',
    workspaceId: DEFAULT_WORKSPACE_ID,
    folderId: 'folder-docs',
    type: 'document',
    title: 'Risk Assessment.pdf',
    documentId: 'doc-3',
    createdAt: '2026-06-02T11:00:00',
    updatedAt: '2026-06-02T11:00:00',
  },
  {
    id: 'item-3',
    workspaceId: DEFAULT_WORKSPACE_ID,
    folderId: 'folder-docs',
    type: 'document',
    title: 'Vendor Comparison.pptx',
    documentId: 'doc-6',
    createdAt: '2026-06-02T11:05:00',
    updatedAt: '2026-06-02T11:05:00',
  },
]

export const citations: Citation[] = [
  {
    id: 'cite-1',
    documentId: 'doc-3',
    documentTitle: 'Risk Assessment.pdf',
    page: 7,
    passage:
      'The preferred vendor model introduces dependency concentration across implementation, support, and upgrade cycles. Mitigation requires independent vendor risk review before contract award.',
    confidence: 'High',
  },
  {
    id: 'cite-2',
    documentId: 'doc-1',
    documentTitle: 'Main Investment Proposal.pdf',
    page: 12,
    passage:
      'The Strategic Network Investment Programme proposes a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth.',
    confidence: 'High',
  },
  {
    id: 'cite-3',
    documentId: 'doc-2',
    documentTitle: 'Financial Model Summary.xlsx',
    page: 4,
    passage:
      'Capex sensitivity analysis indicates a 10% reduction in demand forecasts would increase payback period by 18 months, requiring Board review of phased release conditions.',
    confidence: 'Medium',
  },
  {
    id: 'cite-4',
    documentId: 'doc-4',
    documentTitle: 'Legal Note.pdf',
    page: 3,
    passage:
      'Regulatory approval for spectrum allocation remains subject to authority consultation. Implementation should not commence until formal approval is received.',
    confidence: 'High',
  },
  {
    id: 'cite-5',
    documentId: 'doc-5',
    documentTitle: 'Cybersecurity Assessment.pdf',
    page: 11,
    passage:
      'Implementation dependencies on legacy security infrastructure create a 6-month transition risk window. Audit Committee review recommended before go-live.',
    confidence: 'High',
  },
  {
    id: 'cite-6',
    documentId: 'doc-6',
    documentTitle: 'Vendor Comparison.pptx',
    page: 8,
    passage:
      'Preferred vendor holds 72% of proposed contract value across implementation and support, exceeding the Board threshold for concentration risk of 60%.',
    confidence: 'High',
  },
  {
    id: 'cite-7',
    documentId: 'doc-7',
    documentTitle: 'Prior Board Decisions Extract.pdf',
    page: 2,
    passage:
      'The 2025 Cloud Infrastructure Investment required quarterly risk reporting, independent vendor risk review, and Audit Committee review of cyber resilience impacts.',
    confidence: 'High',
  },
]

export const aiInsights: AIInsight[] = [
  {
    id: 'insight-1',
    type: 'summary',
    title: 'Executive Summary',
    content:
      'The Strategic Network Investment Programme proposes a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth. The proposal is broadly aligned with prior Board direction, but requires clarification on vendor concentration risk, quarterly risk reporting, and cyber implementation dependencies.',
    citationIds: ['cite-2', 'cite-1', 'cite-5'],
  },
  {
    id: 'insight-2',
    type: 'decision',
    title: 'Key Decision Required',
    content:
      'Approve the Strategic Network Investment Programme subject to final vendor due diligence, quarterly risk reporting, and Audit Committee review of cyber exposure before implementation.',
    citationIds: ['cite-1', 'cite-5', 'cite-7'],
  },
  {
    id: 'insight-3',
    type: 'risks',
    title: 'Key Risks',
    content: [
      'Vendor concentration risk exceeds Board threshold at 72% of contract value',
      'Regulatory approval uncertainty may delay implementation start',
      'Cyber implementation dependency creates 6-month transition risk window',
      'Capex overrun risk if demand forecasts are 10% lower than expected',
    ],
    citationIds: ['cite-6', 'cite-4', 'cite-5', 'cite-3'],
  },
  {
    id: 'insight-4',
    type: 'assumptions',
    title: 'Missing Assumptions',
    content: [
      'Demand growth forecast of 12% CAGR not independently validated',
      'Vendor pricing held constant over 5-year contract term',
      'Regulatory approval timeline assumed at 90 days without contingency',
      'Legacy system decommissioning costs not fully quantified',
    ],
    citationIds: ['cite-3', 'cite-4'],
  },
  {
    id: 'insight-5',
    type: 'questions',
    title: 'Suggested Director Questions',
    content: [
      'What are the consequences of delaying approval by one quarter?',
      'How does the preferred vendor concentration compare with the 2025 cloud programme?',
      'What cyber dependencies must be resolved before implementation?',
      'What is the capex sensitivity if demand forecasts are 10% lower than expected?',
    ],
    citationIds: ['cite-3', 'cite-6', 'cite-5'],
  },
  {
    id: 'insight-6',
    type: 'inconsistencies',
    title: 'Cross-Document Inconsistencies',
    content: [
      'Financial model assumes regulatory approval in Q3 2026; Legal Note indicates consultation period may extend to Q4 2026',
      'Investment Proposal cites 60% vendor threshold; Vendor Comparison shows 72% concentration',
      'Cyber assessment recommends Audit Committee review; main proposal lists review as optional',
    ],
    citationIds: ['cite-4', 'cite-6', 'cite-5'],
  },
]

export const priorDecisions: PriorDecision[] = [
  {
    id: 'decision-1',
    title: '2024 Network Expansion Approval',
    date: '2024-03-15',
    committee: 'Board of Directors',
    status: 'Approved',
    decisionText:
      'The Board approved the network expansion programme subject to phased capex release tied to milestone achievement and quarterly performance reporting.',
    conditions: ['Phased capex release', 'Quarterly performance reporting', 'Independent technical review at Phase 2'],
    assumptions: ['Demand growth of 8% CAGR', 'Spectrum availability by Q2 2024'],
    linkedActions: ['Phase 1 milestone review completed', 'Quarterly performance dashboard established'],
    sourcePapers: ['Network Expansion Proposal.pdf', 'Technical Assessment.pdf'],
    approvalHistory: [
      { date: '2024-03-15', approver: 'Board Secretary', action: 'Decision recorded' },
      { date: '2024-03-10', approver: 'Board Chair', action: 'Approved at Board meeting' },
    ],
    topic: 'Network Investment',
  },
  {
    id: 'decision-2',
    title: '2025 Cloud Infrastructure Investment',
    date: '2025-06-20',
    committee: 'Board of Directors',
    status: 'Approved',
    decisionText:
      'The Board approved the cloud infrastructure investment subject to quarterly risk reporting, independent vendor risk review, and Audit Committee review of cyber resilience impacts.',
    conditions: ['Quarterly risk reporting', 'Independent vendor risk review', 'Audit Committee cyber review'],
    assumptions: ['Cloud migration completed within 24 months', 'Vendor SLA of 99.95%'],
    linkedActions: ['Vendor risk review completed', 'Quarterly risk dashboard established', 'Cyber resilience review scheduled'],
    sourcePapers: ['Cloud Investment Proposal.pdf', 'Vendor Risk Assessment.pdf'],
    approvalHistory: [
      { date: '2025-06-20', approver: 'Board Secretary', action: 'Decision recorded' },
      { date: '2025-06-18', approver: 'Board Chair', action: 'Approved at Board meeting' },
    ],
    topic: 'Cloud Infrastructure',
  },
  {
    id: 'decision-3',
    title: '2025 Cyber Resilience Programme',
    date: '2025-09-12',
    committee: 'Board of Directors',
    status: 'Approved',
    decisionText:
      'The Board approved the cyber resilience programme with mandatory Audit Committee oversight and quarterly threat landscape reporting.',
    conditions: ['Audit Committee oversight', 'Quarterly threat landscape reporting', 'Penetration testing before go-live'],
    assumptions: ['Implementation within 18 months', 'Budget contingency of 15%'],
    linkedActions: ['Penetration testing scheduled', 'Threat landscape dashboard live'],
    sourcePapers: ['Cyber Resilience Proposal.pdf'],
    approvalHistory: [
      { date: '2025-09-12', approver: 'Board Secretary', action: 'Decision recorded' },
    ],
    topic: 'Cyber Security',
  },
]

export const actions: ActionItem[] = [
  {
    id: 'action-1',
    title: 'Final vendor due diligence',
    owner: 'Procurement and Technology',
    dueDate: '2026-07-30',
    status: 'Open',
    linkedDecision: 'Strategic Network Investment Programme',
    priority: 'High',
    description: 'Complete independent vendor due diligence including financial stability, security posture, and concentration risk assessment.',
    linkedMeetingId: MEETING_ID,
  },
  {
    id: 'action-2',
    title: 'Quarterly risk reporting',
    owner: 'Chief Risk Officer',
    dueDate: '2026-09-30',
    status: 'Open',
    linkedDecision: 'Strategic Network Investment Programme',
    priority: 'High',
    description: 'Establish quarterly risk reporting framework for the investment programme.',
    linkedMeetingId: MEETING_ID,
  },
  {
    id: 'action-3',
    title: 'Audit Committee cyber review',
    owner: 'Audit Committee Secretary',
    dueDate: '2026-08-15',
    status: 'Pending Review',
    linkedDecision: 'Strategic Network Investment Programme',
    priority: 'High',
    description: 'Schedule and complete Audit Committee review of cyber exposure before implementation.',
    linkedMeetingId: MEETING_ID,
  },
  {
    id: 'action-4',
    title: 'Updated financial model before next meeting',
    owner: 'Chief Financial Officer',
    dueDate: '2026-06-10',
    status: 'Overdue',
    linkedDecision: 'Strategic Network Investment Programme',
    priority: 'High',
    description: 'Provide updated financial model incorporating sensitivity analysis and revised demand forecasts.',
    linkedMeetingId: MEETING_ID,
  },
  {
    id: 'action-5',
    title: 'Vendor risk review completed',
    owner: 'Procurement',
    dueDate: '2025-08-01',
    status: 'Completed',
    linkedDecision: '2025 Cloud Infrastructure Investment',
    priority: 'Medium',
    description: 'Independent vendor risk review for cloud infrastructure programme.',
  },
  {
    id: 'action-6',
    title: 'Regulatory consultation response',
    owner: 'Regulatory Affairs',
    dueDate: '2026-07-01',
    status: 'Escalated',
    linkedDecision: 'Strategic Network Investment Programme',
    priority: 'High',
    description: 'Submit formal response to regulatory authority consultation on spectrum allocation.',
    linkedMeetingId: MEETING_ID,
  },
]

export const risks: Risk[] = [
  {
    id: 'risk-1',
    title: 'Vendor concentration risk',
    severity: 'High',
    likelihood: 'High',
    description: 'Preferred vendor holds 72% of proposed contract value, exceeding Board threshold.',
    mitigation: 'Independent vendor risk review before contract award',
  },
  {
    id: 'risk-2',
    title: 'Regulatory approval uncertainty',
    severity: 'High',
    likelihood: 'Medium',
    description: 'Spectrum allocation approval timeline uncertain; may delay Q3 2026 start.',
    mitigation: 'Phased implementation with regulatory gate at each phase',
  },
  {
    id: 'risk-3',
    title: 'Cyber implementation dependency',
    severity: 'Critical',
    likelihood: 'Medium',
    description: 'Legacy security infrastructure creates 6-month transition risk window.',
    mitigation: 'Audit Committee review before go-live',
  },
  {
    id: 'risk-4',
    title: 'Capex overrun risk',
    severity: 'Medium',
    likelihood: 'Medium',
    description: '10% lower demand forecasts would extend payback by 18 months.',
    mitigation: 'Phased capex release with performance gates',
  },
]

export const auditEvents: AuditEvent[] = [
  { id: 'audit-1', timestamp: '2026-06-01T09:00:00', user: 'System', action: 'Board pack processed', object: 'Strategic Investment Review Pack', status: 'Success' },
  { id: 'audit-2', timestamp: '2026-06-01T10:30:00', user: 'Board Briefing Agent', action: 'AI briefing generated', object: 'Executive Summary', status: 'Pending' },
  { id: 'audit-3', timestamp: '2026-06-02T14:15:00', user: 'Sarah Mitchell (Secretariat)', action: 'Secretariat approved summary', object: 'Executive Summary v1.2', status: 'Approved' },
  { id: 'audit-4', timestamp: '2026-06-03T11:00:00', user: 'James Al-Rashid (Chair)', action: 'Chair enabled AI-Free Mode', object: 'Strategic Network Investment Programme', status: 'Success' },
  { id: 'audit-5', timestamp: '2026-06-03T15:45:00', user: 'Board Member', action: 'Draft action created', object: 'Quarterly risk reporting', status: 'Pending' },
  { id: 'audit-6', timestamp: '2026-06-04T09:30:00', user: 'Board Secretary', action: 'Decision record approved', object: '2025 Cloud Infrastructure Investment', status: 'Approved' },
  { id: 'audit-7', timestamp: '2026-06-04T10:00:00', user: 'External User', action: 'Restricted access attempt', object: 'Board Pack - Strategic Investment', status: 'Restricted' },
  { id: 'audit-8', timestamp: '2026-06-04T11:20:00', user: 'Action Tracking Agent', action: 'Agent action requiring approval', object: 'Auto-escalate overdue action', status: 'Pending' },
]

export const agentStatuses: AgentStatus[] = [
  { id: 'agent-1', name: 'Board Briefing Agent', mode: 'Read-only', lastRun: '2026-06-04T08:00:00', lastStatus: 'Success', pendingApprovals: 0 },
  { id: 'agent-2', name: 'Decision Retrieval Agent', mode: 'Read-only', lastRun: '2026-06-04T08:15:00', lastStatus: 'Success', pendingApprovals: 0 },
  { id: 'agent-3', name: 'Action Tracking Agent', mode: 'Supervised', lastRun: '2026-06-04T09:00:00', lastStatus: 'Pending', pendingApprovals: 2 },
  { id: 'agent-4', name: 'Regulatory Watch Agent', mode: 'Paused', lastRun: '2026-05-28T12:00:00', lastStatus: 'Success', pendingApprovals: 0 },
]

export const secretariatReviewItems: SecretariatReviewItem[] = [
  {
    id: 'review-1',
    title: 'Draft Board Briefing - Executive Summary',
    type: 'briefing',
    content:
      'The Strategic Network Investment Programme proposes a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth. The proposal is broadly aligned with prior Board direction, but requires clarification on vendor concentration risk, quarterly risk reporting, and cyber implementation dependencies.',
    citationIds: ['cite-2', 'cite-1', 'cite-5'],
    status: 'Approved',
    version: 'v1.2',
    versionHistory: ['v1.0 - Initial AI draft', 'v1.1 - Secretariat edits', 'v1.2 - Approved for publication'],
    createdAt: '2026-06-01T10:30:00',
  },
  {
    id: 'review-2',
    title: 'Extracted Decision Item',
    type: 'decision',
    content:
      'Approve the Strategic Network Investment Programme subject to final vendor due diligence, quarterly risk reporting, and Audit Committee review of cyber exposure before implementation.',
    citationIds: ['cite-1', 'cite-5', 'cite-7'],
    status: 'Pending Review',
    version: 'v1.0',
    versionHistory: ['v1.0 - Initial AI extraction'],
    createdAt: '2026-06-02T09:00:00',
  },
  {
    id: 'review-3',
    title: 'Proposed Action Items',
    type: 'action',
    content:
      '1. Final vendor due diligence (Procurement, 30 Jul 2026)\n2. Quarterly risk reporting framework (CRO, 30 Sep 2026)\n3. Audit Committee cyber review (Audit Committee, 15 Aug 2026)',
    citationIds: ['cite-1', 'cite-5'],
    status: 'Pending Review',
    version: 'v1.0',
    versionHistory: ['v1.0 - Initial AI extraction'],
    createdAt: '2026-06-02T09:15:00',
  },
  {
    id: 'review-4',
    title: 'Risk Summary',
    type: 'risk',
    content:
      'Four material risks identified: vendor concentration (High/High), regulatory approval uncertainty (High/Medium), cyber implementation dependency (Critical/Medium), and capex overrun (Medium/Medium).',
    citationIds: ['cite-6', 'cite-4', 'cite-5', 'cite-3'],
    status: 'Pending Review',
    version: 'v1.0',
    versionHistory: ['v1.0 - Initial AI extraction'],
    createdAt: '2026-06-02T09:30:00',
  },
]

export const chatResponses: Record<string, {
  answer: string
  priorDecisions: string[]
  conditions: string[]
  citationIds: string[]
  confidence: string
}> = {
  'What is the scope of the Strategic Network Investment Programme?': {
    answer:
      'The Main Investment Proposal defines the programme as a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth. Indicative capex of AED 2.4bn is phased across five years, with milestone-based release subject to Board approval.',
    priorDecisions: [],
    conditions: [],
    citationIds: ['cite-2'],
    confidence: 'High — Main Investment Proposal, p.12',
  },
  'Have we approved a similar programme before?': {
    answer:
      'Yes. Two prior decisions are relevant: the 2024 Network Expansion Approval, which required phased capex release, and the 2025 Cloud Infrastructure Investment, which required quarterly risk reporting and independent vendor risk review. Both programmes share structural similarities with the current proposal.',
    priorDecisions: ['2024 Network Expansion Approval', '2025 Cloud Infrastructure Investment'],
    conditions: ['Phased capex release', 'Quarterly risk reporting', 'Independent vendor risk review'],
    citationIds: ['cite-7', 'cite-2'],
    confidence: 'High — 2 prior decisions, 4 source documents',
  },
  'What conditions were attached to previous approvals?': {
    answer:
      'Previous approvals consistently required: (1) phased capex release tied to milestones, (2) quarterly risk or performance reporting, (3) independent vendor risk review, and (4) Audit Committee oversight for cyber-related investments.',
    priorDecisions: ['2024 Network Expansion Approval', '2025 Cloud Infrastructure Investment', '2025 Cyber Resilience Programme'],
    conditions: ['Phased capex release', 'Quarterly risk reporting', 'Independent vendor risk review', 'Audit Committee cyber review'],
    citationIds: ['cite-7'],
    confidence: 'High — 3 prior decisions cited',
  },
  'What risks should directors focus on?': {
    answer:
      'Directors should focus on four material risks: vendor concentration exceeding the 60% threshold (currently 72%), regulatory approval timeline uncertainty, cyber implementation dependencies requiring Audit Committee review, and capex sensitivity to demand forecast variance.',
    priorDecisions: [],
    conditions: [],
    citationIds: ['cite-6', 'cite-4', 'cite-5', 'cite-3'],
    confidence: 'High — 4 risk sources across 4 documents',
  },
  'Draft a condition requiring quarterly risk reporting.': {
    answer:
      'Suggested condition: "The Board approves the Strategic Network Investment Programme subject to the establishment of quarterly risk reporting to the Board, covering vendor concentration, regulatory status, cyber implementation progress, and capex variance against approved forecasts, commencing from the quarter following approval."',
    priorDecisions: ['2025 Cloud Infrastructure Investment'],
    conditions: ['Quarterly risk reporting'],
    citationIds: ['cite-7', 'cite-3'],
    confidence: 'Medium — Draft condition based on prior precedent',
  },
}

export const defaultChatPrompts = [
  'What is the scope of the Strategic Network Investment Programme?',
  'Have we approved a similar programme before?',
  'What conditions were attached to previous approvals?',
  'What risks should directors focus on?',
  'Draft a condition requiring quarterly risk reporting.',
]

export function findChatResponse(content: string) {
  if (chatResponses[content]) return chatResponses[content]

  const lower = content.toLowerCase()
  if (lower.includes('scope') && (lower.includes('programme') || lower.includes('investment'))) {
    return chatResponses['What is the scope of the Strategic Network Investment Programme?']
  }
  if (lower.includes('similar') && lower.includes('programme')) {
    return chatResponses['Have we approved a similar programme before?']
  }
  if (lower.includes('condition') && lower.includes('approv')) {
    return chatResponses['What conditions were attached to previous approvals?']
  }
  if (lower.includes('risk') && (lower.includes('director') || lower.includes('focus'))) {
    return chatResponses['What risks should directors focus on?']
  }

  return null
}

/** Full page bodies for the document viewer — citations highlight passages within this text. */
export const documentPageContent: Record<string, Record<number, DocumentPageContent>> = {
  'doc-1': {
    1: {
      heading: 'Executive Summary',
      paragraphs: [
        'Board paper for approval of the Strategic Network Investment Programme. This proposal has been prepared by Group Strategy in consultation with Technology, Finance, and the Chief Risk Officer.',
        'Directors are asked to approve the programme subject to the conditions set out in Section 8 and the supporting risk and legal assessments circulated with this pack.',
      ],
    },
    12: {
      heading: 'Section 4 — Programme Overview',
      paragraphs: [
        '4.1 Strategic context. Network capacity and resilience remain critical enablers for du\'s digital service roadmap. Current core network assets require modernisation to support projected traffic growth and 5G service expansion.',
        'The Strategic Network Investment Programme proposes a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth.',
        '4.2 Investment envelope. Total indicative capex of AED 2.4bn is phased across five years (2026–2030). Release of each phase is subject to milestone achievement and quarterly Board reporting as set out in the Financial Model Summary.',
        '4.3 Expected outcomes. Upon completion, the programme is expected to increase network availability to 99.99%, reduce mean-time-to-restore by 40%, and enable capacity for 12% CAGR in data traffic without additional unplanned capex.',
      ],
    },
    13: {
      heading: 'Section 5 — Governance & Reporting',
      paragraphs: [
        '5.1 The programme will be overseen by a steering committee reporting to the Executive Committee. Board oversight will include quarterly progress and risk reporting.',
        '5.2 Material changes to vendor selection, capex envelope, or regulatory assumptions require prior Board approval.',
      ],
    },
  },
  'doc-3': {
    7: {
      heading: 'Vendor & Supply Chain Risk',
      paragraphs: [
        '7.1 Overview. The programme relies on a preferred vendor for implementation, ongoing support, and upgrade cycles across the five-year horizon.',
        'The preferred vendor model introduces dependency concentration across implementation, support, and upgrade cycles. Mitigation requires independent vendor risk review before contract award.',
        '7.2 Residual risk rating: High. Concentration is compounded by limited alternative suppliers for specialised network equipment in the proposed architecture.',
      ],
    },
  },
  'doc-2': {
    4: {
      heading: 'Sensitivity Analysis',
      paragraphs: [
        'Base case assumes 12% CAGR demand growth and regulatory approval in Q3 2026.',
        'Capex sensitivity analysis indicates a 10% reduction in demand forecasts would increase payback period by 18 months, requiring Board review of phased release conditions.',
        'Scenario modelling is provided in tabs 4.1–4.3 of the attached workbook.',
      ],
    },
  },
  'doc-4': {
    3: {
      heading: 'Regulatory Status',
      paragraphs: [
        '3.1 Spectrum allocation for expanded 5G services remains subject to Telecommunications Regulatory Authority consultation.',
        'Regulatory approval for spectrum allocation remains subject to authority consultation. Implementation should not commence until formal approval is received.',
        '3.2 Legal recommends a Board condition requiring explicit confirmation of regulatory clearance before Phase 1 expenditure.',
      ],
    },
  },
  'doc-5': {
    11: {
      heading: 'Implementation Dependencies',
      paragraphs: [
        '11.1 Legacy security infrastructure must be upgraded in parallel with network modernisation to maintain compliance with group cyber standards.',
        'Implementation dependencies on legacy security infrastructure create a 6-month transition risk window. Audit Committee review recommended before go-live.',
        '11.2 Penetration testing and independent assurance are scheduled for Q4 2026 prior to production cutover.',
      ],
    },
  },
  'doc-6': {
    8: {
      heading: 'Vendor Concentration Analysis',
      paragraphs: [
        'Slide 8 summarises contract value allocation across shortlisted vendors for implementation and support.',
        'Preferred vendor holds 72% of proposed contract value across implementation and support, exceeding the Board threshold for concentration risk of 60%.',
        'Alternative vendor scenarios reduce concentration to 54% but extend implementation timeline by approximately 9 months.',
      ],
    },
  },
  'doc-7': {
    2: {
      heading: 'Extract — 2025 Cloud Infrastructure Investment',
      paragraphs: [
        'Decision date: 14 March 2025. Committee: Board of Directors.',
        'The 2025 Cloud Infrastructure Investment required quarterly risk reporting, independent vendor risk review, and Audit Committee review of cyber resilience impacts.',
        'Conditions included phased capex release tied to migration milestones and mandatory quarterly performance reporting to the Board.',
      ],
    },
  },
}

export function getDocumentPageContent(documentId: string, page: number): DocumentPageContent {
  const specific = documentPageContent[documentId]?.[page]
  if (specific) return specific

  const versions = getVersionsForDocument(documentId)
  const latest = versions[versions.length - 1]
  const versionPage = latest?.pages[page]
  if (versionPage?.body) {
    return { paragraphs: [versionPage.body] }
  }

  const doc = getDocumentById(documentId)
  return {
    paragraphs: [
      `Board pack material — page ${page} of ${doc?.pages ?? '?'}. Official record for director review. Select a citation from Board AI to jump to a sourced passage.`,
    ],
  }
}

export function getCitationsForDocument(documentId: string): Citation[] {
  return citations.filter((c) => c.documentId === documentId)
}

export const comparisonPoints = [
  { aspect: 'Investment Type', current: 'Network infrastructure modernisation', prior: 'Cloud infrastructure migration (2025)' },
  { aspect: 'Capex Structure', current: 'Multi-year phased release proposed', prior: 'Phased capex release required (2024 precedent)' },
  { aspect: 'Vendor Risk', current: '72% concentration — exceeds threshold', prior: 'Independent vendor risk review required (2025)' },
  { aspect: 'Reporting', current: 'Quarterly risk reporting proposed', prior: 'Quarterly risk reporting established (2025)' },
  { aspect: 'Cyber Oversight', current: 'Audit Committee review recommended', prior: 'Audit Committee cyber review mandated (2025)' },
  { aspect: 'Regulatory', current: 'Spectrum approval pending', prior: 'No equivalent regulatory gate' },
]

export const documentVersions: DocumentVersion[] = [
  {
    id: 'ver-3a',
    documentId: 'doc-3',
    version: 'v1.0',
    label: 'Initial Secretariat draft',
    publishedAt: '2026-05-28',
    author: 'Secretariat',
    changeSummary: 'Initial risk assessment circulated to Board.',
    pages: {
      7: {
        body: 'The preferred vendor model introduces moderate dependency across implementation and support. Mitigation includes standard contract terms before award.',
        citationIds: [],
      },
    },
  },
  {
    id: 'ver-3b',
    documentId: 'doc-3',
    version: 'v1.2',
    label: 'Revised — vendor concentration updated',
    publishedAt: '2026-06-01',
    author: 'Chief Risk Officer',
    changeSummary: 'Vendor concentration raised to High; independent review requirement added.',
    pages: {
      7: {
        body: 'The preferred vendor model introduces dependency concentration across implementation, support, and upgrade cycles. Mitigation requires independent vendor risk review before contract award.',
        changed: true,
        citationIds: ['cite-1'],
      },
    },
  },
  {
    id: 'ver-1a',
    documentId: 'doc-1',
    version: 'v2.0',
    label: 'Board pack draft',
    publishedAt: '2026-05-25',
    author: 'Strategy',
    changeSummary: 'Initial investment proposal for Board review.',
    pages: {
      12: {
        body: 'The programme proposes investment to modernise network capacity over a five-year horizon, aligned with prior Board direction on digital infrastructure.',
        citationIds: [],
      },
    },
  },
  {
    id: 'ver-1b',
    documentId: 'doc-1',
    version: 'v2.1',
    label: 'Revised — executive summary updated',
    publishedAt: '2026-06-01',
    author: 'Strategy',
    changeSummary: 'Executive summary expanded; resilience and vendor risk language added.',
    pages: {
      12: {
        body: 'The Strategic Network Investment Programme proposes a multi-year investment to modernise core network capacity, improve resilience, and support future digital service growth.',
        changed: true,
        citationIds: ['cite-2'],
      },
    },
  },
]

export function getVersionsForDocument(documentId: string): DocumentVersion[] {
  return documentVersions.filter((v) => v.documentId === documentId).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
}

export function getVersionById(id: string): DocumentVersion | undefined {
  return documentVersions.find((v) => v.id === id)
}

export function getCitationById(id: string): Citation | undefined {
  return citations.find((c) => c.id === id)
}

export function getDocumentById(id: string): Document | undefined {
  return documents.find((d) => d.id === id)
}

export function getDecisionById(id: string): PriorDecision | undefined {
  return priorDecisions.find((d) => d.id === id)
}

export function getActionById(id: string): ActionItem | undefined {
  return actions.find((a) => a.id === id)
}
