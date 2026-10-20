import { useState } from "react";
import type { Item } from "./types";
import { isEncounter, qualityIssues, qualityTransition, type QualityPacket } from "./quality";

type Props = { item: Item; back: () => void; update: (id: string, patch: Partial<Item>, message: string) => void };
export function QualityDetail({ item, back, update }: Props) {
  const state = item.quality!;
  const encounter = isEncounter(item);
  const [packet, setPacket] = useState<QualityPacket>({ source: state.source, specification: state.specification, schemaPassed: state.schemaPassed, measures: state.measures });
  const [owner, setOwner] = useState(item.owner);
  const [reviewer, setReviewer] = useState("");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const [ack, setAck] = useState("");
  const [count, setCount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const editable = state.stage === "Prepare";
  const [validated, setValidated] = useState(false);
  const issues = qualityIssues(state, encounter);
  const expectedAcceptance = encounter ? state.measures.reduce((sum, row) => sum + row.numerator, 0) : state.measures.length;
  function act(action: Parameters<typeof qualityTransition>[1]) {
    try {
      const next = qualityTransition(item, action);
      update(item.id, next, action.type === "validate" ? (next.quality!.stage === "Review" ? "Validation passed. Packet ready for quality review." : "Validation recorded. Resolve the listed issues.") : "Quality obligation updated.");
      setError("");
      if (action.type === "validate") setValidated(true);
      if (action.type === "revise" || action.type === "review") { setReason(""); setReference(""); setReviewer(""); setReceipt(""); setAck(""); setCount(""); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update quality obligation."); }
  }
  const stages = ["Prepare", "Review", "Ready to submit", "Awaiting payer", "Accepted"];
  const current = state.stage === "Rejected" ? 3 : stages.indexOf(state.stage);
  return <div className="credential-workflow quality-workflow">
    <button className="back" onClick={back}>← Back to obligations</button>
    <div className="page-head"><div><div className="eyebrow">{item.id} · {encounter ? "ENCOUNTER CERTIFICATION" : "QUALITY REPORTING"}</div><h1>{item.title}</h1><p>{item.payer} · Reporting period: {item.period} · Due {item.due}</p></div><span className={`chip ${state.stage === "Accepted" ? "green" : state.stage === "Rejected" ? "red" : "slate"}`}>{state.stage}</span></div>
    <div className="status-strip">{[["Owner", item.owner], ["Execution", item.execution], ["Verification", item.verification], ["Deadline", item.deadline]].map(([label, value]) => <div key={label}><small>{label.toUpperCase()}</small><b>{value}</b></div>)}</div>
    <ol className="credential-steps" aria-label="Quality reporting stages">{["Prepare & validate", "Quality review", "Submit", "Payer response", "Verified"].map((label, index) => <li key={label} aria-current={current === index ? "step" : undefined}>{index + 1}. {label}</li>)}</ol>
    <div className="two-col wide-left"><section className="card"><div className="card-head"><div><h2>{encounter ? "Encounter control totals" : "Quality measures & data validation"}</h2><p>{encounter ? "Certified records must match the expected source count." : "Validate population, exclusions, and numerator counts against the reporting specification."}</p></div></div>
      <div className="credential-actions"><label className="exception-control">Source extract / validation report reference<input value={packet.source} disabled={!editable} onChange={event => setPacket({ ...packet, source: event.target.value })} placeholder="Extract version and validation report ID" /></label>
        <label className="exception-control">Reporting specification / version<input value={packet.specification} disabled={!editable} onChange={event => setPacket({ ...packet, specification: event.target.value })} placeholder="Payer measure set or encounter format and version" /></label>
        {packet.measures.map((row, index) => <fieldset className="quality-measure" key={index}><legend>{encounter ? "Dataset" : "Measure"} {index + 1}</legend><label className="exception-control">{encounter ? "Dataset name" : "Measure name / ID"}<input value={row.name} disabled={!editable} onChange={event => setPacket({ ...packet, measures: packet.measures.map((value, position) => position === index ? { ...value, name: event.target.value } : value) })} /></label>
          <div className="eligibility-counts">{([
            ["denominator", encounter ? "Expected source records" : "Population before exclusions"],
            ["numerator", encounter ? "Certified file records" : "Numerator (met measure)"],
            ...(!encounter ? [["exclusions", "Excluded members"]] as const : []),
            ["missing", "Missing required fields"], ["duplicates", "Duplicate records"],
          ] as const).map(([key, label]) => <label className="exception-control" key={key}>{label}<input type="number" min="0" step="1" value={Number.isNaN(row[key]) ? "" : row[key]} disabled={!editable} onChange={event => setPacket({ ...packet, measures: packet.measures.map((value, position) => position === index ? { ...value, [key]: event.target.value === "" ? NaN : Number(event.target.value) } : value) })} /></label>)}</div>
          {!encounter && <p>Calculated rate: {row.denominator > row.exclusions && Number.isFinite(row.numerator) ? `${(100 * row.numerator / (row.denominator - row.exclusions)).toFixed(1)}%` : "—"}. Submission validation checks data integrity; a low rate does not block reporting.</p>}
          {editable && <button className="btn secondary" onClick={() => setPacket({ ...packet, measures: packet.measures.filter((_, position) => position !== index) })}>Remove {encounter ? "dataset" : "measure"}</button>}
        </fieldset>)}
        {editable && <button className="btn secondary" onClick={() => setPacket({ ...packet, measures: [...packet.measures, { name: "", numerator: 0, denominator: 0, exclusions: 0, missing: 0, duplicates: 0 }] })}>Add {encounter ? "dataset" : "measure"}</button>}
        <label className="exception-check"><input type="checkbox" checked={packet.schemaPassed} disabled={!editable} onChange={event => setPacket({ ...packet, schemaPassed: event.target.checked })} />Schema and required-field validation passed for this specification and reporting period</label>
        {editable && <button className="btn" onClick={() => act({ type: "validate", packet })}>Record validation results</button>}
        {(!editable || validated || state.history.some(event => event.text.startsWith("Validation for"))) && <div className={`eligibility-validation ${issues.length ? "has-issues" : "passed"}`} role="status"><b>{issues.length ? "Resolve before review" : "Data validation passed"}</b>{issues.length > 0 && <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}{editable && <p>These are the last recorded results. Record edited values to update validation.</p>}</div>}
        {state.reviewer && <div className="field"><small>REVIEW APPROVAL</small><b>{state.reviewer} · {state.reviewReference}</b></div>}
        {state.receipt && <div className="field"><small>SUBMISSION RECEIPT</small><b>{state.receipt}</b></div>}
        {state.acknowledgment && <div className="field"><small>PAYER ACKNOWLEDGMENT</small><b>{state.acknowledgment}</b></div>}
      </div></section>
      <section className="card"><div className="card-head"><h2>Next required action</h2></div><div className="credential-actions"><b>{item.next}</b>
        <label className="exception-control">Accountable owner<input value={owner} disabled={state.stage === "Accepted"} onChange={event => setOwner(event.target.value)} /></label><button className="btn secondary" disabled={state.stage === "Accepted" || !owner.trim() || owner.trim() === item.owner} onClick={() => act({ type: "owner", owner })}>Save owner</button>
        {state.stage === "Review" && <><label className="exception-control">Reviewer name<input value={reviewer} onChange={event => setReviewer(event.target.value)} placeholder="A reviewer different from the owner" /></label><label className="exception-control">Review reference and rationale<textarea value={reference} onChange={event => setReference(event.target.value)} /></label><button className="btn" disabled={!reviewer.trim() || !reference.trim()} onClick={() => act({ type: "review", approved: true, reviewer, reference })}>Record reviewer approval</button><button className="btn secondary" disabled={!reviewer.trim() || !reference.trim()} onClick={() => act({ type: "review", approved: false, reviewer, reference })}>Return for correction</button></>}
        {state.stage === "Ready to submit" && <><label className="exception-control">Payer gateway submission receipt<input value={receipt} onChange={event => setReceipt(event.target.value)} /></label><p>Transmit the approved packet through your payer gateway, then record its receipt here.</p><button className="btn" disabled={!receipt.trim() || item.owner === "Unassigned"} onClick={() => act({ type: "submit", receipt })}>Record submission</button></>}
        {state.stage === "Awaiting payer" && <><label className="exception-control">Payer acknowledgment reference<input value={ack} onChange={event => setAck(event.target.value)} /></label><label className="exception-control">Accepted {encounter ? "record" : "measure"} count (expected {expectedAcceptance})<input type="number" min="0" step="1" value={count} onChange={event => setCount(event.target.value)} /></label><button className="btn" disabled={!ack.trim() || !count.trim()} onClick={() => act({ type: "response", accepted: true, reference: ack, count: Number(count), reason: "" })}>Record full acceptance</button><label className="exception-control">Rejection / partial acceptance reason<textarea value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn danger" disabled={!ack.trim() || !reason.trim()} onClick={() => act({ type: "response", accepted: false, reference: ack, count: 0, reason })}>Record rejection / partial acceptance</button><p>Partial acceptance keeps the obligation open for correction and resubmission.</p></>}
        {["Ready to submit", "Rejected", "Accepted"].includes(state.stage) && <><label className="exception-control">{state.stage === "Accepted" ? "Reason for reopening" : "Correction plan"}<textarea value={reason} onChange={event => setReason(event.target.value)} /></label><button className="btn secondary" disabled={!reason.trim()} onClick={() => act({ type: "revise", reason })}>{state.stage === "Accepted" ? "Reopen quality obligation" : "Prepare corrected packet"}</button></>}
        {error && <p className="credential-error" role="alert">{error}</p>}
      </div></section></div>
    <section className="card"><div className="card-head"><div><h2>Activity & evidence history</h2><p>Recorded in this browser. Source validation, reviewer identity, and payer responses are manually entered; external services are not connected.</p></div></div><div className="credential-history">{state.history.length ? state.history.map((event, index) => <div key={`${event.at}-${index}`}><time>{new Date(event.at).toLocaleString()}</time><p>{event.text}</p></div>) : <p>No actions recorded. Add the reporting data and source references to begin.</p>}</div></section>
  </div>;
}
