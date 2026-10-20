import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("./workflows.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { initializeWorkflow, workflowDefinitions, workflowTransition: act } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const base = { id: "TEST", owner: "Alex", execution: "Not started", verification: "Pending", category: "Claims" };
test("every category requires complete evidence and independent approval", () => {
  for (const category of Object.keys(workflowDefinitions)) {
    let item = initializeWorkflow({ ...base, category });
    assert.throws(() => act(item, { type: "submit" }));
    for (const check of workflowDefinitions[category].checks) item = act(item, { type: "evidence", check, reference: "Report-1", passed: true });
    item = act(item, { type: "submit" });
    assert.throws(() => act(item, { type: "decision", reviewer: " alex ", reference: "APP-1", approved: true }));
    item = act(item, { type: "decision", reviewer: "Sam", reference: "APP-1", approved: true });
    assert.equal(item.verification, "Verified");
    assert.throws(() => act(item, { type: "evidence", check: workflowDefinitions[category].checks[0], reference: "edit", passed: true }));
    item = act(item, { type: "reopen", reason: "New source" });
    assert.equal(item.verification, "Pending");
    assert.equal(Object.keys(item.workflow.evidence).length, 0);
    assert.ok(item.workflow.history.length >= 6);
  }
});
test("failed evidence, rejection, unassigned owners and roster dependency block completion", () => {
  let item = initializeWorkflow(base);
  const check = workflowDefinitions.Claims.checks[0];
  item = act(item, { type: "evidence", check, reference: "Variance", passed: false });
  assert.equal(item.verification, "Failed");
  assert.throws(() => act(item, { type: "submit" }));
  for (const check of workflowDefinitions.Claims.checks) item = act(item, { type: "evidence", check, reference: "Fixed", passed: true });
  assert.throws(() => act({ ...item, owner: "Unassigned" }, { type: "submit" }));
  item = act(item, { type: "submit" });
  item = act(item, { type: "decision", reviewer: "Sam", reference: "Missing proof", approved: false });
  assert.equal(item.workflow.stage, "Rejected");
  assert.equal(item.verification, "Failed");
  assert.throws(() => act(item, { type: "submit" }));
  const roster = initializeWorkflow({ ...base, id: "ROS-2026-04", category: "Provider Data" });
  assert.throws(() => act(roster, { type: "evidence", check: workflowDefinitions["Provider Data"].checks[0], reference: "Roster", passed: true }), /Eligibility/);
});
