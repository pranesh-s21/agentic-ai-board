import { Router } from 'express'
import {
  createGovernanceAction,
  deleteGovernanceAction,
  getGovernanceAction,
  listGovernanceActions,
  updateGovernanceAction,
} from '../governance/actionsRepository.ts'
import type {
  CreateGovernanceActionInput,
  GovernanceActionStatus,
  UpdateGovernanceActionInput,
} from '../governance/types.ts'

export const governanceActionsRouter = Router()

governanceActionsRouter.get('/actions', async (req, res) => {
  try {
    const status =
      typeof req.query.status === 'string' ? (req.query.status as GovernanceActionStatus) : undefined
    const owner = typeof req.query.owner === 'string' ? req.query.owner : undefined
    const documentReferenceId =
      typeof req.query.documentReferenceId === 'string' ? req.query.documentReferenceId : undefined
    const limit = req.query.limit ? Number(req.query.limit) : undefined

    const actions = await listGovernanceActions({ status, owner, documentReferenceId, limit })
    res.json({ actions })
  } catch (error) {
    console.error('[governance/actions]', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not list actions',
    })
  }
})

governanceActionsRouter.get('/actions/:id', async (req, res) => {
  try {
    const action = await getGovernanceAction(req.params.id)
    if (!action) {
      res.status(404).json({ error: 'Action not found' })
      return
    }
    res.json({ action })
  } catch (error) {
    console.error('[governance/actions/:id]', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not load action',
    })
  }
})

governanceActionsRouter.post('/actions', async (req, res) => {
  try {
    const body = req.body as CreateGovernanceActionInput
    if (!body.title?.trim() || !body.owner?.trim() || !body.dueDate) {
      res.status(400).json({ error: 'title, owner, and dueDate are required' })
      return
    }

    const action = await createGovernanceAction(body)
    res.status(201).json({ action })
  } catch (error) {
    console.error('[governance/actions POST]', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not create action',
    })
  }
})

governanceActionsRouter.patch('/actions/:id', async (req, res) => {
  try {
    const action = await updateGovernanceAction(req.params.id, req.body as UpdateGovernanceActionInput)
    if (!action) {
      res.status(404).json({ error: 'Action not found' })
      return
    }
    res.json({ action })
  } catch (error) {
    console.error('[governance/actions PATCH]', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not update action',
    })
  }
})

governanceActionsRouter.delete('/actions/:id', async (req, res) => {
  try {
    const deleted = await deleteGovernanceAction(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Action not found' })
      return
    }
    res.json({ deleted: true })
  } catch (error) {
    console.error('[governance/actions DELETE]', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Could not delete action',
    })
  }
})
