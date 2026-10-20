import type { Item } from "./types";

export type Quality = NonNullable<Item["quality"]>;
export type QualityPacket = Pick<Quality, "measures" | "source" | "specification" | "schemaPassed">;
export const isQuality = (item: Item) => ["Quality", "Quality Management"].includes(item.category);
export const isEncounter = (item: Item) => item.id.startsWith("ENC-");
export function qualityIssues(packet: QualityPacket, encounter = false): string[] {
  const issues: string[] = [];
  if (!packet.source.trim()) issues.push("Record the source extract / validation report reference.");
  if (!packet.specification.trim()) issues.push("Record the reporting specification and version.");
  if (!packet.schemaPassed) issues.push("Schema and required-field validation must pass.");
  if (!packet.measures.length) issues.push("Add at least one measure or encounter control total.");
  const names = new Set<string>();
  packet.measures.forEach((measure, index) => {
    const label = measure.name.trim() || `Row ${index + 1}`;
    if (!measure.name.trim()) issues.push(`${label}: add a measure / dataset name.`);
    if (names.has(label.toLowerCase())) issues.push(`${label}: duplicate measure / dataset name.`);
    names.add(label.toLowerCase());
    if ([measure.numerator, measure.denominator, measure.exclusions, measure.missing, measure.duplicates].some(value => !Number.isSafeInteger(value) || value < 0)) issues.push(`${label}: counts must be nonnegative whole numbers.`);
    if (measure.denominator <= 0) issues.push(`${label}: ${encounter ? "expected records" : "population"} must be greater than zero.`);
    if (measure.exclusions >= measure.denominator) issues.push(`${label}: exclusions must leave an eligible population.`);
    if (measure.numerator > measure.denominator - measure.exclusions) issues.push(`${label}: numerator exceeds the eligible population.`);
    if (measure.missing !== 0) issues.push(`${label}: resolve ${measure.missing} missing required fields.`);
    if (measure.duplicates !== 0) issues.push(`${label}: resolve ${measure.duplicates} duplicate records.`);
    if (encounter && (measure.exclusions !== 0 || measure.numerator !== measure.denominator)) issues.push(`${label}: certified records must match expected records, with zero exclusions.`);
  });
  return issues;
}
type Action =
  | { type: "validate"; packet: QualityPacket }
  | { type: "review"; approved: boolean; reviewer: string; reference: string }
  | { type: "submit"; receipt: string }
  | { type: "response"; accepted: boolean; reference: string; count: number; reason: string }
  | { type: "revise"; reason: string }
  | { type: "owner"; owner: string };
export function qualityTransition(item: Item, action: Action, at = new Date().toISOString()): Item {
  const state = item.quality;
  if (!state || !isQuality(item)) throw new Error("Quality case is not initialized.");
  let patch: Partial<Item> = {};
  let change: Partial<Quality> = {};
  let text = "";
  switch (action.type) {
    case "owner": {
      const owner = action.owner.trim();
      if (!owner || owner.toLowerCase() === "unassigned" || state.stage === "Accepted") throw new Error("Assign a named owner to an open case.");
      if (owner.toLowerCase() === state.reviewer?.toLowerCase()) throw new Error("Owner must differ from the recorded reviewer; reopen review to change roles.");
      patch = { owner }; text = `Owner assigned: ${owner}`; break;
    }
    case "validate": {
      if (state.stage !== "Prepare") throw new Error("Return the packet for correction before changing its data.");
      const packet = action.packet;
      if (!packet.source.trim() || !packet.specification.trim()) throw new Error("Record the source report and specification version.");
      if (packet.measures.some(row => [row.numerator, row.denominator, row.exclusions, row.missing, row.duplicates].some(value => !Number.isSafeInteger(value) || value < 0))) throw new Error("Counts must be nonnegative whole numbers.");
      const issues = qualityIssues(packet, isEncounter(item));
      change = { ...packet, measures: packet.measures.map(row => ({ ...row, name: row.name.trim() })), stage: issues.length ? "Prepare" : "Review", reviewer: undefined, reviewReference: undefined, receipt: undefined, acknowledgment: undefined };
      patch = { execution: issues.length ? "Blocked" : "In progress", verification: issues.length ? "Failed" : "Pending", next: issues.length ? "Resolve quality validation issues" : "Obtain independent quality review" };
      text = `Validation for ${item.period} · ${packet.source} · specification ${packet.specification}: ${issues.length ? issues.join(" ") : "All data checks passed."} Data: ${JSON.stringify(packet.measures)}; schema ${packet.schemaPassed ? "passed" : "failed"}.`;
      break;
    }
    case "review": {
      if (state.stage !== "Review" || qualityIssues(state, isEncounter(item)).length) throw new Error("Validate the packet before review.");
      const reviewer = action.reviewer.trim();
      if (!reviewer || reviewer.toLowerCase() === "unassigned" || reviewer.toLowerCase() === item.owner.trim().toLowerCase()) throw new Error("Record a named reviewer different from the owner.");
      if (!action.reference.trim()) throw new Error("Record the review reference and rationale.");
      change = { stage: action.approved ? "Ready to submit" : "Prepare", reviewer: action.approved ? reviewer : undefined, reviewReference: action.approved ? action.reference.trim() : undefined };
      patch = { execution: "In progress", verification: "Pending", next: action.approved ? "Record quality submission receipt" : "Correct quality packet and rerun validation" };
      text = `Review ${action.approved ? "approved" : "returned for correction"} by ${reviewer}: ${action.reference.trim()}`;
      break;
    }
    case "submit": {
      if (state.stage !== "Ready to submit" || !state.reviewer || !state.reviewReference || qualityIssues(state, isEncounter(item)).length) throw new Error("Complete validation and reviewer approval before submission.");
      if (!item.owner.trim() || item.owner.trim().toLowerCase() === "unassigned") throw new Error("Assign an owner before submission.");
      if (item.owner.trim().toLowerCase() === state.reviewer.toLowerCase()) throw new Error("Reviewer must differ from owner.");
      if (!action.receipt.trim()) throw new Error("Record a payer gateway submission receipt.");
      change = { stage: "Awaiting payer", receipt: action.receipt.trim() };
      patch = { execution: "Submitted / awaiting verification", verification: "Pending", next: "Record quality payer acknowledgment" };
      text = `Submission ${action.receipt.trim()} recorded for ${item.period} · ${state.measures.length} ${isEncounter(item) ? "datasets" : "measures"} · reviewed by ${state.reviewer}`;
      break;
    }
    case "response": {
      if (state.stage !== "Awaiting payer" || !state.receipt) throw new Error("Record submission before payer acknowledgment.");
      if (!action.reference.trim()) throw new Error("Record a payer acknowledgment reference.");
      const expected = isEncounter(item) ? state.measures.reduce((sum, row) => sum + row.numerator, 0) : state.measures.length;
      if (action.accepted && (!Number.isSafeInteger(action.count) || action.count !== expected)) throw new Error(`Acceptance must cover all ${expected} submitted ${isEncounter(item) ? "records" : "measures"}.`);
      if (!action.accepted && !action.reason.trim()) throw new Error("Record the rejection reason.");
      change = { stage: action.accepted ? "Accepted" : "Rejected", acknowledgment: action.reference.trim() };
      patch = { execution: action.accepted ? "Completed" : "Blocked", verification: action.accepted ? "Verified" : "Failed", next: action.accepted ? "No action" : "Correct rejected quality packet and resubmit", ...(action.accepted ? { impact: undefined } : {}) };
      text = `Payer ${action.accepted ? `accepted all ${action.count} ${isEncounter(item) ? "records" : "measures"}` : `rejected packet: ${action.reason.trim()}`} · ${action.reference.trim()} · receipt ${state.receipt}`;
      break;
    }
    case "revise": {
      if (state.stage === "Prepare") throw new Error("Packet is already open for preparation.");
      if (!action.reason.trim()) throw new Error("Record the reason for correction or reopening.");
      change = { stage: "Prepare", reviewer: undefined, reviewReference: undefined, receipt: undefined, acknowledgment: undefined };
      patch = { execution: "In progress", verification: "Pending", next: "Correct quality packet and rerun validation" };
      text = `Packet reopened: ${action.reason.trim()}. Prior review and submission invalidated; evidence retained in history.`;
      break;
    }
  }
  return { ...item, ...patch, quality: { ...state, ...change, history: [{ at, text }, ...state.history] } };
}
export function initializeQuality(item: Item): Item {
  if (!isQuality(item) || item.quality) return item;
  const quality: Quality = { stage: "Prepare", source: "", specification: "", schemaPassed: false, measures: [], history: [] };
  if (item.id === "QLT-2026-Q1") {
    return { ...item, quality: { ...quality, stage: "Awaiting payer", source: "DEMO-Q1-EXTRACT / VAL-QLT-Q1", specification: "Demo Q1 2026 reporting specification v1", schemaPassed: true,
      measures: [{ name: "Demo preventive screening measure", numerator: 420, denominator: 600, exclusions: 0, missing: 0, duplicates: 0 }], reviewer: "Alex Morgan", reviewReference: "DEMO-REVIEW-Q1", receipt: "DEMO-SUB-QLT-Q1", history: [{ at: "2026-05-08T14:00:00Z", text: "Demo packet: one sample measure validated, reviewed by Alex Morgan, and submitted under DEMO-SUB-QLT-Q1. Payer acknowledgment pending." }] } };
  }
  return { ...item, execution: "Not started", verification: "Pending", next: isEncounter(item) ? "Prepare encounter control totals and validation report" : "Prepare quality measures and source evidence", quality };
}
