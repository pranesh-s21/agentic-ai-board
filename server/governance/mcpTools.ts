import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'
import {
  createGovernanceAction,
  getGovernanceAction,
  listGovernanceActions,
  updateGovernanceAction,
} from './actionsRepository.ts'
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
      const actions = await listGovernanceActions({
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
      const action = await getGovernanceAction(id)
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
        'Create a new board governance action. Requires title, owner, and due date. Use document_reference_id for North file or board document links.',
      inputSchema: {
        title: z.string().min(1).describe('Action title'),
        description: z.string().optional().describe('Detailed description'),
        document_reference_id: z
          .string()
          .optional()
          .describe('North My Files ID or board document reference'),
        owner: z.string().min(1).describe('Action owner (person or function)'),
        due_date: z.string().describe('Due date in YYYY-MM-DD format'),
        notes: z.string().optional().describe('Additional notes'),
        status: z
          .enum(['Open', 'Overdue', 'Completed', 'Pending Review', 'Escalated'])
          .optional()
          .describe('Initial status (default Open)'),
        priority: z.enum(['High', 'Medium', 'Low']).optional().describe('Priority (default Medium)'),
        linked_decision: z.string().optional().describe('Linked board decision title'),
      },
    },
    async (input) => {
      const action = await createGovernanceAction({
        title: input.title,
        description: input.description,
        documentReferenceId: input.document_reference_id ?? null,
        owner: input.owner,
        dueDate: input.due_date,
        notes: input.notes,
        status: input.status,
        priority: input.priority,
        linkedDecision: input.linked_decision ?? null,
      })
      return {
        content: [
          {
            type: 'text',
            text: `Created governance action:\n${formatAction(action)}`,
          },
        ],
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
      const action = await updateGovernanceAction(id, {
        ...rest,
        documentReferenceId: document_reference_id,
        dueDate: due_date,
        linkedDecision: linked_decision,
      })
      if (!action) {
        return {
          content: [{ type: 'text', text: `Action not found: ${id}` }],
          isError: true,
        }
      }
      return {
        content: [{ type: 'text', text: `Updated governance action:\n${formatAction(action)}` }],
      }
    }
  )
}
