import { WorkflowHistory } from "./WorkflowHistory";
import { useState } from "react";
import type { Item } from "./types";
import { initializeWorkflow, workflowDefinitions, workflowTransition, type WorkflowAction } from "./workflows";

export function WorkflowDetail({ item: raw, update, back }: { item: Item; update: (id: string, patch: Partial<Item>, message: string) => void; back: () => void }) {
  const item = initializeWorkflow(raw);
  const state = item.workflow!;
  const definition = workflowDefinitions[item.category];
  const [owner, setOwner] = useState(item.owner);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [reviewer, setReviewer] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const editable = state.stage === "Preparation";
  const blocked = item.id === "ROS-2026-04" && item.next === "Wait for eligibility acceptance";
  function act(action: WorkflowAction) {
    try { const next = workflowTransition(item, action); update(item.id, next, "Workflow updated"); setError(""); setReference(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update workflow"); }
  }
  return <>
    <button className="back" onClick={back}>{"\u2190"} Back to obligations</button>
    <div className="page-head"><div><span className="eyebrow">{item.id} · {item.category}</span><h1>{item.title}</h1><p>{item.payer} · {item.period} · Due {item.due}</p></div></div>
    <div className="status-strip">{[["STAGE", state.stage], ["EXECUTION", item.execution], ["VERIFICATION", item.verification], ["DEADLINE", item.deadline]].map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
    {blocked && <div className="alert-panel danger" role="status">Provider roster work is blocked until ELG-2026-04 is accepted. Complete the eligibility workflow first.</div>}
    <div className="two-col wide-left">
      <section className="card"><div className="card-head"><div><h2>{item.category} evidence</h2><p>Record actual review results and source references for this occurrence.</p></div></div><div className="credential-actions">
        {definition.checks.map(check => <fieldset className="quality-measure" key={check} disabled={!editable || blocked}><legend>{check}</legend><p>{state.evidence[check] ? `${state.evidence[check].passed ? "Passed" : "Failed"}: ${state.evidence[check].reference}` : "Evidence required"}</p><label className="exception-control">Evidence reference and findings<textarea value={references[check] ?? state.evidence[check]?.reference ?? ""} onChange={event => setReferences({ ...references, [check]: event.target.value })} /></label><div className="head-actions"><button className="btn" onClick={() => act({ type: "evidence", check, reference: references[check] ?? state.evidence[check]?.reference ?? "", passed: true })}>Record pass</button> <button className="btn danger" onClick={() => act({ type: "evidence", check, reference: references[check] ?? state.evidence[check]?.reference ?? "", passed: false })}>Record failed check</button></div></fieldset>)}
      </div></section>
      <section className="card"><div className="card-head"><h2>Next required action</h2></div><div className="credential-actions"><b>{item.next}</b><label className="exception-control">Accountable owner<input value={owner} disabled={!editable} onChange={event => setOwner(event.target.value)} /></label><button className="btn secondary" disabled={!editable} onClick={() => act({ type: "owner", owner })}>Save owner</button>
        {editable && <button className="btn" disabled={blocked} onClick={() => act({ type: "submit" })}>Request independent review</button>}
        {state.stage === "Review" && <><p>{definition.outcome}. Review recorded evidence and recipient acceptance where required before approving.</p><label className="exception-control">Independent reviewer<input value={reviewer} onChange={event => setReviewer(event.target.value)} /></label><label className="exception-control">Decision reference and rationale<textarea value={reference} onChange={event => setReference(event.target.value)} /></label><button className="btn" onClick={() => act({ type: "decision", reviewer, reference, approved: true })}>{definition.outcome}</button><button className="btn danger" onClick={() => act({ type: "decision", reviewer, reference, approved: false })}>Reject for correction</button></>}
        {!editable && <><label className="exception-control">Correction / reopening reason<textarea value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn secondary" onClick={() => { act({ type: "reopen", reason }); setReferences({}); }}>Open correction cycle</button></>}
        {error && <p className="credential-error" role="alert">{error}</p>}
        <p>Evidence and decisions are recorded locally in this demo. External submissions must be completed in the relevant system.</p>
      </div></section>
    </div>
    <section className="card"><div className="card-head"><h2>Activity & evidence history</h2></div><WorkflowHistory entries={state.history} /></section>
  </>;
}

