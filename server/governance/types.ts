export type GovernanceActionStatus =
  | 'Open'
  | 'Overdue'
  | 'Completed'
  | 'Pending Review'
  | 'Escalated'

export type GovernanceActionPriority = 'High' | 'Medium' | 'Low'

export interface GovernanceAction {
  id: string
  title: string
  description: string
  documentReferenceId: string | null
  documentReferenceTitle?: string | null
  owner: string
  dueDate: string
  notes: string
  status: GovernanceActionStatus
  priority: GovernanceActionPriority
  linkedDecision: string | null
  linkedMeetingId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateGovernanceActionInput {
  title: string
  description?: string
  documentReferenceId?: string | null
  owner: string
  dueDate: string
  notes?: string
  status?: GovernanceActionStatus
  priority?: GovernanceActionPriority
  linkedDecision?: string | null
  linkedMeetingId?: string | null
}

export interface UpdateGovernanceActionInput {
  title?: string
  description?: string
  documentReferenceId?: string | null
  owner?: string
  dueDate?: string
  notes?: string
  status?: GovernanceActionStatus
  priority?: GovernanceActionPriority
  linkedDecision?: string | null
  linkedMeetingId?: string | null
}

export interface ListGovernanceActionsQuery {
  status?: GovernanceActionStatus
  owner?: string
  documentReferenceId?: string
  limit?: number
}
