import { useState, type FormEvent } from "react";
import { PaginatedTable } from "../../components/PaginatedResults";
import type { WorkPlan, WorkRisk } from "./types";

export const riskType = (risk: WorkRisk) => risk.type || (risk.decisionFrom ? "Decision" : "Risk");
export function RiskForm({ initial, onClose, onSave }: { initial: WorkRisk; onClose: () => void; onSave: (risk: WorkRisk) => void }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const saved = { ...draft, issue: draft.issue.trim(), impact: draft.impact.trim(), owner: draft.owner.trim(), decisionFrom: draft.type === "Decision" ? draft.decisionFrom?.trim() : undefined };
    if (!saved.issue || !saved.impact || !saved.owner || saved.owner === "Unassigned" || !/^\d{4}-\d{2}-\d{2}$/.test(saved.due) || (saved.type === "Decision" && !saved.decisionFrom)) return setError("Complete the issue, impact, accountable owner, due date, and decision recipient when required.");
    onSave(saved);
  };
  return <div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-labelledby="risk-title" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">Work plan issue</p><h2 id="risk-title">{initial.id ? "Edit issue" : "Add risk, blocker, or decision"}</h2></div><button type="button" className="close" aria-label="Close" onClick={onClose}>×</button></div><div className="form-grid">
    <label className="control">Type<select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as WorkRisk["type"] })}>{["Risk", "Blocker", "Decision"].map(type => <option key={type}>{type}</option>)}</select></label>
    <label className="control">Severity<select value={draft.severity} onChange={event => setDraft({ ...draft, severity: event.target.value as WorkRisk["severity"] })}>{["High", "Medium", "Low"].map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="control">Issue<input autoFocus required value={draft.issue} onChange={event => setDraft({ ...draft, issue: event.target.value })} placeholder="Describe the issue or decision needed" /></label>
    <label className="control">Impact<input required value={draft.impact} onChange={event => setDraft({ ...draft, impact: event.target.value })} placeholder="Describe the effect on this plan" /></label>
    <label className="control">Accountable owner<input required value={draft.owner} onChange={event => setDraft({ ...draft, owner: event.target.value })} /></label>
    <label className="control">Due date<input type="date" required value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} /></label>
    {draft.type === "Decision" && <label className="control">Decision from<input required value={draft.decisionFrom || ""} onChange={event => setDraft({ ...draft, decisionFrom: event.target.value })} /></label>}
    <label className="control">Status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as WorkRisk["status"] })}>{["Open", "Mitigating", "Resolved"].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>{error && <p className="measurement-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save issue</button></div></form></div>;
}

export function WorkPlanRisks({ plan, onAdd, onEdit, onResolve }: { plan: WorkPlan; onAdd: () => void; onEdit: (risk: WorkRisk) => void; onResolve: (risk: WorkRisk) => void }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const shown = plan.risks.filter(risk => `${risk.issue} ${risk.impact} ${risk.owner} ${risk.decisionFrom || ""}`.toLowerCase().includes(search.toLowerCase())).filter(risk => (type === "All" || riskType(risk) === type) && (status === "All" || risk.status === status));
  return <><div className="section-heading"><div><h2>Risks, blockers, and decisions</h2><p>Track issues and decisions affecting this work plan.</p></div><button className="btn btn-primary" onClick={onAdd}>Add issue</button></div><div className="toolbar"><label className="control"><span>Search issues</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search issue, impact, owner…" /></label><label className="control"><span>Type</span><select value={type} onChange={event => setType(event.target.value)}>{["All", "Risk", "Blocker", "Decision"].map(value => <option key={value}>{value}</option>)}</select></label><label className="control"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}>{["All", "Open", "Mitigating", "Resolved"].map(value => <option key={value}>{value}</option>)}</select></label><button className="btn btn-ghost" onClick={() => { setSearch(""); setType("All"); setStatus("All"); }}>Clear filters</button><span className="result-count">{shown.length} issues</span></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Issue / type</th><th>Impact</th><th>Severity</th><th>Owner</th><th>Due date</th><th>Decision from</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shown.map(risk => <tr key={risk.id}><td><b>{risk.issue}</b><small>{riskType(risk)}</small></td><td>{risk.impact}</td><td><span className={`badge badge-${risk.severity === "High" ? "bad" : risk.severity === "Medium" ? "warn" : "neutral"}`}><i />{risk.severity}</span></td><td>{risk.owner}</td><td>{risk.due}</td><td>{risk.decisionFrom || "Not required"}</td><td><span className={`badge badge-${risk.status === "Resolved" ? "good" : "warn"}`}><i />{risk.status}</span></td><td><div className="row-actions"><button className="btn btn-ghost" onClick={() => onEdit(risk)}>Edit</button><button className="btn btn-secondary" disabled={risk.status === "Resolved"} onClick={() => onResolve(risk)}>Resolve</button></div></td></tr>)}</tbody></PaginatedTable></div>{!shown.length && <div className="empty"><strong>No issues found</strong><p>Add an issue or change your filters.</p></div>}</section></>;
}
