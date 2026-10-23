import { useState } from "react";
import type { WorkPlan } from "./types";

type Accountability = Pick<WorkPlan, "owner" | "department" | "due" | "nextReview">;

export function WorkPlanOverview({ plan, onSave }: { plan: WorkPlan; onSave: (changes: Accountability) => void }) {
  const [draft, setDraft] = useState<Accountability>({ owner: plan.owner, department: plan.department, due: plan.due, nextReview: plan.nextReview });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const change = (field: keyof Accountability, value: string) => { setDraft(current => ({ ...current, [field]: value })); setError(""); setSaved(false); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(false);
    if (!draft.owner.trim() || draft.owner.trim() === "Unassigned" || !draft.department.trim()) return setError("Enter a project owner and owning department.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.due) || !/^\d{4}-\d{2}-\d{2}$/.test(draft.nextReview)) return setError("Enter valid target completion and next review dates.");
    if (draft.due < plan.start || draft.nextReview < plan.start) return setError("Target completion and next review must be on or after the start date.");
    try {
      onSave({ ...draft, owner: draft.owner.trim(), department: draft.department.trim() });
      setSaved(true);
    } catch {
      setError("Could not save project details. Browser storage may be full, blocked, or unreadable. Allow browser storage or free space, then try saving again. Your edits are still here.");
    }
  };
  return <div className="grid items-start gap-6 xl:grid-cols-2">
    <section className="card min-w-0 mt-0!">
      <div className="card-head"><div><h2>Accountability and timeline</h2><p>Ownership and upcoming commitments</p></div></div>
      <form onSubmit={submit} className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="control"><span>Project owner</span><input required value={draft.owner} onChange={event => change("owner", event.target.value)} /></label>
          <label className="control"><span>Owning department</span><input required value={draft.department} onChange={event => change("department", event.target.value)} /></label>
          <label className="control"><span>Next review date</span><input required type="date" min={plan.start} value={draft.nextReview} onChange={event => change("nextReview", event.target.value)} /></label>
          <label className="control"><span>Target completion</span><input required type="date" min={plan.start} value={draft.due} onChange={event => change("due", event.target.value)} /></label>
          <div className="flex flex-col gap-2"><span className="text-sm text-slate-500">Start date</span><b>{plan.start}</b></div>
        </div>
        
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="text-sm text-emerald-700">Project details saved.</p>}
        <button type="submit" className="btn btn-primary">Save details</button>
      </form>
    </section>
    <section className="card activity-card min-w-0 mt-0! mt-0!"><div className="card-head"><div><h2>Activity and history</h2><p>Project activity recorded in this browser</p></div></div><div className="activity-feed">{plan.activity.map((item, index) => <div key={`${item.date}-${index}`}><i /><span><b>{item.text}</b><small>{item.date} &middot; {item.by}</small></span></div>)}</div>{!plan.activity.length && <p className="p-6 text-sm text-slate-500">No project activity recorded yet.</p>}</section>
  </div>;
}
