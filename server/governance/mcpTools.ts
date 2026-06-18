import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'
import {
  createGovernanceAction,
  getGovernanceActionForDisplay,
  listGovernanceActionsForDisplay,
  updateGovernanceAction,
} from './actionsRepository.ts'
import { enrichActionWithDocumentTitle } from './documentReferenceResolver.ts'
import { GOVERNANCE_ACTION_CREATE_RULES, PROVISIONAL_DUE_DAYS, provisionalDueDate } from './governanceRules.ts'
import type { GovernanceAction } from './types.ts'

function formatAction(action: GovernanceAction): string {
  return JSON.stringify(action, null, 2)
}

export function registerGovernanceMcpTools(server: McpServer): void {
  server.registerTool(
    'list_governance_actions',
    {
      description:
        'List board governance actions from the organisation register. Filter by status, owner, or document reference ID.',
      inputSchema: {
        status: z
          .enum(['Open', 'Overdue', 'Completed', 'Pending Review', 'Escalated'])
          .optional()
          .describe('Filter by action status'),
        owner: z.string().optional().describe('Filter by owner name (partial match)'),
        document_reference_id: z
          .string()
          .optional()
          .describe('Filter by linked North file ID or board document reference'),
        limit: z.number().int().min(1).max(100).optional().describe('Max results (default 50)'),
      },
    },
    async ({ status, owner, document_reference_id, limit }) => {
      const actions = await listGovernanceActionsForDisplay({
        status,
        owner,
        documentReferenceId: document_reference_id,
        limit: limit ?? 50,
      })
      return {
        content: [
          {
            type: 'text',
            text:
              actions.length === 0
                ? 'No governance actions found.'
                : actions.map(formatAction).join('\n\n'),
          },
        ],
      }
    }
  )

  server.registerTool(
    'get_governance_action',
    {
      description: 'Get a single governance action by UUID.',
      inputSchema: {
        id: z.string().uuid().describe('Governance action ID'),
      },
    },
    async ({ id }) => {
      const action = await getGovernanceActionForDisplay(id)
      if (!action) {
        return {
          content: [{ type: 'text', text: `Action not found: ${id}` }],
          isError: true,
        }
      }
      return { content: [{ type: 'text', text: formatAction(action) }] }
    }
  )

  server.registerTool(
    'create_governance_action',
    {
      description:
        'Create a new board governance action. Infer owner from board context when appropriate; only pass due_date if the user explicitly gave a date. ' +
        GOVERNANCE_ACTION_CREATE_RULES,
      inputSchema: {
        title: z.string().min(1).describe('Action title'),
        description: z.string().optional().describe('Detailed description'),
        document_reference_id: z
          .string()
          .optional()
          .describe('North My Files ID or board document reference'),
        owner: z
          .string()
          .optional()
          .describe(
            'Responsible owner — infer from board pack/register when clear (e.g. Procurement, CFO); use "Unassigned" only if unknown'
          ),
        due_date: z
          .string()
          .optional()
          .describe('YYYY-MM-DD — only when the user explicitly stated a due date; otherwise omit'),
        notes: z.string().optional().describe('Additional notes'),
        status: z
          .enum(['Open', 'Overdue', 'Completed', 'Pending Review', 'Escalated'])
          .optional()
          .describe('Default Open when owner is assigned; Pending Review when Unassigned'),
        priority: z.enum(['High', 'Medium', 'Low']).optional().describe('Priority (default Medium)'),
        linked_decision: z.string().optional().describe('Linked board decision title'),
      },
    },
    async (input) => {
      const owner = input.owner?.trim() || 'Unassigned'
      const userNamedDue = !!input.due_date?.trim()
      const ownerAssigned = owner !== 'Unassigned'

      const created = await createGovernanceAction({
        title: input.title,
        description: input.description,
        documentReferenceId: input.document_reference_id ?? null,
        owner,
        dueDate: userNamedDue ? input.due_date! : provisionalDueDate(),
        notes: !userNamedDue
          ? [
              input.notes,
              `${PROVISIONAL_DUE_DAYS}-day triage placeholder — user did not specify a due date; confirm in Action Tracking if needed.`,
            ]
              .filter(Boolean)
              .join(' ')
          : input.notes,
        status: input.status ?? (ownerAssigned ? 'Open' : 'Pending Review'),
        priority: input.priority,
        linkedDecision: input.linked_decision ?? null,
      })
      const action = await enrichActionWithDocumentTitle(created)

      const summary = [
        'Created governance action.',
        ownerAssigned
          ? `- Owner: ${action.owner} (inferred or user-specified — state briefly if inferred from board context).`
          : '- Owner: Unassigned — could not infer from context; Pending Review.',
        userNamedDue
          ? `- Due date: ${action.dueDate} (user-specified).`
          : `- Due date: ${action.dueDate} (${PROVISIONAL_DUE_DAYS}-day register placeholder — user did not request this date; mention it is for triage only).`,
        '',
        formatAction(action),
      ].join('\n')

      return {
        content: [{ type: 'text', text: summary }],
      }
    }
  )

  server.registerTool(
    'update_governance_action',
    {
      description: 'Update fields on an existing governance action.',
      inputSchema: {
        id: z.string().uuid().describe('Governance action ID'),
        title: z.string().optional(),
        description: z.string().optional(),
        document_reference_id: z.string().nullable().optional(),
        owner: z.string().optional(),
        due_date: z.string().optional(),
        notes: z.string().optional(),
        status: z
          .enum(['Open', 'Overdue', 'Completed', 'Pending Review', 'Escalated'])
          .optional(),
        priority: z.enum(['High', 'Medium', 'Low']).optional(),
        linked_decision: z.string().nullable().optional(),
      },
    },
    async ({ id, document_reference_id, due_date, linked_decision, ...rest }) => {
      const updated = await updateGovernanceAction(id, {
        ...rest,
        documentReferenceId: document_reference_id,
        dueDate: due_date,
        linkedDecision: linked_decision,
      })
      if (!updated) {
        return {
          content: [{ type: 'text', text: `Action not found: ${id}` }],
          isError: true,
        }
      }
      const action = await enrichActionWithDocumentTitle(updated)
      return {
        content: [{ type: 'text', text: `Updated governance action:\n${formatAction(action)}` }],
      }
    }
  )
}
