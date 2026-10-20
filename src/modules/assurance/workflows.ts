import type { Item } from "./types";

export const workflowDefinitions: Record<string, { outcome: string; checks: string[] }> = {
  Compliance: { outcome: "Approve compliance attestation", checks: ["Applicable requirements and policy versions mapped", "Monitoring findings resolved with corrective evidence", "Compliance report and attestation prepared"] },
  Contracts: { outcome: "Confirm executed agreement", checks: ["Renewal terms and financial impact reviewed", "Legal review and required approvals documented", "Signed agreement and effective dates recorded"] },
  "Provider Data": { outcome: "Confirm roster acceptance", checks: ["Provider identifiers and required fields validated", "Adds, changes and terminations reconciled to source", "Payer roster acceptance recorded"] },
  Claims: { outcome: "Approve claims audit", checks: ["Claims inventory and aging reconciled", "Timeliness and payment accuracy exceptions resolved", "Adjustment and payment evidence documented"] },
  "Provider Network": { outcome: "Approve network assessment", checks: ["Network directory and participating providers validated", "Access and coverage measured against applicable standards", "Coverage gaps resolved and remediation documented"] },
  "Utilization Management": { outcome: "Approve authorization audit", checks: ["Authorization inventory and decision timestamps reconciled", "Turnaround and clinical review exceptions resolved", "Decision notices and appeal rights reviewed"] },
  Finance: { outcome: "Approve financial reconciliation", checks: ["Expected capitation reconciled to membership and rates", "Remittance and ledger variances resolved", "Payment posting and financial approval documented"] },
  "Member Services": { outcome: "Approve grievance report", checks: ["Grievance and appeal inventory reconciled", "Response deadlines and resolution notices reviewed", "Open issues resolved and member communications documented"] },
  "Data Reporting": { outcome: "Confirm report acceptance", checks: ["Source totals and reporting specification documented", "Schema, completeness and duplicate checks passed", "Submission totals and recipient acceptance reconciled"] },
};
export function initializeWorkflow(item: Item): Item {
  if (!workflowDefinitions[item.category] || item.workflow) return item;
  return { ...item, execution: item.id === "ROS-2026-04" ? "Blocked" : "Not started", verification: "Pending", next: item.id === "ROS-2026-04" ? "Wait for eligibility acceptance" : "Assign owner and record required evidence", workflow: { stage: "Preparation", evidence: {}, history: [] } };
}
export type WorkflowAction =
  | { type: "owner"; owner: string }
  | { type: "evidence"; check: string; reference: string; passed: boolean }
  | { type: "submit" }
  | { type: "decision"; reviewer: string; reference: string; approved: boolean }
  | { type: "reopen"; reason: string };
export function workflowTransition(item: Item, action: WorkflowAction): Item {
  const definition = workflowDefinitions[item.category];
  if (!definition || !item.workflow) throw new Error("Workflow is unavailable.");
  let state = { ...item.workflow, evidence: { ...item.workflow.evidence } };
  let patch: Partial<Item> = {};
  let text = "";
  const editable = state.stage === "Preparation";
  if (action.type === "owner") {
    if (!editable || !action.owner.trim() || action.owner.trim().toLowerCase() === "unassigned") throw new Error("Assign an owner during preparation.");
    patch.owner = action.owner.trim(); text = `Owner assigned: ${patch.owner}`;
  } else if (action.type === "evidence") {
    if (!editable || !definition.checks.includes(action.check) || !action.reference.trim()) throw new Error("Record an evidence reference during preparation.");
    if (item.id === "ROS-2026-04" && item.next === "Wait for eligibility acceptance") throw new Error("Eligibility acceptance is required before roster reconciliation.");
    state.evidence[action.check] = { reference: action.reference.trim(), passed: action.passed };
    const failed = Object.values(state.evidence).some(check => !check.passed);
    patch = { execution: failed ? "Blocked" : "In progress", verification: failed ? "Failed" : "Pending", next: failed ? "Resolve failed evidence checks" : "Complete evidence and request review" };
    text = `${action.check}: ${action.passed ? "Passed" : "Failed"} — ${action.reference.trim()}`;
  } else if (action.type === "submit") {
    if (!editable || !item.owner.trim() || item.owner.toLowerCase() === "unassigned" || definition.checks.some(check => !state.evidence[check]?.passed || !state.evidence[check]?.reference.trim())) throw new Error("Assign an owner and pass every required evidence check before review.");
    if (item.id === "ROS-2026-04" && item.next === "Wait for eligibility acceptance") throw new Error("Eligibility acceptance is required.");
    state.stage = "Review"; patch = { execution: "Submitted / awaiting verification", verification: "Pending", next: definition.outcome }; text = `Review requested by ${item.owner}`;
  } else if (action.type === "decision") {
    if (state.stage !== "Review" || !action.reviewer.trim() || !action.reference.trim() || action.reviewer.trim().toLowerCase() === item.owner.trim().toLowerCase()) throw new Error("An independent reviewer and decision reference are required during review.");
    if (item.id === "ROS-2026-04" && item.next === "Wait for eligibility acceptance") throw new Error("Eligibility acceptance is required.");
    state.stage = action.approved ? "Completed" : "Rejected";
    patch = { execution: action.approved ? "Completed" : "Blocked", verification: action.approved ? "Verified" : "Failed", next: action.approved ? "No action" : "Open correction cycle" };
    text = `${action.approved ? "Approved" : "Rejected"} by ${action.reviewer.trim()}: ${action.reference.trim()}`;
  } else {
    if (editable || !action.reason.trim()) throw new Error("Record a reason to reopen this workflow.");
    state.stage = "Preparation"; state.evidence = {}; patch = { execution: "In progress", verification: "Pending", next: "Record corrected evidence and request review" }; text = `Correction cycle opened: ${action.reason.trim()}. Earlier evidence retained in activity history.`;
  }
  state.history = [{ at: new Date().toISOString(), text }, ...state.history];
  return { ...item, ...patch, workflow: state };
}
