export const PROVISIONAL_DUE_DAYS = 14

export const GOVERNANCE_ACTION_CREATE_RULES = `Creating governance actions (via create_governance_action):
- Infer owner from board pack context when the request clearly maps to a function (e.g. procurement/vendor work → Procurement, budget/finance → Chief Financial Officer, risk → Chief Risk Officer). Use existing register entries and document ownership as hints.
- Only set due_date when the user explicitly states a date in the same request. Do not copy due dates from similar existing actions.
- If due date is not specified, omit due_date on the tool call — the register applies a ${PROVISIONAL_DUE_DAYS}-day placeholder for triage (not a confirmed board deadline).
- If owner cannot be reasonably inferred, use owner "Unassigned" and status "Pending Review".
- When due date is a register placeholder, say so briefly when confirming creation (e.g. "${PROVISIONAL_DUE_DAYS}-day triage placeholder — confirm in Action Tracking if a different deadline is needed").`

export function provisionalDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + PROVISIONAL_DUE_DAYS)
  return d.toISOString().slice(0, 10)
}
