import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TaskNote, WorkPlan, WorkTask } from "./types";

export function taskNotes(task: WorkTask): TaskNote[] {
  return task.notes ?? (task.note ? [{ id: `${task.id}-note`, type: "General", text: task.note }] : []);
}

export function TaskForm({ plan, initial, onClose, onSave }: { plan: WorkPlan; initial?: WorkTask; onClose: () => void; onSave: (task: WorkTask) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<WorkTask>(initial ? { ...initial, dependency: initial.dependency || "", note: initial.note || "" } : { id: "", name: "", owner: plan.owner, department: plan.department, due: plan.due, status: "Not Started", dependency: "", note: "" });
  const [error, setError] = useState("");
  const owners = [...new Set(["Unassigned", plan.owner, ...plan.tasks.map(task => task.owner), "Maya Ortiz", "Jordan Lee", "Priya Shah", "Evan Brooks"])];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  const dependencyOptions = plan.tasks.filter(task => {
    const visited = new Set<string>();
    let current: WorkTask | undefined = task;
    while (current) {
      if (current.id === draft.id || visited.has(current.id)) return false;
      visited.add(current.id);
      current = plan.tasks.find(item => item.id === current?.dependency);
    }
    return true;
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.department.trim() || !draft.owner || !draft.due) {
      setError("Enter a task name, department, owner, and due date.");
      return;
    }
    try {
    onSave({ ...draft, id: initial?.id || `${plan.id}-T-${crypto.randomUUID()}`, name: draft.name.trim(), department: draft.department.trim(), dependency: draft.dependency || undefined });
    } catch {
      setError("Could not save the task. Browser storage may be full or blocked. Allow browser storage or free space, then try again. Your edits are still here.");
    }
  };
  return <dialog ref={dialog} className="modal task-dialog" aria-labelledby="task-title" aria-describedby="task-description" onCancel={onClose}>
    <form onSubmit={submit}>
      <div className="modal-head"><div><p className="eyebrow">Project task</p><h2 id="task-title">{initial ? "Edit task" : "Add task"}</h2><p id="task-description" className="task-description">{initial ? "Update task details for" : "Define the next step for"} {plan.name}.</p></div><button type="button" className="close" aria-label="Close task form" onClick={onClose}>×</button></div>
      <div className="form-grid">
        <label className="control task-full-width">Task name <input autoFocus required maxLength={200} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Review provider outreach results" /></label>
        <label className="control">Owner<select value={draft.owner} onChange={event => setDraft({ ...draft, owner: event.target.value })}>{owners.map(owner => <option key={owner}>{owner}</option>)}</select></label>
        <label className="control">Department<input required value={draft.department} onChange={event => setDraft({ ...draft, department: event.target.value })} /></label>
        <label className="control">Due date<input type="date" required value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} /></label>
        <label className="control">Status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as WorkTask["status"] })}>{["Not Started", "In Progress", "Blocked", "Awaiting Review", "Completed", "Cancelled"].map(status => <option key={status}>{status}</option>)}</select></label>
        <label className="control task-full-width">Depends on <span className="task-field-hint">Optional · choose a prerequisite task</span><select value={draft.dependency} onChange={event => setDraft({ ...draft, dependency: event.target.value })}><option value="">No dependency</option>{dependencyOptions.map(task => <option key={task.id} value={task.id}>{task.name} ({task.status})</option>)}</select></label>
        {draft.due > plan.due && <p className="task-full-width task-date-note" role="status">This task is due after the project target date ({plan.due}).</p>}
        {error && <p className="task-full-width measurement-error" role="alert">{error}</p>}
      </div>
      <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">{initial ? "Save changes" : "Add task"}</button></div>
    </form>
  </dialog>;
}
