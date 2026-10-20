import { useEffect, useState, type FormEvent } from "react";
import type { WorkKpi, WorkPlan } from "./types";
import { PaginatedTable } from "../../components/PaginatedResults";

export type Measurement = { id: string; name: string; unit: string; direction: "increase" | "decrease"; source: string; owner: string };
const defaults: Measurement[] = [
  { id: "measure-compliance", name: "Preventive-care compliance", unit: "%", direction: "increase", source: "Quality reporting", owner: "Priya Shah" },
  { id: "measure-referrals", name: "OON referral rate", unit: "%", direction: "decrease", source: "Referral analytics", owner: "Jordan Lee" },
  { id: "measure-records", name: "Provider records published", unit: "records", direction: "increase", source: "Provider directory", owner: "Maya Ortiz" },
];
export function useMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>(() => {
    try { const stored = JSON.parse(localStorage.getItem("ipa-measurements") || "null"); return Array.isArray(stored) ? stored : defaults; } catch { return defaults; }
  });
  useEffect(() => localStorage.setItem("ipa-measurements", JSON.stringify(measurements)), [measurements]);
  return { measurements, setMeasurements };
}
export function outcomeStatus(actual: number, target: number, baseline: number, direction: "increase" | "decrease"): WorkKpi["status"] {
  if (direction === "decrease" ? actual <= target : actual >= target) return "Target Met";
  return (direction === "decrease" ? actual < baseline : actual > baseline) ? "On Track" : "At Risk";
}
const blank: Measurement = { id: "", name: "", unit: "%", direction: "increase", source: "", owner: "" };

export function MeasurementSetup({ measurements, onChange }: { measurements: Measurement[]; onChange: (items: Measurement[]) => void }) {
  const [draft, setDraft] = useState<Measurement | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (measurements.some(item => item.id !== draft.id && item.name.toLowerCase() === draft.name.trim().toLowerCase())) return setError("A measurement with this name already exists.");
    const saved = { ...draft, id: draft.id || crypto.randomUUID(), name: draft.name.trim(), unit: draft.unit.trim(), source: draft.source.trim(), owner: draft.owner.trim() };
    if (!saved.name || !saved.unit || !saved.source || !saved.owner) return setError("Complete all measurement fields.");
    onChange(draft.id ? measurements.map(item => item.id === draft.id ? saved : item) : [...measurements, saved]);
    setDraft(null);
  };
  const shown = measurements.filter(item => `${item.name} ${item.owner} ${item.source}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="section-heading"><div><h2>Measurement library</h2><p>Reusable definitions for work plan outcomes. Updates apply to future additions.</p></div><button className="btn btn-primary" onClick={() => { setDraft({ ...blank }); setError(""); }}>Create measurement</button></div>
    <div className="toolbar"><label className="control"><span>Search measurements</span><input aria-label="Search measurements" placeholder="Search measurements, owner, source…" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="btn btn-ghost" onClick={() => setSearch("")}>Clear filters</button><span className="result-count">{shown.length} measurements</span></div><section className="table-card">
    <div className="table-wrap"><PaginatedTable><thead><tr><th>Measurement</th><th>Unit</th><th>Target direction</th><th>Data source</th><th>Owner</th><th>Action</th></tr></thead><tbody>{shown.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td>{item.unit}</td><td>{item.direction === "increase" ? "Higher is better" : "Lower is better"}</td><td>{item.source}</td><td>{item.owner}</td><td><button className="btn btn-ghost" onClick={() => { setDraft({ ...item }); setError(""); }}>Edit</button></td></tr>)}</tbody></PaginatedTable></div>
    {!shown.length && <div className="empty"><strong>No measurements found</strong><p>Change your search or create a measurement.</p></div>}</section>
    {draft && <div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-labelledby="measurement-title" onSubmit={submit}><div className="modal-head"><h2 id="measurement-title">{draft.id ? "Edit" : "Create"} measurement</h2><button type="button" className="close" aria-label="Close" onClick={() => setDraft(null)}>×</button></div><div className="form-grid">
      {([ ["Name", "name"], ["Unit", "unit"], ["Data source", "source"], ["Default owner", "owner"] ] as const).map(([label, key]) => <label className="control" key={key}>{label}<input required value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
      <label className="control">Target direction<select value={draft.direction} onChange={event => setDraft({ ...draft, direction: event.target.value as Measurement["direction"] })}><option value="increase">Higher is better</option><option value="decrease">Lower is better</option></select></label>
      </div>{error && <p role="alert" className="measurement-error">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary" type="submit">Save measurement</button></div></form></div>}
  </>;
}

export function OutcomeMeasurements({ plan, measurements, save }: { plan: WorkPlan; measurements: Measurement[]; save: (changes: Partial<WorkPlan>, activity?: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const shown = plan.kpis.filter(kpi => `${kpi.name} ${kpi.source || ""} ${kpi.owner} ${kpi.period}`.toLowerCase().includes(search.toLowerCase())).filter(kpi => status === "All" || kpi.status === status);
  const [adding, setAdding] = useState(false);
  const [measurementId, setMeasurementId] = useState("");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [period, setPeriod] = useState("");
  const [owner, setOwner] = useState(plan.owner);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState<WorkKpi | null>(null);
  const [actual, setActual] = useState("");
  const available = measurements.filter(item => !plan.kpis.some(kpi => kpi.measurementId === item.id));
  const selected = measurements.find(item => item.id === measurementId);
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !baseline.trim() || !target.trim() || !Number.isFinite(Number(baseline)) || !Number.isFinite(Number(target)) || !period.trim() || !owner.trim() || owner.trim() === "Unassigned") return setError("Select a measurement and enter valid baseline, target, period, and accountable owner.");
    if (selected.unit === "%" && [Number(baseline), Number(target)].some(value => value < 0 || value > 100)) return setError("Percentage values must be between 0 and 100.");
    if (plan.kpis.some(kpi => kpi.measurementId === selected.id)) return setError("This measurement is already on the plan.");
    const kpi: WorkKpi = { ...selected, id: crypto.randomUUID(), measurementId: selected.id, baseline: Number(baseline), target: Number(target), actual: 0, period: period.trim(), owner: owner.trim(), status: "Not Yet Measured" };
    save({ kpis: [...plan.kpis, kpi] }, `Outcome measurement added: ${kpi.name}`);
    setAdding(false);
  };
  const record = (event: FormEvent) => {
    event.preventDefault();
    if (!recording || !actual.trim() || !Number.isFinite(Number(actual))) return setError("Enter a valid numeric result.");
    const value = Number(actual);
    if (recording.unit === "%" && (value < 0 || value > 100)) return setError("Percentage values must be between 0 and 100.");
    const direction = recording.direction || (recording.target < recording.baseline ? "decrease" : "increase");
    save({ kpis: plan.kpis.map(kpi => kpi.id === recording.id ? { ...kpi, actual: value, status: outcomeStatus(value, kpi.target, kpi.baseline, direction) } : kpi) }, `Result recorded: ${recording.name} = ${value}${recording.unit}`);
    setRecording(null);
  };
  return <><div className="section-heading"><div><h2>Outcome measurements</h2><p>Track observed results against plan-specific targets.</p></div><button className="btn btn-primary" disabled={!available.length} onClick={() => { setAdding(true); setMeasurementId(""); setBaseline(""); setTarget(""); setPeriod(""); setOwner(plan.owner); setError(""); }}>Add outcome measure</button></div>
    {!available.length && <p className="measurement-note">Create more measurements in Provider Relations / Measurement setup.</p>}
    <div className="toolbar"><label className="control"><span>Search outcome measures</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search KPI, source, owner, period…" /></label><label className="control"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}>{["All", "Not Yet Measured", "On Track", "At Risk", "Target Met", "Target Missed"].map(value => <option key={value}>{value}</option>)}</select></label><button className="btn btn-ghost" onClick={() => { setSearch(""); setStatus("All"); }}>Clear filters</button><span className="result-count">{shown.length} outcome measures</span></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>KPI / source</th><th>Baseline</th><th>Target</th><th>Latest actual</th><th>Period</th><th>Owner</th><th>Status</th><th>Update</th></tr></thead><tbody>{shown.map(kpi => <tr key={kpi.id}><td><b>{kpi.name}</b><small>{kpi.source}</small></td><td>{kpi.baseline} {kpi.unit}</td><td>{kpi.target} {kpi.unit}<small>{(kpi.direction || (kpi.target < kpi.baseline ? "decrease" : "increase")) === "decrease" ? "At or below" : "At or above"}</small></td><td>{kpi.status === "Not Yet Measured" ? "Not yet measured" : `${kpi.actual} ${kpi.unit}`}</td><td>{kpi.period}</td><td>{kpi.owner}</td><td><span className={`badge badge-${kpi.status === "Target Met" ? "good" : kpi.status === "On Track" ? "info" : ["At Risk", "Target Missed"].includes(kpi.status) ? "warn" : "neutral"}`}><i />{kpi.status}</span></td><td><button className="btn btn-secondary" onClick={() => { setRecording(kpi); setActual(kpi.status === "Not Yet Measured" ? "" : String(kpi.actual)); setError(""); }}>Record result</button></td></tr>)}</tbody></PaginatedTable></div>
    {!shown.length && <div className="empty"><strong>{plan.kpis.length ? "No matching outcome measures" : "No outcome measures yet"}</strong><p>{plan.kpis.length ? "Change your search or clear filters." : "Select Add outcome measure to set a baseline, target, reporting period, and owner."}</p></div>}</section>
    {adding && <div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-labelledby="outcome-title" onSubmit={add}><div className="modal-head"><h2 id="outcome-title">Add outcome measure</h2><button type="button" className="close" aria-label="Close" onClick={() => setAdding(false)}>×</button></div><div className="form-grid"><label className="control">Measurement<select required value={measurementId} onChange={event => { setMeasurementId(event.target.value); setOwner(measurements.find(item => item.id === event.target.value)?.owner || plan.owner); }}><option value="">Select measurement</option>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {selected && <p className="outcome-context">{selected.unit} · {selected.direction === "increase" ? "Higher" : "Lower"} is better · {selected.source}</p>}
      <label className="control">Baseline<input required type="number" step="any" value={baseline} onChange={event => setBaseline(event.target.value)} /></label><label className="control">Target<input required type="number" step="any" value={target} onChange={event => setTarget(event.target.value)} /></label><label className="control">Reporting period<input required placeholder="e.g. Q4 2026" value={period} onChange={event => setPeriod(event.target.value)} /></label><label className="control">Accountable owner<input required value={owner} onChange={event => setOwner(event.target.value)} /></label></div>{error && <p className="measurement-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add measure</button></div></form></div>}
    {recording && <div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-labelledby="result-title" onSubmit={record}><div className="modal-head"><h2 id="result-title">Record result: {recording.name}</h2><button type="button" className="close" aria-label="Close" onClick={() => setRecording(null)}>×</button></div><div className="form-stack"><label className="control">Latest actual ({recording.unit})<input autoFocus required type="number" step="any" value={actual} onChange={event => setActual(event.target.value)} /></label></div>{error && <p className="measurement-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setRecording(null)}>Cancel</button><button type="submit" className="btn btn-primary">Save result</button></div></form></div>}
  </>;
}
