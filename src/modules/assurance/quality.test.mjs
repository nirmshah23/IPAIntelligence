import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./quality.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { qualityTransition: transition, initializeQuality: initialize, qualityIssues, isQuality } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const base = { id: "QLM-TEST", title: "Quality report", category: "Quality Management", payer: "HarborCare", period: "Q1 2026", due: "May 12, 2026", owner: "Priya Shah", execution: "Not started", verification: "Pending", deadline: "At risk", risk: "High", next: "Prepare" };
const row = { name: "Measure A", numerator: 45, denominator: 100, exclusions: 10, missing: 0, duplicates: 0 };
const packet = { source: "EXT-v2 / VAL-2", specification: "Payer 2026 v2", schemaPassed: true, measures: [row] };
const validate = (data = packet, item = initialize(base)) => transition(item, { type: "validate", packet: data });
const approve = item => transition(item, { type: "review", approved: true, reviewer: "Alex Morgan", reference: "REVIEW-1: checked source and specification" });
const ready = () => approve(validate());
const submit = item => transition(item, { type: "submit", receipt: "SUB-1" });
const accept = (item, count = 1) => transition(item, { type: "response", accepted: true, reference: "ACK-1", count, reason: "" });

test("Quality and Quality Management get workflows while other categories stay unchanged", () => {
  assert.ok(isQuality(base));
  assert.ok(isQuality({ ...base, category: "Quality" }));
  assert.equal(initialize(base).quality.stage, "Prepare");
  const other = { ...base, category: "Claims" };
  assert.equal(initialize(other), other);
  const pending = initialize({ ...base, id: "QLT-2026-Q1", category: "Quality" });
  assert.equal(pending.quality.stage, "Awaiting payer");
  assert.ok(pending.quality.receipt.startsWith("DEMO-"));
});
test("measure validation rejects invalid populations, exclusions, duplicates, and schema failures", () => {
  for (const change of [{ denominator: 0 }, { numerator: 91 }, { exclusions: 100 }, { missing: 2 }, { duplicates: 1 }]) {
    const failed = validate({ ...packet, measures: [{ ...row, ...change }] });
    assert.equal(failed.quality.stage, "Prepare");
    assert.equal(failed.verification, "Failed");
    assert.equal(failed.execution, "Blocked");
  }
  for (const data of [{ ...packet, measures: [] }, { ...packet, schemaPassed: false }, { ...packet, measures: [row, { ...row, name: " measure a " }] }, { ...packet, measures: [{ ...row, name: "" }] }]) {
    assert.ok(qualityIssues(data).length);
    assert.equal(validate(data).quality.stage, "Prepare");
  }
  for (const value of [-1, 1.5, NaN, Infinity]) assert.throws(() => validate({ ...packet, measures: [{ ...row, numerator: value }] }), /whole numbers/);
  assert.throws(() => validate({ ...packet, source: " " }), /source/);
  assert.throws(() => validate({ ...packet, specification: " " }), /specification/);
});
test("low measure rates remain reportable and independent review is required", () => {
  const checked = validate({ ...packet, measures: [{ ...row, numerator: 0 }] });
  assert.equal(checked.quality.stage, "Review");
  assert.throws(() => submit(checked), /reviewer approval/);
  assert.throws(() => transition(checked, { type: "review", approved: true, reviewer: " priya shah ", reference: "REF" }), /different/);
  assert.throws(() => transition(checked, { type: "review", approved: true, reviewer: "Alex Morgan", reference: " " }), /reference/);
  assert.equal(approve(checked).quality.stage, "Ready to submit");
  const returned = transition(checked, { type: "review", approved: false, reviewer: "Alex Morgan", reference: "Correct attribution" });
  assert.equal(returned.quality.stage, "Prepare");
  assert.equal(returned.quality.reviewer, undefined);
});
test("owner and receipt guard submission and review roles cannot be bypassed", () => {
  assert.throws(() => submit({ ...ready(), owner: "Unassigned" }), /owner/);
  assert.throws(() => transition(ready(), { type: "submit", receipt: " " }), /receipt/);
  assert.throws(() => transition(ready(), { type: "owner", owner: "Alex Morgan" }), /differ/);
  assert.throws(() => submit({ ...ready(), owner: "Alex Morgan" }), /differ/);
  const sent = submit(ready());
  assert.equal(sent.execution, "Submitted / awaiting verification");
  assert.equal(sent.verification, "Pending");
  assert.throws(() => validate(packet, sent), /correction/);
});
test("payer acceptance requires submission, acknowledgment, and all submitted measures", () => {
  assert.throws(() => accept(ready()), /submission/);
  assert.throws(() => accept(submit(ready()), 0), /all 1/);
  assert.throws(() => accept(submit(ready()), 1.5), /all 1/);
  assert.throws(() => transition(submit(ready()), { type: "response", accepted: true, reference: " ", count: 1, reason: "" }), /reference/);
  const complete = accept(submit(ready()));
  assert.equal(complete.execution, "Completed");
  assert.equal(complete.verification, "Verified");
  assert.equal(complete.deadline, "At risk");
  assert.equal(complete.quality.history.length, 4);
  assert.throws(() => accept(complete), /submission/);
});
test("rejection and partial acceptance require rationale and correction resets all approvals", () => {
  const sent = submit(ready());
  assert.throws(() => transition(sent, { type: "response", accepted: false, reference: "ACK", count: 0, reason: " " }), /reason/);
  const rejected = transition(sent, { type: "response", accepted: false, reference: "ACK-PARTIAL", count: 0, reason: "Partial acceptance: one measure needs correction" });
  assert.equal(rejected.quality.stage, "Rejected");
  assert.equal(rejected.verification, "Failed");
  assert.throws(() => transition(rejected, { type: "revise", reason: " " }), /reason/);
  const revised = transition(rejected, { type: "revise", reason: "Correct measure specification" });
  assert.equal(revised.quality.stage, "Prepare");
  for (const key of ["reviewer", "reviewReference", "receipt", "acknowledgment"]) assert.equal(revised.quality[key], undefined);
  assert.equal(revised.quality.source, packet.source);
  assert.ok(revised.quality.history.some(event => event.text.includes("Partial acceptance")));
  assert.throws(() => submit(revised), /validation/);
  assert.equal(accept(submit(approve(validate(packet, revised)))).quality.stage, "Accepted");
});
test("encounter certification reconciles records and acknowledgment uses record count", () => {
  const encounter = initialize({ ...base, id: "ENC-2026-04", category: "Quality" });
  const mismatched = { ...packet, measures: [{ ...row, name: "April encounters", exclusions: 0, numerator: 99 }] };
  assert.equal(validate(mismatched, encounter).quality.stage, "Prepare");
  const correct = { ...mismatched, measures: [{ ...mismatched.measures[0], numerator: 100 }] };
  const sent = submit(approve(validate(correct, encounter)));
  assert.throws(() => accept(sent, 1), /all 100 submitted records/);
  assert.equal(accept(sent, 100).verification, "Verified");
});
test("reopening completed reports requires revalidation and history survives serialization", () => {
  const complete = JSON.parse(JSON.stringify(accept(submit(ready()))));
  const reopened = transition(complete, { type: "revise", reason: "Updated source extract" });
  assert.equal(reopened.verification, "Pending");
  assert.equal(reopened.quality.stage, "Prepare");
  assert.equal(reopened.quality.receipt, undefined);
  assert.equal(reopened.quality.history.length, 5);
  assert.ok(reopened.quality.history.some(event => event.text.includes('"numerator":45')));
});
