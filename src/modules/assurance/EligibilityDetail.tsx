import { WorkflowHistory } from "./WorkflowHistory";
import { useState } from "react";
import type { Item } from "./types";
import { eligibilityTransition, fileIssues, type EligibilityFile } from "./eligibility";

type Props = { item: Item; back: () => void; update: (id: string, patch: Partial<Item>, message: string) => void };
export function EligibilityDetail({ item, back, update }: Props) {
  const state = item.eligibility!;
  const [file, setFile] = useState<EligibilityFile>(state.file ?? { reference: "", expected: 0, actual: 0, invalid: 0, duplicates: 0, schemaPassed: false, encrypted: false });
  const [owner, setOwner] = useState(item.owner);
  const [receipt, setReceipt] = useState("");
  const [ack, setAck] = useState("");
  const [acceptedCount, setAcceptedCount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const editable = state.stage === "Prepare" || state.stage === "Reconcile";
  const issues = state.file ? fileIssues(state.file) : [];
  function act(action: Parameters<typeof eligibilityTransition>[1]) {
    try {
      const next = eligibilityTransition(item, action);
      update(item.id, next, next.eligibility!.history[0].text);
      setError("");
      if (action.type === "revise") {
        setFile({ reference: "", expected: state.file?.expected ?? 0, actual: 0, invalid: 0, duplicates: 0, schemaPassed: false, encrypted: false });
        setReceipt(""); setAck(""); setAcceptedCount(""); setReason("");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update this case."); }
  }
  const step = state.stage === "Accepted" ? 3 : ["Awaiting payer", "Rejected"].includes(state.stage) ? 2 : state.stage === "Ready to submit" ? 1 : 0;
  return <div className="credential-workflow eligibility-workflow">
    <button className="back" onClick={back}>← Back to obligations</button>
    <div className="page-head"><div><div className="eyebrow">{item.id} · ELIGIBILITY</div><h1>{item.title}</h1><p>{item.payer} · {item.period} · Due {item.due}</p></div><span className={`chip ${state.stage === "Accepted" ? "green" : state.stage === "Rejected" || item.verification === "Failed" ? "red" : "slate"}`}>{state.stage}</span></div>
    <div className="status-strip">{[["Owner", item.owner], ["Execution", item.execution], ["Verification", item.verification], ["Deadline", item.deadline]].map(([label, value]) => <div key={label}><small>{label.toUpperCase()}</small><b>{value}</b></div>)}</div>
    <ol className="credential-steps" aria-label="Eligibility stages">{["Prepare & reconcile", "Submit file", "Payer response", "Verified"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}>{index + 1}. {label}</li>)}</ol>
    <div className="two-col wide-left"><section className="card"><div className="card-head"><div><h2>File validation & reconciliation</h2><p>Record results from the source file and validation report for this reporting period.</p></div></div><div className="credential-actions">
      {state.stage === "Accepted" && !state.file && <p>This archived demo cycle was previously verified. Historical validation details are unavailable; reopen the cycle to record a new file.</p>}
      {(state.file || editable) && <><label className="exception-control">Source file / validation report reference<input value={file.reference} disabled={!editable} onChange={event => setFile({ ...file, reference: event.target.value })} placeholder="File version and validation report ID" /></label>
      <div className="eligibility-counts">{([["expected", "Expected source records"], ["actual", "File record count"], ["invalid", "Invalid records"], ["duplicates", "Duplicate records"]] as const).map(([key, label]) => <label className="exception-control" key={key}>{label}<input type="number" min="0" step="1" value={Number.isNaN(file[key]) ? "" : file[key]} disabled={!editable} onChange={event => setFile({ ...file, [key]: event.target.value === "" ? NaN : Number(event.target.value) })} /></label>)}</div>
      <label className="exception-check"><input type="checkbox" checked={file.schemaPassed} disabled={!editable} onChange={event => setFile({ ...file, schemaPassed: event.target.checked })} />Schema and required-field validation passed</label>
      <label className="exception-check"><input type="checkbox" checked={file.encrypted} disabled={!editable} onChange={event => setFile({ ...file, encrypted: event.target.checked })} />Submission file encrypted</label></>}
      {editable && <button className="btn" onClick={() => act({ type: "validate", file })}>Record validation results</button>}
      {state.file && <div className={`eligibility-validation ${issues.length ? "has-issues" : "passed"}`} role="status"><b>{issues.length ? "Submission blocked" : "Validation passed"}</b>{issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>Control totals match. Schema, encryption, invalid-record, and duplicate checks passed.</p>}{editable && <p>Results above reflect the last recorded validation. Record edited values to update them.</p>}</div>}
      {state.receipt && <div className="field"><small>SUBMISSION RECEIPT</small><b>{state.receipt}</b></div>}
      {state.acknowledgment && <div className="field"><small>PAYER ACKNOWLEDGMENT</small><b>{state.acknowledgment}</b></div>}
    </div></section>
    <section className="card"><div className="card-head"><h2>Next required action</h2></div><div className="credential-actions"><b>{item.next}</b>
      <label className="exception-control">Accountable owner<input value={owner} disabled={state.stage === "Accepted"} onChange={event => setOwner(event.target.value)} /></label><button className="btn secondary" disabled={state.stage === "Accepted" || !owner.trim() || owner.trim() === item.owner} onClick={() => act({ type: "owner", owner })}>Save owner</button>
      {state.stage === "Ready to submit" && <><label className="exception-control">Payer gateway submission receipt<input value={receipt} onChange={event => setReceipt(event.target.value)} placeholder="Receipt ID from your submission gateway" /></label><p>Record the receipt after transmitting the validated file through your payer gateway.</p><button className="btn" disabled={!receipt.trim() || item.owner === "Unassigned"} onClick={() => act({ type: "submit", receipt })}>Record submission</button></>}
      {state.stage === "Awaiting payer" && <><label className="exception-control">Payer acknowledgment reference<input value={ack} onChange={event => setAck(event.target.value)} /></label><label className="exception-control">Accepted record count<input type="number" min="0" step="1" value={acceptedCount} onChange={event => setAcceptedCount(event.target.value)} /></label><label className="exception-control">Rejection reason<textarea value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn" disabled={!ack.trim() || !acceptedCount.trim()} onClick={() => act({ type: "response", accepted: true, reference: ack, count: Number(acceptedCount), reason: "" })}>Record acceptance</button><button className="btn danger" disabled={!ack.trim() || !reason.trim()} onClick={() => act({ type: "response", accepted: false, reference: ack, count: 0, reason })}>Record rejection</button></>}
      {!editable && state.stage !== "Awaiting payer" && <><label className="exception-control">{state.stage === "Accepted" ? "Reason for reopening" : "Correction plan"}<textarea value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn secondary" disabled={!reason.trim()} onClick={() => act({ type: "revise", reason })}>{state.stage === "Accepted" ? "Reopen eligibility cycle" : "Prepare corrected file"}</button></>}
      {error && <p className="credential-error" role="alert">{error}</p>}
      {item.id === "ELG-2026-04" && <div className="eligibility-dependency"><b>Dependent work: ROS-2026-04</b><p>{state.stage === "Accepted" ? "Eligibility acceptance releases provider roster reconciliation for processing." : "Provider roster reconciliation stays blocked until payer acceptance is recorded."}</p></div>}
    </div></section></div>
    <section className="card"><div className="card-head"><div><h2>Activity & evidence history</h2><p>Manually recorded results saved in this browser. File validation and payer transmission services are not connected.</p></div></div><WorkflowHistory entries={state.history} /></section>
  </div>;
}
