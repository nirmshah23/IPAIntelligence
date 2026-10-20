import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./eligibility.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { eligibilityTransition: transition, initializeEligibility: initialize, fileIssues, syncEligibilityDependency: sync } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const base = { id: "ELG-2026-04", title: "April eligibility", category: "Eligibility", payer: "Northstar", period: "April 2026", due: "May 5, 2026", owner: "Maya Chen", execution: "In progress", verification: "Pending", deadline: "At risk", risk: "High", next: "Validate" };
const valid = { reference: "FILE-v2 / VAL-2", expected: 18442, actual: 18442, invalid: 0, duplicates: 0, schemaPassed: true, encrypted: true };
const ready = () => transition(initialize(base), { type: "validate", file: valid });
const submitted = () => transition(ready(), { type: "receive", receipt: "SUB-1" });
const accept = item => transition(item, { type: "process", accepted: true, reference: "ACK-1", count: 18442, reason: "" });

test("April mismatch blocks processing until corrected and revalidated", () => {
  const initial = initialize(base);
  assert.equal(initial.eligibility.file.expected - initial.eligibility.file.actual, 142);
  assert.throws(() => transition(initial, { type: "receive", receipt: "SUB-1" }), /validation/);
  assert.equal(ready().eligibility.stage, "Ready to process");
  assert.equal(ready().verification, "Pending");
});
test("validation rejects invalid counts and blocks failed checks", () => {
  for (const count of [-1, 1.5, NaN, Infinity]) {
    assert.throws(() => transition(initialize(base), { type: "validate", file: { ...valid, actual: count } }), /whole numbers/);
  }
  for (const patch of [{ actual: 18400 }, { invalid: 1 }, { duplicates: 2 }, { schemaPassed: false }, { encrypted: false }, { expected: 0, actual: 0 }]) {
    const item = transition(initialize(base), { type: "validate", file: { ...valid, ...patch } });
    assert.equal(item.execution, "Blocked");
    assert.equal(item.verification, "Failed");
    assert.ok(fileIssues(item.eligibility.file).length);
  }
  assert.throws(() => transition(initialize(base), { type: "validate", file: { ...valid, reference: " " } }), /reference/);
});
test("incoming receipt requires owner and reference; pending processing is not completed", () => {
  assert.throws(() => transition({ ...ready(), owner: "Unassigned" }, { type: "receive", receipt: "SUB-1" }), /owner/);
  assert.throws(() => transition(ready(), { type: "receive", receipt: " " }), /receipt/);
  assert.equal(submitted().execution, "In progress");
  assert.equal(submitted().verification, "Pending");
});
test("acceptance requires receipt, processing report, and exact accepted count", () => {
  assert.throws(() => accept(ready()), /receipt/);
  assert.throws(() => transition(submitted(), { type: "process", accepted: true, reference: "ACK", count: 18441, reason: "" }), /count/);
  assert.throws(() => transition(submitted(), { type: "process", accepted: true, reference: " ", count: 18442, reason: "" }), /reference/);
  const result = accept(submitted());
  assert.equal(result.execution, "Completed");
  assert.equal(result.verification, "Verified");
  assert.equal(result.deadline, "At risk");
  assert.equal(result.eligibility.history.length, 4);
});
test("rejection requires rationale and correction invalidates prior evidence", () => {
  assert.throws(() => transition(submitted(), { type: "process", accepted: false, reference: "ACK", count: 0, reason: " " }), /reason/);
  const rejected = transition(submitted(), { type: "process", accepted: false, reference: "ACK-rejected", count: 0, reason: "Invalid member IDs" });
  assert.equal(rejected.eligibility.stage, "Rejected");
  assert.equal(rejected.verification, "Failed");
  const revised = transition(rejected, { type: "revise", reason: "Correct IDs" });
  assert.equal(revised.eligibility.stage, "Awaiting file");
  assert.equal(revised.eligibility.file, undefined);
  assert.equal(revised.eligibility.receipt, undefined);
  assert.equal(revised.eligibility.acknowledgment, undefined);
  assert.ok(revised.eligibility.history.some(event => event.text.includes("Invalid member IDs")));
  assert.throws(() => transition(revised, { type: "receive", receipt: "SUB-2" }), /validation/);
});
test("acceptance releases roster dependency; reopening blocks it again", () => {
  const roster = { ...base, id: "ROS-2026-04", category: "Provider Data", execution: "Blocked", next: "Wait for eligibility acceptance" };
  const accepted = accept(submitted());
  const released = sync([accepted, roster])[1];
  assert.equal(released.execution, "In progress");
  const reopened = transition(accepted, { type: "revise", reason: "New source correction" });
  const blocked = sync([reopened, released])[1];
  assert.equal(blocked.execution, "Blocked");
  assert.equal(blocked.next, "Wait for eligibility acceptance");
  assert.equal(reopened.verification, "Pending");
});
test("serialized cases preserve workflow and history", () => {
  const item = JSON.parse(JSON.stringify(submitted()));
  assert.equal(accept(item).eligibility.stage, "Accepted");
  assert.equal(initialize({ ...base, id: "ELG-other" }).eligibility.stage, "Awaiting file");
  assert.equal(initialize({ ...base, id: "ELG-2026-03" }).eligibility.stage, "Accepted");
});
