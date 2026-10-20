import { WorkflowHistory } from "./WorkflowHistory";
import { useState } from "react";
import type { Item } from "./types";

type Props = { item: Item; back: () => void; update: (id: string, patch: Partial<Item>, message: string) => void };
export function CredentialingDetail({ item, back, update }: Props) {
  const facility = item.id.startsWith("FAC-");
  const checks = facility
    ? ["Application and ownership disclosure", "Facility license", "Accreditation", "Liability insurance", "Sanctions and exclusions"]
    : ["Application and attestation", "Professional license", "Board certification / qualifications", "Malpractice coverage and claims", "Sanctions and exclusions"];
  const workflow = item.credentialing ?? { stage: "Verification" as const, checks: {}, history: [] };
  const [references, setReferences] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState(item.owner);
  const [error, setError] = useState("");
  const completed = checks.filter(check => workflow.checks[check]?.result === "Passed").length;
  const failed = checks.some(check => workflow.checks[check]?.result === "Failed");
  const terminal = workflow.stage === "Approved" || workflow.stage === "Denied";
  const commit = (text: string, patch: Partial<Item>, change: Partial<NonNullable<Item["credentialing"]>> = {}) => {
    update(item.id, { ...patch, credentialing: { ...workflow, ...change, history: [{ at: new Date().toISOString(), text }, ...workflow.history] } }, text);
    setError("");
  };
  function record(check: string, result: "Passed" | "Failed") {
    const reference = references[check]?.trim();
    if (!reference) return setError(`Add an evidence reference for ${check.toLowerCase()}.`);
    const nextChecks = { ...workflow.checks, [check]: { result, reference, at: new Date().toISOString() } };
    const hasFailure = checks.some(key => nextChecks[key]?.result === "Failed");
    const ready = checks.every(key => nextChecks[key]?.result === "Passed");
    commit(`${check}: ${result.toLowerCase()} — ${reference}`, {
      execution: hasFailure ? "Blocked" : "In progress", verification: hasFailure ? "Failed" : "Pending",
      next: hasFailure ? "Resolve failed credential checks" : ready ? "Submit packet to committee" : `Verify ${checks.find(key => nextChecks[key]?.result !== "Passed")?.toLowerCase()}`,
    }, { checks: nextChecks });
  }
  function decision(approved: boolean) {
    if (workflow.stage !== "Committee review" || completed !== checks.length || item.owner === "Unassigned") return;
    if (!note.trim()) return setError("Record the committee decision reference and rationale.");
    commit(`Committee ${approved ? "approval" : "denial"}: ${note.trim()}`, {
      execution: approved ? "Completed" : "Blocked", verification: approved ? "Verified" : "Failed",
      next: approved ? "No action" : "Review committee denial and remediate", ...(approved ? { impact: undefined } : {}),
    }, { stage: approved ? "Approved" : "Denied" });
    setNote("");
  }
  return <div className="credential-workflow">
    <button className="back" onClick={back}>← Back to obligations</button>
    <div className="page-head"><div><div className="eyebrow">{item.id} · {facility ? "Facility renewal" : "Provider credentialing"}</div><h1>{item.title}</h1><p>{item.payer} · {item.period} · Due {item.due}</p></div><span className="chip">{workflow.stage}</span></div>
    <div className="status-strip">{[["Owner", item.owner], ["Execution", item.execution], ["Verification", item.verification], ["Deadline", item.deadline]].map(([label, value]) => <div key={label}><small>{label.toUpperCase()}</small><b>{value}</b></div>)}</div>
    <ol className="credential-steps" aria-label="Credentialing stages">{["Verification", "Committee review", "Decision"].map((stage, index) => <li key={stage} aria-current={(terminal ? index === 2 : stage === workflow.stage) ? "step" : undefined}>{index + 1}. {stage}</li>)}</ol>
    <div className="two-col wide-left"><section className="card"><div className="card-head"><div><h2>Primary-source verification</h2><p>{completed} of {checks.length} checks passed. Record a source, document ID, and validity date where applicable.</p></div></div>
      <div className="credential-checks">{checks.map(check => { const result = workflow.checks[check]; return <div className="credential-check" key={check}><div><b>{check}</b><span className={`chip ${result?.result === "Passed" ? "green" : result ? "red" : "slate"}`}>{result?.result ?? "Not reviewed"}</span></div>{result && <p>{result.reference} · {new Date(result.at).toLocaleString()}</p>}
        {workflow.stage === "Verification" && <><label className="exception-control">Evidence reference<input value={references[check] ?? ""} onChange={event => setReferences(current => ({ ...current, [check]: event.target.value }))} placeholder="Source / document ID / validity date" aria-label={`${check} evidence reference`} /></label><div className="head-actions"><button className="btn secondary" onClick={() => record(check, "Failed")}>Record issue</button><button className="btn" onClick={() => record(check, "Passed")}>Mark verified</button></div></>}
      </div>; })}</div></section>
      <section className="card"><div className="card-head"><h2>Next required action</h2></div><div className="credential-actions"><b>{item.next}</b><label className="exception-control">Accountable owner<input value={owner} onChange={event => setOwner(event.target.value)} disabled={terminal} /></label><button className="btn secondary" disabled={terminal || !owner.trim() || owner.trim() === item.owner} onClick={() => commit(`Owner assigned to ${owner.trim()}`, { owner: owner.trim() })}>Save owner</button>
        {workflow.stage === "Verification" && <><p>All checks must pass and an owner must be assigned before committee review.</p><button className="btn" disabled={completed !== checks.length || failed || item.owner === "Unassigned"} onClick={() => commit("Credentialing packet submitted to committee", { execution: "Submitted / awaiting verification", verification: "Pending", next: "Record committee decision" }, { stage: "Committee review" })}>Submit to committee</button></>}
        {(workflow.stage === "Committee review" || terminal) && <label className="exception-control">{terminal ? "Reason for reopening" : "Committee decision reference and rationale"}<textarea value={note} onChange={event => setNote(event.target.value)} /></label>}
        {workflow.stage === "Committee review" && <><button className="btn" disabled={!note.trim()} onClick={() => decision(true)}>Record approval</button><button className="btn danger" disabled={!note.trim()} onClick={() => decision(false)}>Record denial</button><button className="btn secondary" disabled={!note.trim()} onClick={() => { commit(`Returned for verification: ${note.trim()}`, { execution: "In progress", next: "Review evidence and resubmit packet" }, { stage: "Verification" }); setNote(""); }}>Return for corrections</button></>}
        {terminal && <><p>{workflow.stage === "Approved" ? "Credentialing completed with recorded evidence and committee approval." : "Case remains blocked pending remediation of the committee decision."}</p><button className="btn secondary" disabled={!note.trim()} onClick={() => { commit(`Case reopened: ${note.trim()}`, { execution: "In progress", verification: "Pending", next: "Revalidate credentials before resubmission" }, { stage: "Verification", checks: {} }); setNote(""); }}>Reopen for verification</button></>}
        {error && <p role="alert" className="credential-error">{error}</p>}
      </div></section></div>
    <section className="card"><div className="card-head"><div><h2>Case activity & evidence history</h2><p>Actions recorded in this demo on this browser. No external verification service is connected.</p></div></div><WorkflowHistory entries={workflow.history} /></section>
  </div>;
}
