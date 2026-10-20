import { useState } from "react";
import { PaginatedTable } from "../../components/PaginatedResults";
import type { WorkPlan } from "./types";

export function WorkPlanOverview({ plan }: { plan: WorkPlan }) {
  const [search, setSearch] = useState("");
  const blockers = plan.risks.filter(risk => risk.status !== "Resolved").filter(risk => `${risk.issue} ${risk.impact} ${risk.owner}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="dashboard-grid work-plan-overview">
      <section className="card"><div className="card-head"><div><h2>Objective and rationale</h2><p>Purpose, expected results, and success criteria</p></div></div>
        <dl className="plan-summary">{[["Objective", plan.objective], ["Rationale", plan.rationale], ["Expected result", plan.expectedResult], ["Success criteria", plan.successCriteria]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not specified"}</dd></div>)}</dl>
      </section>
      <section className="card"><div className="card-head"><div><h2>Accountability and timeline</h2><p>Ownership and upcoming commitments</p></div></div><div className="detail-grid compact-details">{[["Executive sponsor", plan.sponsor], ["Supporting teams", plan.supporting.join(", ")], ["Start date", plan.start], ["Target completion", plan.due], ["Next review", plan.nextReview]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></section>
    </div>
    <div className="section-heading"><div><h2>Current blockers</h2><p>Open risks and decisions affecting this plan</p></div></div>
    <div className="toolbar"><label className="control"><span>Search blockers</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search issue, impact, owner…" /></label><button className="btn btn-ghost" onClick={() => setSearch("")}>Clear filters</button><span className="result-count">{blockers.length} blockers</span></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Issue</th><th>Impact</th><th>Owner</th><th>Severity</th><th>Due date</th><th>Status</th></tr></thead><tbody>{blockers.map(risk => <tr key={risk.id}><td><b>{risk.issue}</b></td><td>{risk.impact}</td><td>{risk.owner}</td><td><span className={`badge badge-${risk.severity === "High" ? "bad" : "warn"}`}><i />{risk.severity}</span></td><td>{risk.due}</td><td><span className="badge badge-warn"><i />{risk.status}</span></td></tr>)}</tbody></PaginatedTable></div>{!blockers.length && <div className="empty"><strong>{search ? "No matching blockers" : "No open blockers"}</strong><p>{search ? "Change your search or clear filters." : "Open risks and decisions will appear here."}</p></div>}</section>
  </>;
}
