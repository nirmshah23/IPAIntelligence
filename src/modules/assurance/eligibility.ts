import type { Item } from "./types";

export type Eligibility = NonNullable<Item["eligibility"]>;
export type EligibilityFile = NonNullable<Eligibility["file"]>;
export function fileIssues(file: EligibilityFile): string[] {
  const issues: string[] = [];
  if (!file.reference.trim()) issues.push("Add the source file and validation report reference.");
  if ([file.expected, file.actual, file.invalid, file.duplicates].some(value => !Number.isSafeInteger(value) || value < 0)) {
    issues.push("Record counts must be nonnegative whole numbers.");
  }
  if (file.expected === 0 || file.actual === 0) issues.push("Expected and actual counts must be greater than zero.");
  if (file.expected !== file.actual) issues.push(`Control-total mismatch: ${file.expected - file.actual} records (expected minus actual).`);
  if (file.invalid !== 0) issues.push(`Resolve ${file.invalid} invalid records.`);
  if (file.duplicates !== 0) issues.push(`Resolve ${file.duplicates} duplicate records.`);
  if (!file.schemaPassed) issues.push("Schema validation must pass.");
  if (!file.encrypted) issues.push("Confirm the submission file is encrypted.");
  return issues;
}

type Action =
  | { type: "validate"; file: EligibilityFile }
  | { type: "submit"; receipt: string }
  | { type: "response"; accepted: boolean; reference: string; count: number; reason: string }
  | { type: "revise"; reason: string }
  | { type: "owner"; owner: string };

export function eligibilityTransition(item: Item, action: Action, at = new Date().toISOString()): Item {
  const state = item.eligibility;
  if (!state) throw new Error("Eligibility case is not initialized.");
  let patch: Partial<Item> = {};
  let change: Partial<Eligibility> = {};
  let text = "";
  switch (action.type) {
    case "owner": {
      if (!action.owner.trim() || action.owner.trim() === "Unassigned" || state.stage === "Accepted") throw new Error("Assign a named owner to an open case.");
      patch = { owner: action.owner.trim() };
      text = `Accountable owner assigned: ${action.owner.trim()}`;
      break;
    }
    case "validate": {
      if (!["Prepare", "Reconcile"].includes(state.stage)) throw new Error("Start a correction before replacing a validated file.");
      if (!action.file.reference.trim()) throw new Error("Add the source file and validation report reference.");
      if ([action.file.expected, action.file.actual, action.file.invalid, action.file.duplicates].some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error("Record counts must be nonnegative whole numbers.");
      const issues = fileIssues(action.file);
      change = { file: { ...action.file, reference: action.file.reference.trim() }, stage: issues.length ? "Reconcile" : "Ready to submit", receipt: undefined, acknowledgment: undefined };
      patch = { execution: issues.length ? "Blocked" : "In progress", verification: issues.length ? "Failed" : "Pending", next: issues.length ? "Correct eligibility file and rerun validation" : "Record submission receipt" };
      text = `Validation recorded for ${action.file.reference || "unreferenced file"}: expected ${action.file.expected}, actual ${action.file.actual}, invalid ${action.file.invalid}, duplicates ${action.file.duplicates}. ${issues.length ? issues.join(" ") : "All checks passed."}`;
      break;
    }
    case "submit": {
      if (state.stage !== "Ready to submit" || !state.file || fileIssues(state.file).length) throw new Error("Pass every file validation before submission.");
      if (!item.owner.trim() || item.owner === "Unassigned") throw new Error("Assign an accountable owner before submission.");
      if (!action.receipt.trim()) throw new Error("Record the payer gateway submission receipt.");
      change = { stage: "Awaiting payer", receipt: action.receipt.trim() };
      patch = { execution: "Submitted / awaiting verification", verification: "Pending", next: "Record payer acknowledgment" };
      text = `Submission recorded: ${action.receipt.trim()} · ${state.file.actual} records · owner ${item.owner}`;
      break;
    }
    case "response": {
      if (state.stage !== "Awaiting payer" || !state.file || !state.receipt) throw new Error("Record a submission before its payer response.");
      if (!action.reference.trim()) throw new Error("Record the payer acknowledgment reference.");
      if (action.accepted && (!Number.isSafeInteger(action.count) || action.count !== state.file.actual)) throw new Error("Accepted count must equal the submitted record count.");
      if (!action.accepted && !action.reason.trim()) throw new Error("Record the rejection reason.");
      change = { stage: action.accepted ? "Accepted" : "Rejected", acknowledgment: action.reference.trim() };
      patch = { execution: action.accepted ? "Completed" : "Blocked", verification: action.accepted ? "Verified" : "Failed", next: action.accepted ? "No action" : "Correct rejected file and resubmit", ...(action.accepted ? { impact: undefined } : {}) };
      text = `Payer ${action.accepted ? `accepted ${action.count} records` : `rejected file: ${action.reason.trim()}`} · ${action.reference.trim()} · submission ${state.receipt}`;
      break;
    }
    case "revise": {
      if (state.stage === "Prepare" || state.stage === "Reconcile") throw new Error("This case is already open for file preparation.");
      if (!action.reason.trim()) throw new Error("Record the reason for correction or reopening.");
      change = { stage: "Prepare", file: undefined, receipt: undefined, acknowledgment: undefined };
      patch = { execution: "In progress", verification: "Pending", next: "Prepare corrected file and validate" };
      text = `Correction cycle opened: ${action.reason.trim()}. Previous evidence retained in history.`;
      break;
    }
  }
  return { ...item, ...patch, eligibility: { ...state, ...change, history: [{ at, text }, ...state.history] } };
}

export function initializeEligibility(item: Item): Item {
  if (item.category !== "Eligibility" || item.eligibility) return item;
  if (item.id === "ELG-2026-03") return { ...item, eligibility: { stage: "Accepted", history: [{ at: "2026-04-03T17:00:00Z", text: "Demo archive: March eligibility cycle previously completed and verified. Historical file evidence is not imported." }] } };
  if (item.id === "ELG-2026-04") return { ...item, execution: "Blocked", eligibility: { stage: "Reconcile", file: { reference: "Demo report REC-11902 / April eligibility file", expected: 18442, actual: 18300, invalid: 0, duplicates: 0, schemaPassed: true, encrypted: true }, history: [{ at: "2026-05-04T14:24:00Z", text: "Demo reconciliation REC-11902 failed: expected 18,442 records; received 18,300. Resolve 142 missing records before submission." }] } };
  return { ...item, execution: "Not started", verification: "Pending", next: "Prepare eligibility file and validation report", eligibility: { stage: "Prepare", history: [] } };
}

export function syncEligibilityDependency(items: Item[]): Item[] {
  const eligibility = items.find(item => item.id === "ELG-2026-04");
  if (!eligibility?.eligibility) return items;
  const accepted = eligibility.eligibility.stage === "Accepted";
  return items.map(item => {
    if (item.id !== "ROS-2026-04") return item;
    if (accepted) return item.execution === "Blocked" && item.next === "Wait for eligibility acceptance"
      ? { ...item, execution: "In progress", next: "Reconcile provider roster against accepted eligibility", impact: undefined } : item;
    return { ...item, execution: "Blocked", verification: "Pending", next: "Wait for eligibility acceptance", impact: "Dependent on ELG-2026-04" };
  });
}
