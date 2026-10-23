import { DashboardTabs } from "../../components/DashboardTabs";
import type { WorkPlan, WorkTask } from "./types";

export const taskStatuses = ["Not Started", "In Progress", "Blocked", "Awaiting Review"];
export const dueBuckets = ["Overdue", "Due today", "Due in 1 to 7 days", "Due in 8 to 30 days", "Due after 30 days", "No due date"];
export function taskToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function taskTimeliness(task: WorkTask, today: string) {
  const due = Date.parse(task.due);
  if (!task.due || !Number.isFinite(due)) return "No due date";
  const days = Math.round((due - Date.parse(today)) / 86400000);
  return days < 0 ? "Overdue" : days === 0 ? "Due today" : days <= 7 ? "Due in 1 to 7 days" : days <= 30 ? "Due in 8 to 30 days" : "Due after 30 days";
}
export function matchesTaskFilter(task: WorkTask, params: URLSearchParams) {
  return !["Completed", "Cancelled"].includes(task.status) && (!params.has("owner") || task.owner === params.get("owner")) && (!params.has("status") || task.status === params.get("status")) && (!params.has("department") || task.department === params.get("department")) && (!params.has("due") || taskTimeliness(task, params.get("date") || taskToday()) === params.get("due"));
}
export function taskFilterLabel(params: URLSearchParams) {
  return ["Tasks excluding completed and cancelled", ...["owner", "status", "department", "due"].filter(key => params.has(key)).map(key => `${key === "due" ? "Timeliness" : key.charAt(0).toUpperCase() + key.slice(1)}: ${params.get(key)}`)].join(" / ");
}
export function RelationsDashboard({ plans, onOpen }: { plans: WorkPlan[]; onOpen: (filter: string) => void }) {
  const tasks = plans.flatMap(plan => plan.tasks).filter(task => !["Completed", "Cancelled"].includes(task.status));
  const today = taskToday();
  const owners = [...new Set(tasks.map(task => task.owner))].sort();
  const departments = [...new Set(tasks.map(task => task.department))].sort();
  const count = (criteria: Record<string, string>, label: string) => {
    const params = new URLSearchParams({ tasks: "1", date: today, ...criteria });
    const total = tasks.filter(task => matchesTaskFilter(task, params)).length;
    return <button className="action-count-link" aria-label={`${label}: ${total} tasks. View matching projects`} onClick={() => onOpen(params.toString())}>{total}</button>;
  };
  return <>
    <p className="relations-task-note">Counts exclude completed and cancelled tasks. Select a count to view their projects. Due dates are compared with {today} (India time).</p>
    <DashboardTabs label="Relations dashboards">{[{ title: "Task count by owner", column: "Owner", key: "owner", values: owners }, { title: "Task count by status", column: "Status", key: "status", values: taskStatuses }, { title: "Task count by department", column: "Department", key: "department", values: departments }].map(group => <section title={group.title} className={`table-card ${group.key === "owner" ? "owner-timeliness-matrix" : ""}`} key={group.key}><div className="card-head padded"><h2>{group.title}</h2></div><div className="table-wrap"><table><thead><tr><th scope="col">{group.column}</th>{group.key === "owner" && dueBuckets.map(bucket => <th scope="col" key={bucket}>{bucket}</th>)}<th scope="col">{group.key === "owner" ? "Total" : "Tasks"}</th></tr></thead><tbody>{group.values.map(value => <tr key={value}><th scope="row" className="bg-transparent! normal-case! font-medium! tracking-normal! text-slate-800!">{value || "Unspecified"}</th>{group.key === "owner" && dueBuckets.map(bucket => <td key={bucket}>{count({ owner: value, due: bucket }, `${value || "Unspecified"}, ${bucket}`)}</td>)}<td>{count({ [group.key]: value }, value || "Unspecified")}</td></tr>)}<tr><th scope="row" className="bg-transparent! normal-case! font-medium! tracking-normal! text-slate-800!">Total</th>{group.key === "owner" && dueBuckets.map(bucket => <td key={bucket}>{count({ due: bucket }, bucket)}</td>)}<td>{count({}, "All tasks excluding completed and cancelled")}</td></tr></tbody></table></div></section>)}
    <section title="Task count by owner and status" className="table-card relations-task-matrix"><div className="card-head padded"><div><h2>Task count by owner and status</h2><p>Each cell shows tasks matching both the owner and status.</p></div></div><div className="table-wrap"><table><thead><tr><th>Owner</th>{taskStatuses.map(status => <th key={status}>{status}</th>)}<th>Total</th></tr></thead><tbody>{owners.map(owner => <tr key={owner}><th scope="row" className="bg-transparent! normal-case! font-medium! tracking-normal! text-slate-800!">{owner || "Unspecified"}</th>{taskStatuses.map(status => <td key={status}>{count({ owner, status }, `${owner}, ${status}`)}</td>)}<td>{count({ owner }, owner)}</td></tr>)}<tr><th scope="row" className="bg-transparent! normal-case! font-medium! tracking-normal! text-slate-800!">Total</th>{taskStatuses.map(status => <td key={status}>{count({ status }, status)}</td>)}<td>{count({}, "All tasks excluding completed and cancelled")}</td></tr></tbody></table></div>{!tasks.length && <div className="empty"><strong>No tasks to display</strong><p>Tasks appear here once added to a project. Completed and cancelled tasks are excluded.</p></div>}</section>
    </DashboardTabs>
  </>;
}
