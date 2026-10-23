import { useState } from "react"
import type {
  WorkPlan,
  WorkTask,
  WorkKpi,
  WorkRisk,
  TaskNote,
} from "../../src/modules/intelligence/types"

type Field = {
  key: string
  label: string
  options?: string[]
  type?: string
  optional?: boolean
}
const field = (
  key: string,
  label: string,
  options?: string[],
  type?: string,
  optional = false,
): Field => ({ key, label, options, type, optional })
const taskStatuses = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Awaiting Review",
  "Completed",
  "Cancelled",
]
const overview = [
  field("name", "Project name"),
  field("actionId", "Source goal", undefined, undefined, true),
  field("objective", "Objective"),
  field("rationale", "Rationale"),
  field("expectedResult", "Expected result"),
  field("successCriteria", "Success criteria"),
  field("owner", "Project owner"),
  field("department", "Owning department"),
  field(
    "supporting",
    "Supporting departments (comma separated)",
    undefined,
    undefined,
    true,
  ),
  field("sponsor", "Sponsor"),
  field("priority", "Priority", ["High", "Medium", "Low"]),
  field("start", "Start date", undefined, "date"),
  field("due", "Target completion", undefined, "date"),
  field("nextReview", "Next review date", undefined, "date"),
  field("status", "Execution status", [
    "Draft",
    "Ready to Start",
    "In Progress",
    "On Hold",
    "Work Complete — Outcome Follow-up Pending",
    "Completed",
    "Cancelled",
  ]),
  field("health", "Health", ["On Track", "At Risk", "Blocked", "Overdue"]),
  field("progress", "Progress (%)", undefined, "number"),
  field("template", "Template"),
]
const taskFields = [
  field("name", "Task name"),
  field("owner", "Owner"),
  field("department", "Department"),
  field("due", "Due date", undefined, "date"),
  field("status", "Status", taskStatuses),
]
const outcomeFields = [
  field("name", "Measurement name"),
  field("measurementId", "Measurement reference", undefined, undefined, true),
  field("source", "Source", undefined, undefined, true),
  field("direction", "Direction", ["increase", "decrease"]),
  ...["baseline", "target", "actual"].map((key) =>
    field(key, key[0].toUpperCase() + key.slice(1), undefined, "number"),
  ),
  field("unit", "Unit"),
  field("period", "Period"),
  field("owner", "Owner"),
  field("status", "Status", [
    "Not Yet Measured",
    "On Track",
    "At Risk",
    "Target Met",
    "Target Missed",
  ]),
]
const riskFields = [
  field("type", "Type", ["Risk", "Blocker"]),
  field("issue", "Issue"),
  field("impact", "Impact"),
  field("severity", "Severity", ["High", "Medium", "Low"]),
  field("owner", "Accountable owner"),
  field("due", "Due date", undefined, "date"),
  field("decisionFrom", "Decision from", undefined, undefined, true),
  field("status", "Status", ["Open", "Mitigating", "Resolved"]),
]

function Editor({
  title,
  initial,
  fields,
  validate,
  onSave,
  onCancel,
}: {
  title: string
  initial: Record<string, unknown>
  fields: Field[]
  validate: (draft: Record<string, string>) => string
  onSave: (draft: Record<string, string>) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.key, String(initial[f.key] ?? "")]),
    ),
  )
  const [error, setError] = useState("")
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (fields.some((f) => !f.optional && !draft[f.key].trim()))
          return setError("Complete all required fields with a value.")
        const message = validate(draft)
        if (message) return setError(message)
        onSave(
          Object.fromEntries(
            Object.entries(draft).map(([key, value]) => [key, value.trim()]),
          ),
        )
      }}
    >
      <h2>{title}</h2>
      {fields.map((f) => (
        <label key={f.key} className="block text-sm font-semibold">
          {f.label}
          {f.optional ? " (optional)" : ""}
          {f.options ? (
            <select
              aria-label={f.label}
              className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white p-2"
              value={draft[f.key]}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            >
              {!draft[f.key] && <option value="">Choose…</option>}
              {f.options.map((value) => (
                <option key={value} value={value}>
                  {value || "None"}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 p-2"
              type={f.type || "text"}
              step={f.type === "number" ? "any" : undefined}
              value={draft[f.key]}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
          )}
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button className="button-primary" type="submit">
        Save changes
      </button>
      <button className="button-secondary" type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export default function ProjectDetail({
  plan,
  onSave,
  onBack,
  initialTab = "Overview",
  initialTaskId,
  onOpenTask,
}: {
  plan: WorkPlan
  onSave: (plan: WorkPlan) => void
  onBack: () => void
  initialTab?: string
  initialTaskId?: string
  onOpenTask: (id: string) => void
}) {
  const [tab, setTab] = useState(initialTab)
  const [editing, setEditing] = useState<{
    id: string
    values: Record<string, unknown>
  } | null>(() => {
    const task = plan.tasks.find((item) => item.id === initialTaskId)
    return task ? { id: task.id, values: { ...task } } : null
  })
  const [notice, setNotice] = useState("")
  const changeTab = (next: string) => {
    setTab(next)
    setEditing(null)
    setNotice("")
  }
  const save = (patch: Partial<WorkPlan>) => {
    onSave({
      ...plan,
      ...patch,
      lastUpdated: new Date().toISOString().slice(0, 10),
      activity: [
        {
          date: new Date().toISOString().slice(0, 10),
          by: "Jordan Lee",
          text: `${tab} updated in mobile demo`,
        },
        ...plan.activity,
      ],
    })
    setEditing(null)
    setNotice("Changes saved for this mobile session.")
  }
  const edit = (id: string, values: Record<string, unknown>) => {
    setNotice("")
    setEditing({ id, values })
  }
  const button = (label: string, action: () => void) => (
    <button className="button-secondary" onClick={action}>
      {label}
    </button>
  )
  let fields = overview
  if (tab === "Tasks")
    fields = [
      ...taskFields,
      field(
        "dependency",
        "Depends on",
        [
          "",
          ...plan.tasks.filter((t) => t.id !== editing?.id).map((t) => t.id),
        ],
        undefined,
        true,
      ),
    ]
  if (tab === "Follow-ups")
    fields = [
      field(
        "taskId",
        "Linked task",
        plan.tasks.map((t) => t.id),
      ),
      field("type", "Follow-up type", [
        "General",
        "Instruction",
        "Progress Update",
        "Blocker",
        "Decision",
      ]),
      field("text", "Follow-up details"),
    ]
  if (tab === "Outcomes") fields = outcomeFields
  if (tab === "Risks & Blockers") fields = riskFields
  const validate = (draft: Record<string, string>) => {
    if (
      Object.entries(draft).some(
        ([key, value]) =>
          ["owner", "department"].includes(key) &&
          value.trim() === "Unassigned",
      )
    )
      return "Enter an accountable owner and department."
    if (
      tab === "Overview" &&
      (draft.due < draft.start || draft.nextReview < draft.start)
    )
      return "Target completion and next review must be on or after the start date."
    if (
      tab === "Overview" &&
      (!Number.isFinite(Number(draft.progress)) ||
        Number(draft.progress) < 0 ||
        Number(draft.progress) > 100)
    )
      return "Progress must be between 0 and 100."
    if (
      tab === "Outcomes" &&
      ["baseline", "target", "actual"].some(
        (key) =>
          !Number.isFinite(Number(draft[key])) ||
          (draft.unit === "%" &&
            (Number(draft[key]) < 0 || Number(draft[key]) > 100)),
      )
    )
      return "Enter valid numbers. Percentage values must be between 0 and 100."
    if (tab === "Tasks") {
      const seen = new Set([editing!.id])
      let next = draft.dependency
      while (next) {
        if (seen.has(next))
          return "Choose a dependency that does not create a cycle."
        seen.add(next)
        next = plan.tasks.find((t) => t.id === next)?.dependency || ""
      }
    }
    return ""
  }
  const submit = (draft: Record<string, string>) => {
    const id = editing!.id || crypto.randomUUID()
    if (tab === "Overview")
      save({
        ...draft,
        supporting: draft.supporting
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        progress: Number(draft.progress),
      } as Partial<WorkPlan>)
    if (tab === "Tasks") {
      const task = { ...editing!.values, ...draft, id } as WorkTask
      const tasks = editing!.id
        ? plan.tasks.map((t) => (t.id === id ? task : t))
        : [...plan.tasks, task]
      save({
        tasks,
        progress: Math.round(
          (tasks.filter((t) => t.status === "Completed").length /
            tasks.length) *
            100,
        ),
      })
    }
    if (tab === "Follow-ups")
      save({
        tasks: plan.tasks.map((t) => ({
          ...t,
          note: undefined,
          notes: [
            ...(
              t.notes ||
              (t.note
                ? [
                    {
                      id: `${t.id}-note`,
                      type: "General" as const,
                      text: t.note,
                    },
                  ]
                : [])
            ).filter((n) => n.id !== id),
            ...(t.id === draft.taskId
              ? [{ id, type: draft.type as TaskNote["type"], text: draft.text }]
              : []),
          ],
        })),
      })
    if (tab === "Outcomes") {
      const kpi = {
        ...draft,
        id,
        baseline: Number(draft.baseline),
        target: Number(draft.target),
        actual: Number(draft.actual),
      } as WorkKpi
      save({
        kpis: editing!.id
          ? plan.kpis.map((k) => (k.id === id ? kpi : k))
          : [...plan.kpis, kpi],
      })
    }
    if (tab === "Risks & Blockers") {
      const risk = { ...draft, id } as WorkRisk
      save({
        risks: editing!.id
          ? plan.risks.map((r) => (r.id === id ? risk : r))
          : [...plan.risks, risk],
      })
    }
  }
  const rows =
    tab === "Tasks"
      ? plan.tasks.map((t) => ({
          id: t.id,
          title: t.name,
          detail: `${t.owner} · ${t.status} · ${t.due}`,
          values: { ...t },
        }))
      : tab === "Outcomes"
        ? plan.kpis.map((k) => ({
            id: k.id,
            title: k.name,
            detail: `${k.actual}${k.unit} / ${k.target}${k.unit} · ${k.status}`,
            values: {
              ...k,
              direction:
                k.direction ||
                (k.target < k.baseline ? "decrease" : "increase"),
            },
          }))
        : tab === "Risks & Blockers"
          ? plan.risks.map((r) => ({
              id: r.id,
              title: r.issue,
              detail: `${r.type || "Risk"} · ${r.severity} · ${r.status}`,
              values: { ...r, type: r.type === "Blocker" ? "Blocker" : "Risk" },
            }))
          : plan.tasks.flatMap((t) =>
              (
                t.notes ||
                (t.note
                  ? [{ id: `${t.id}-note`, type: "General", text: t.note }]
                  : [])
              ).map((n) => ({
                id: n.id,
                title: n.text,
                detail: `${n.type} · ${t.name}`,
                values: { ...n, taskId: t.id },
              })),
            )
  return (
    <main>
      <header className="page-header">
        <button className="text-button" onClick={onBack}>
          Back
        </button>
        <h1>Project details</h1>
      </header>
      <section className="content space-y-4">
        <h2 className="break-words">{plan.name}</h2>
        <p className="text-xs">
          Mobile session only · IPA Intelligence projects are unchanged.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Project sections"
        >
          {[
            "Overview",
            "Tasks",
            "Follow-ups",
            "Outcomes",
            "Risks & Blockers",
          ].map((value) => (
            <button
              role="tab"
              aria-selected={tab === value}
              key={value}
              className={`rounded-lg border p-2 text-xs ${
                tab === value ? "bg-teal-800 text-white" : "bg-white"
              }`}
              onClick={() => changeTab(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {notice && (
          <p role="status" className="text-sm text-teal-800">
            {notice}
          </p>
        )}
        {editing ? (
          <Editor
            key={`${tab}-${editing.id}`}
            title={`Edit ${tab}`}
            initial={editing.values}
            fields={fields}
            validate={validate}
            onSave={submit}
            onCancel={() => setEditing(null)}
          />
        ) : tab === "Overview" ? (
          <>
            <dl className="space-y-3 rounded-xl bg-white p-4">
              {overview.map((f) => (
                <div key={f.key}>
                  <dt className="text-xs text-slate-500">{f.label}</dt>
                  <dd className="m-0 break-words text-sm">
                    {Array.isArray(plan[(f.key as keyof WorkPlan)])
                      ? (plan[(f.key as keyof WorkPlan)] as string[]).join(
                          ", ",
                        ) || "—"
                      : String(plan[(f.key as keyof WorkPlan)] ?? "—")}
                  </dd>
                </div>
              ))}
            </dl>
            {button("Edit project", () =>
              edit(plan.id, {
                ...plan,
                supporting: plan.supporting.join(", "),
              }),
            )}
            <h3>Activity and history</h3>
            <p className="text-xs">Last updated {plan.lastUpdated}</p>
            {plan.activity.map((a, i) => (
              <p key={i} className="text-xs">
                {a.date} · {a.by}: {a.text}
              </p>
            ))}
          </>
        ) : (
          <>
            {button(
              `Add ${
                tab === "Tasks"
                  ? "task"
                  : tab === "Follow-ups"
                    ? "follow-up"
                    : tab === "Outcomes"
                      ? "outcome"
                      : "issue"
              }`,
              () =>
                edit(
                  "",
                  tab === "Tasks"
                    ? {
                        owner: plan.owner,
                        department: plan.department,
                        due: plan.due,
                        status: "Not Started",
                      }
                    : tab === "Follow-ups"
                      ? { taskId: plan.tasks[0]?.id, type: "General" }
                      : tab === "Outcomes"
                        ? {
                            owner: plan.owner,
                            direction: "increase",
                            status: "Not Yet Measured",
                            baseline: 0,
                            actual: 0,
                          }
                        : {
                            type: "Risk",
                            severity: "Medium",
                            owner: plan.owner,
                            due: plan.due,
                            status: "Open",
                          },
                ),
            )}
            {!rows.length && (
              <p className="text-sm">No records yet. Add one to get started.</p>
            )}
            {rows.map((row) => (
              <article
                key={row.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <h3 className="break-words">
                  {tab === "Tasks" ? (
                    <button
                      className="text-left text-teal-800 underline"
                      onClick={() => onOpenTask(row.id)}
                    >
                      {row.title}
                    </button>
                  ) : (
                    row.title
                  )}
                </h3>
                <p className="break-words text-xs">{row.detail}</p>
                {button(
                  `Edit ${
                    tab === "Tasks"
                      ? "task"
                      : tab === "Follow-ups"
                        ? "follow-up"
                        : tab === "Outcomes"
                          ? "outcome"
                          : "issue"
                  }`,
                  () => edit(row.id, row.values),
                )}
              </article>
            ))}
          </>
        )}
      </section>
    </main>
  )
}
