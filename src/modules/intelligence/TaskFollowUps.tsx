import { useState, type FormEvent } from "react";
import { taskNotes } from "./TaskForm";
import type { TaskNote, WorkTask } from "./types";

export function TaskFollowUps({ tasks, taskId, onTaskChange, onSave }: { tasks: WorkTask[]; taskId: string; onTaskChange: (id: string) => void; onSave: (task: WorkTask, activity: string) => void }) {
  const [draft, setDraft] = useState<(TaskNote & { taskId: string }) | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const entries = tasks.flatMap(task => taskNotes(task).map(note => ({ note, task })));
  const shown = entries.filter(({ note, task }) => (!taskId || task.id === taskId) && `${note.type} ${note.text} ${task.name}`.toLowerCase().includes(search.toLowerCase()));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft?.text.trim()) return setError("Enter follow-up details before saving.");
    const task = tasks.find(item => item.id === draft.taskId);
    if (!task) return setError("Choose a linked task before saving.");
    const notes = taskNotes(task);
    const existing = notes.some(note => note.id === draft.id);
    const saved: TaskNote = { id: draft.id, type: draft.type, text: draft.text.trim() };
    try {
      onSave({ ...task, note: undefined, notes: existing ? notes.map(note => note.id === saved.id ? saved : note) : [...notes, saved] }, `Follow-up ${existing ? "updated" : "added"} for ${task.name}: [${saved.type}] ${saved.text}`);
      setDraft(null); setError(""); setNotice(`Follow-up ${existing ? "updated" : "added"}.`);
    } catch {
      setError("Could not save the follow-up. Browser storage may be full or blocked. Allow storage or free space and try again. Your edits are still here.");
    }
  };
  return <section className="py-6" aria-label="Task follow-ups">
    <h2>Follow-ups</h2>
    <p className="my-3 text-sm text-slate-500">Saved in this browser only. Data is removed when site data is cleared. Use fictional demo information.</p>
    <div className="my-4 flex flex-wrap gap-3"><label className="control flex-1">Search follow-ups<input value={search} onChange={event => setSearch(event.target.value)} /></label><label className="control flex-1">Filter by task<select disabled={!!draft} value={taskId} onChange={event => onTaskChange(event.target.value)}><option value="">All tasks</option>{tasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label><button className="btn btn-primary self-end" disabled={!!draft || !tasks.length} onClick={() => { setDraft({ id: crypto.randomUUID(), taskId: taskId || tasks[0]?.id || "", type: "General", text: "" }); setError(""); setNotice(""); }}>Add follow-up</button></div>
    {error && !draft && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status" className="my-3 text-emerald-700">{notice}</p>}
    <div className={`grid items-start gap-6 ${draft ? "lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]" : ""}`}>
      <div className="min-w-0 overflow-x-auto" aria-label="Follow-up list">
        <p className="mb-3 text-sm text-slate-500">{shown.length} of {entries.length} follow-ups</p>
        <table className="w-full"><thead><tr><th scope="col">Type</th><th scope="col">Follow-up</th><th scope="col">Linked task</th><th scope="col">Actions</th></tr></thead><tbody>
        {shown.map(({ note, task }) => <tr key={`${task.id}-${note.id}`}><td className="align-top">{note.type === "Decision" ? "General" : note.type}</td><td className="max-w-xl whitespace-pre-wrap break-words align-top">{note.text}</td><td className="align-top"><span className="line-clamp-2 max-w-60" title={task.name}>{task.name}</span><small>{task.id}</small></td><td className="align-top"><div className="flex gap-2"><button className="btn btn-ghost" disabled={!!draft} aria-label={`Edit follow-up: ${note.text}`} onClick={() => { setDraft({ ...note, taskId: task.id }); setError(""); setNotice(""); }}>Edit follow-up</button><button className="btn btn-ghost" disabled={!!draft} onClick={() => {
          if (!window.confirm("Remove this follow-up?")) return;
          try {
            onSave({ ...task, note: undefined, notes: taskNotes(task).filter(item => item.id !== note.id) }, `Follow-up removed for ${task.name}: ${note.text}`);
            setError(""); setNotice("Follow-up removed.");
          } catch { setNotice(""); setError("Could not remove the follow-up. Allow browser storage or free space and try again."); }
        }}>Remove follow-up</button></div></td></tr>)}
        {!shown.length && <tr><td colSpan={4}>{entries.length ? "No follow-ups match your filters." : "No follow-ups yet. Add a follow-up to record instructions, progress, or blockers."}</td></tr>}
        </tbody></table>
      </div>
      {draft && <form onSubmit={submit} className="space-y-4 border-t border-slate-200 pt-4 lg:border-t-0 lg:border-l lg:pl-6"><h3>{entries.some(({ note, task }) => note.id === draft.id && task.id === draft.taskId) ? "Edit follow-up" : "New follow-up"}</h3><label className="control">Linked task<select value={draft.taskId} disabled={entries.some(({ note, task }) => note.id === draft.id && task.id === draft.taskId)} onChange={event => setDraft({ ...draft, taskId: event.target.value })}>{tasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label><label className="control">Follow-up type<select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as TaskNote["type"] })}>{["General", "Instruction", "Progress Update", "Blocker", ...(draft.type === "Decision" ? ["Decision"] : [])].map(type => <option key={type}>{type}</option>)}</select></label><label className="control">Follow-up details<textarea autoFocus rows={7} value={draft.text} onChange={event => setDraft({ ...draft, text: event.target.value })} /></label>{error && <p role="alert" className="text-red-700">{error}</p>}<div className="flex gap-3"><button className="btn btn-primary" type="submit">Save follow-up</button><button className="btn btn-secondary" type="button" onClick={() => { setDraft(null); setError(""); }}>Cancel</button></div></form>}
    </div>
  </section>;
}
