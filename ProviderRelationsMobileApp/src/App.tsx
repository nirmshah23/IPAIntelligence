import { useLayoutEffect, useRef, useState } from "react"

import ProjectDetail from "./Projects"

import { mobileProjectSeeds } from "./projectSeeds"

import type { WorkPlan, WorkTask } from "../../src/modules/intelligence/types"

type Screen = "home" | "projects" | "tasks" | "visits" | "providers" | "profile" | "task" | "provider" | "visit" | "notifications" | "followups" | "report"

type TaskStatus = WorkTask["status"]

type Task = {
  id: string
  title: string
  provider: string
  plan: string
  planId: string
  owner: string
  department: string
  dependency?: string
  priority: "High" | "Medium" | "Low"

  due: string
  status: TaskStatus
  objective: string
  outcome: string
  blocker?: string
}

type Provider = {
  id: number
  name: string
  type: "Individual" | "Facility"
  specialty: string
  location: string
  participation: string
  metric?: number
  target?: number
  issue: string
}

type Action = {
  id: number
  description: string
  provider: string
  owner: string
  due: string
  status: "Open" | "Done"
}

const providers: Provider[] = [
  {
    id: 1,
    name: "Dr. Maya Patel",
    type: "Individual",
    specialty: "Primary Care",
    location: "Central Region Clinic",
    participation: "In Network",
    metric: 58,
    target: 70,
    issue: "Low annual wellness visit completion",
  },

  {
    id: 2,
    name: "Riverside Family Health",
    type: "Facility",
    specialty: "Primary Care",
    location: "Central Region",
    participation: "In Network",
    metric: 64,
    target: 70,
    issue: "Appointment availability and outreach workflow",
  },

  {
    id: 3,
    name: "Dr. Daniel Brooks",
    type: "Individual",
    specialty: "Cardiology",
    location: "North Region Clinic",
    participation: "Out of Network",
    issue: "Specialty access gap; participation discussion required",
  },

  {
    id: 4,
    name: "Summit Orthopedic Group",
    type: "Facility",
    specialty: "Orthopedics",
    location: "North Region",
    participation: "In Network",
    issue: "Review referral patterns and capacity",
  },
]

// Fictional provider context for the visit demo; project records themselves stay unchanged.

const projectProviders: Record<string, string> = {
  "WP-2001": "Dr. Maya Patel",
  "WP-2002": "Summit Orthopedic Group",

  "WP-2003": "Riverside Family Health",
  "WP-2004": "Dr. Daniel Brooks",
}

const notesFor = (task: WorkTask) =>
  task.notes ??
  (task.note
    ? [{ id: `${task.id}-note`, type: "General" as const, text: task.note }]
    : [])

const formatDate = (date: string) =>
  date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set"

const Icon = ({ name, size = 22 }: { name: string; size?: number }) => {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),

    tasks: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m8 9 2 2 4-4M8 16h8" />
      </>
    ),

    visit: (
      <>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M8 15h8M12 12v6" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 6" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),

    chevron: <path d="m9 18 6-6-6-6" />,

    back: <path d="m15 18-6-6 6-6" />,

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    sync: (
      <>
        <path d="M20 7h-5V2M4 17h5v5" />
        <path d="M18 17a8 8 0 0 1-13-2M6 7a8 8 0 0 1 13 2" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    file: (
      <>
        <path d="M14 2H6v20h12V6z" />
        <path d="M14 2v4h4M9 13h6M9 17h6" />
      </>
    ),

    alert: (
      <>
        <path d="M12 3 2 21h20z" />
        <path d="M12 9v5M12 18h.01" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  )
}

const Badge = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: string
}) => <span className={`badge badge-${tone}`}>{children}</span>

const Button = ({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  secondary?: boolean
  disabled?: boolean
  className?: string
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`${
      secondary ? "button-secondary" : "button-primary"
    } ${className}`}
  >
    {children}
  </button>
)

export default function App() {
  const screenScroll = useRef<HTMLDivElement>(null)
  const [screen, setScreen] = useState<Screen>("home")

  const [screenHistory, setScreenHistory] = useState<Screen[]>([])

  const [plans, setPlans] = useState<WorkPlan[]>(() =>
    structuredClone(mobileProjectSeeds),
  )

  const [selectedProject, setSelectedProject] = useState("WP-2001")

  const [projectTab, setProjectTab] = useState("Overview")

  const [editingProjectTask, setEditingProjectTask] = useState<string>()

  const tasks: Task[] = plans.flatMap((plan) =>
    plan.tasks.map((item) => ({
      id: item.id,
      title: item.name,
      planId: plan.id,
      plan: plan.name,
      priority: plan.priority,

      provider: projectProviders[plan.id] || "",
      owner: item.owner,
      department: item.department,

      dependency: plan.tasks.find((other) => other.id === item.dependency)
        ?.name,

      due: item.due,
      status: item.status,
      objective: plan.objective,
      outcome: plan.expectedResult,

      blocker: notesFor(item).find((note) => note.type === "Blocker")?.text,
    })),
  )

  const projectFollowups = plans.flatMap((plan) =>
    plan.tasks.flatMap((item) =>
      notesFor(item).map((note) => ({
        ...note,
        taskId: item.id,
        taskName: item.name,
        planId: plan.id,
        project: plan.name,
      })),
    ),
  )

  const [selectedTask, setSelectedTask] = useState("T-2")

  const [selectedProvider, setSelectedProvider] = useState(1)

  const [taskFilter, setTaskFilter] = useState("All")

  const [query, setQuery] = useState("")

  const [providerQuery, setProviderQuery] = useState("")

  const [providerFilter, setProviderFilter] = useState("All")

  const [toast, setToast] = useState("")

  const [visitStep, setVisitStep] = useState(0)

  const [visitDraft, setVisitDraft] = useState({
    type: "In-person",
    attendees: "",
    notes: "",
    barriers: "",
    commitment: "",
    owner: "Jordan Lee",
    due: "2026-10-29",
    evidence: false,
  })

  const [draftSaved, setDraftSaved] = useState(false)

  const [submitted, setSubmitted] = useState(false)

  const [prefs, setPrefs] = useState([true, true, false])

  const [actions, setActions] = useState<Action[]>([
    {
      id: 1,
      description: "Send outreach workflow template",
      provider: "Dr. Maya Patel",
      owner: "Jordan Lee",
      due: "Oct 20",
      status: "Open",
    },

    {
      id: 2,
      description: "Confirm scheduling lead availability",
      provider: "Riverside Family Health",
      owner: "Jordan Lee",
      due: "Oct 24",
      status: "Open",
    },
  ])

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Task needs attention: Approve routing recommendation",
      meta: "Reduce out-of-network orthopedic referrals",
      target: "T-5",
      read: false,
    },

    {
      id: 2,
      text: "Follow-up due today",
      meta: "Dr. Maya Patel",
      target: "",
      read: false,
    },

    {
      id: 3,
      text: "Manager replied to your blocker",
      meta: "Network decision required",
      target: "T-5",
      read: true,
    },
  ])

  const task = tasks.find((t) => t.id === selectedTask) || tasks[0]

  const today = new Date().toISOString().slice(0, 10)

  const soon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const openTasks = tasks.filter(
    (item) => !["Completed", "Cancelled"].includes(item.status),
  )

  const provider =
    providers.find((p) => p.id === selectedProvider) || providers[0]

  const go = (next: Screen) => {
    if (next === screen) return

    setScreenHistory((history) => [...history, screen])

    setScreen(next)

    screenScroll.current?.scrollTo(0, 0)
  }

  const goBack = (fallback: Screen) => {
    const previous = screenHistory.at(-1)

    setScreenHistory((history) => history.slice(0, -1))

    setScreen(previous ?? fallback)

    screenScroll.current?.scrollTo(0, 0)
  }

  const notify = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(""), 2400)
  }

  const openTask = (id: string) => {
    setSelectedTask(id)
    go("task")
  }

  const startVisit = (id = selectedTask) => {
    setSelectedTask(id)
    setVisitStep(0)
    setSubmitted(false)
    go("visit")
  }

  const savePlan = (saved: WorkPlan) =>
    setPlans((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    )

  const openProject = (id: string, tab = "Overview", taskId?: string) => {
    setSelectedProject(id)
    setProjectTab(tab)
    setEditingProjectTask(taskId)
    go("projects")
  }

  const updateTask = (patch: Partial<WorkTask>) =>
    setPlans((items) =>
      items.map((plan) => {
        if (!plan.tasks.some((item) => item.id === selectedTask)) return plan

        const updated = plan.tasks.map((item) =>
          item.id === selectedTask ? { ...item, ...patch } : item,
        )

        return {
          ...plan,
          tasks: updated,
          progress: Math.round(
            (updated.filter((item) => item.status === "Completed").length /
              updated.length) *
              100,
          ),
          lastUpdated: new Date().toISOString().slice(0, 10),
          activity: [{ date: new Date().toISOString().slice(0, 10), by: 'Jordan Lee', text: `Task updated in mobile demo: ${updated.find(item => item.id === selectedTask)?.name}` }, ...plan.activity],
        }
      }),
    )

  const nav: { id: Screen; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "tasks", label: "My Tasks", icon: "tasks" },

    { id: "visits", label: "Visits", icon: "visit" },
    { id: "providers", label: "Providers", icon: "users" },
    { id: "profile", label: "Profile", icon: "user" },
  ]

  const Header = ({
    title,
    onBack,
    right,
  }: {
    title: string
    onBack?: () => void
    right?: React.ReactNode
  }) => (
    <header className="page-header">
      <div className="header-side">
        {onBack && (
          <button
            type="button"
            className="icon-button"
            onClick={onBack}
            aria-label="Go back"
          >
            <Icon name="back" />
          </button>
        )}
      </div>
      <h1>{title}</h1>
      <div className="header-side right">{right}</div>
    </header>
  )

  const TaskCard = ({ item }: { item: Task }) => (
    <button className="task-card" onClick={() => openTask(item.id)}>
      <div className="card-top">
        <Badge
          tone={
            item.priority === "High"
              ? "urgent"
              : item.priority === "Medium"
                ? "warm"
                : "neutral"
          }
        >
          {item.priority}
        </Badge>
        <Badge
          tone={
            item.status === "Blocked"
              ? "urgent"
              : item.status === "In Progress"
                ? "blue"
                : item.status === "Completed"
                  ? "success"
                  : "neutral"
          }
        >
          {item.status}
        </Badge>
      </div>
      <strong>{item.title}</strong>
      <span className="provider-line">
        {item.owner} · {item.department}
      </span>
      <span className="plan-line">{item.plan}</span>
      {item.blocker && (
        <span className="blocker">
          <Icon name="alert" size={15} />
          {item.blocker}
        </span>
      )}
      <div className="due-row">
        <span>Due {formatDate(item.due)}</span>
        <Icon name="chevron" size={18} />
      </div>
    </button>
  )

  const BottomNav = () => (
    <nav className="bottom-nav">
      {nav.map((n) => (
        <button
          key={n.id}
          onClick={() => go(n.id)}
          className={screen === n.id ? "active" : ""}
        >
          <Icon name={n.icon} />
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  )

  const Home = () => (
    <main>
      <section className="hero">
        <div className="hero-top">
          <div>
            <span className="eyebrow">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <h1>Good morning, Jordan</h1>
            <p>Provider Relations · Central Region</p>
          </div>
          <button
            className="notification-button"
            onClick={() => go("notifications")}
            aria-label="Notifications"
          >
            <Icon name="bell" />
            {notifications.some((n) => !n.read) && (
              <i>{notifications.filter((n) => !n.read).length}</i>
            )}
          </button>
        </div>
        <div className="sync">
          <Icon name="sync" size={14} /> Mobile demo · Changes reset on reload;
          portal projects are unchanged
        </div>
      </section>
      <section className="content home-content">
        <div className="stats">
          <button
            onClick={() => {
              setTaskFilter("Due soon")
              go("tasks")
            }}
          >
            <b>
              {
                openTasks.filter(
                  (item) => item.due >= today && item.due <= soon,
                ).length
              }
            </b>
            <span>Due soon</span>
          </button>
          <button
            onClick={() => {
              setTaskFilter("Overdue")
              go("tasks")
            }}
          >
            <b className="danger">
              {openTasks.filter((item) => item.due < today).length}
            </b>
            <span>Overdue</span>
          </button>
          <button onClick={() => go("visits")}>
            <b>2</b>
            <span>Visits</span>
          </button>
          <button onClick={() => go("followups")}>
            <b>{projectFollowups.length + actions.length}</b>
            <span>Follow-ups</span>
          </button>
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow teal">CONTINUE WHERE YOU LEFT OFF</span>
            <h2>Active projects</h2>
          </div>
        </div>
        <div className="space-y-3" role="region" aria-label="Active projects">
          {plans
            .filter((plan) => !["Completed", "Cancelled"].includes(plan.status))
            .map((plan) => (
              <button
                key={plan.id}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"
                onClick={() => openProject(plan.id)}
              >
                <h3 className="m-0! line-clamp-2 text-sm! leading-snug font-semibold">{plan.name}</h3>
                <div className="my-2 flex items-center justify-between gap-2">
                  <Badge tone={plan.health === "On Track" ? "success" : "urgent"}>{plan.health}</Badge>
                  <span className="shrink-0 text-xs font-semibold text-teal-800">{plan.progress}% complete</span>
                </div>
                <div className="progress" aria-label={`${plan.progress}% complete`}><i style={{ width: `${plan.progress}%` }} /></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Due {formatDate(plan.due)}</span><Icon name="chevron" size={16} />
                </div>
              </button>
            ))}
          {!plans.some(
            (plan) => !["Completed", "Cancelled"].includes(plan.status),
          ) && (
            <p className="text-sm">
              No active projects. Your project tasks remain available in My
              Tasks.
            </p>
          )}
        </div>
        <div className="section-heading">
          <h2>Today’s priorities</h2>
          <button onClick={() => go("tasks")}>View all</button>
        </div>
        <div className="priority-list">
          {openTasks.slice(0, 3).map((t, i) => (
            <button key={t.id} onClick={() => openTask(t.id)}>
              <span className={`priority-index p${i}`}>{i + 1}</span>
              <div>
                <strong>{t.title}</strong>
                <small>
                  {t.plan} · Due {formatDate(t.due)}
                </small>
              </div>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
        <h2 className="quick-title">Quick actions</h2>
        <div className="quick-actions">
          <button onClick={() => startVisit("T-2")}>
            <span>
              <Icon name="plus" />
            </span>
            Start visit
          </button>
          <button onClick={() => go("tasks")}>
            <span>
              <Icon name="tasks" />
            </span>
            My tasks
          </button>
          <button onClick={() => go("providers")}>
            <span>
              <Icon name="search" />
            </span>
            Find provider
          </button>
        </div>
      </section>
    </main>
  )

  const Tasks = () => {
    const visible = [...tasks]
      .sort((a, b) => a.due.localeCompare(b.due))
      .filter(
        (t) =>
          (taskFilter === "All" ||
            (taskFilter === "Due soon"
              ? t.due >= today &&
                t.due <= soon &&
                !["Completed", "Cancelled"].includes(t.status)
              : taskFilter === "Overdue"
                ? t.due < today &&
                  !["Completed", "Cancelled"].includes(t.status)
                : taskFilter === "To Do"
                  ? t.status === "Not Started"
                  : t.status === taskFilter)) &&
          `${t.title} ${t.plan} ${t.owner} ${t.department} ${t.provider}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )

    return (
      <main>
        <Header title="My Tasks" />
        <section className="content">
          <label className="search">
            <Icon name="search" size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, projects or owners"
            />
          </label>
          <div className="chips">
            {[
              "All",
              "To Do",
              "In Progress",
              "Blocked",
              "Awaiting Review",
              "Completed",
              "Cancelled",
              "Due soon",
              "Overdue",
            ].map((f) => (
              <button
                key={f}
                className={taskFilter === f ? "selected" : ""}
                onClick={() => setTaskFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="list-meta">
            <span>{visible.length} project tasks</span>
            <button
              onClick={() => notify("Project tasks are sorted by due date")}
            >
              Due date ↓
            </button>
          </div>
          <div className="card-list">
            {visible.map((t) => (
              <TaskCard key={t.id} item={t} />
            ))}
          </div>
          {!visible.length && (
            <div className="empty">
              <Icon name="search" size={36} />
              <h3>No tasks found</h3>
              <p>Try changing your search or filters.</p>
            </div>
          )}
        </section>
      </main>
    )
  }

  const TaskDetail = () => {
    const plan = plans.find((item) => item.id === task.planId)!

    const record = plan.tasks.find((item) => item.id === task.id)!

    return (
      <main>
        <Header
          title="Task details"
          onBack={() => goBack("tasks")}
          right={
            <button
              className="text-button"
              onClick={() => openProject(plan.id, "Tasks", task.id)}
            >
              Edit task
            </button>
          }
        />
        <section className="content detail-content">
          <div className="title-block">
            <div className="card-top">
              <Badge tone={task.priority === "High" ? "urgent" : "warm"}>
                {task.priority} priority
              </Badge>
              <Badge tone={task.status === "Blocked" ? "urgent" : "blue"}>
                {task.status}
              </Badge>
            </div>
            <h2>{task.title}</h2>
            <button
              className="text-left text-sm text-teal-800 underline"
              onClick={() => openProject(plan.id)}
            >
              {plan.name}
            </button>
          </div>
          <div className="info-grid">
            <div>
              <span>Due date</span>
              <strong>{formatDate(task.due)}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{task.owner}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{task.department}</strong>
            </div>
            <div>
              <span>Depends on</span>
              <strong>{task.dependency || "None"}</strong>
            </div>
          </div>
          <section className="white-section">
            <span className="eyebrow">PROJECT OBJECTIVE</span>
            <p>{plan.objective}</p>
            <span className="eyebrow">EXPECTED RESULT</span>
            <p>{plan.expectedResult}</p>
          </section>
          <section className="white-section">
            <div className="section-heading">
              <h3>Follow-ups</h3>
              <button onClick={() => openProject(plan.id, "Follow-ups")}>
                Manage follow-ups
              </button>
            </div>
            {notesFor(record).map((note) => (
              <div key={note.id} className="my-3">
                <Badge>{note.type}</Badge>
                <p>{note.text}</p>
              </div>
            ))}
            {!notesFor(record).length && <p>No follow-ups yet.</p>}
          </section>
          <div className="secondary-actions">
            <Button
              secondary
              onClick={() => {
                const next: TaskStatus =
                  task.status === "Completed" ? "In Progress" : "Completed"
                updateTask({ status: next })
                notify(`Task marked ${next}`)
              }}
            >
              {task.status === "Completed" ? "Reopen task" : "Mark complete"}
            </Button>
            <Button
              secondary
              onClick={() => openProject(plan.id, "Risks & Blockers")}
            >
              Risks & blockers
            </Button>
          </div>
          <div className="mt-3">
            <Button secondary onClick={() => openProject(plan.id, "Outcomes")}>
              Project outcomes
            </Button>
          </div>
        </section>

      </main>
    )
  }

  const Visit = () => {
    if (submitted)
      return (
        <main className="success-page">
          <div className="success-mark">
            <Icon name="check" size={34} />
          </div>
          <span className="eyebrow teal">REPORT SUBMITTED</span>
          <h1>Visit captured</h1>
          <p>
            Your visit report was submitted and the follow-up was added to your
            work queue.
          </p>
          <div className="reference">
            <span>Report reference</span>
            <strong>VIS-2026-0108</strong>
          </div>
          <Button onClick={() => go("report")}>View visit report</Button>
          <Button secondary onClick={() => go("home")}>
            Return home
          </Button>
        </main>
      )

    const visitPlan = plans.find((item) => item.id === task.planId)!

    const measurement = visitPlan.kpis[0]

    const canReview =
      visitDraft.attendees.trim() &&
      visitDraft.notes.trim() &&
      visitDraft.commitment.trim()

    return (
      <main>
        <Header
          title={
            visitStep === 0
              ? "Prepare visit"
              : visitStep === 1
                ? "Record visit"
                : "Review & submit"
          }
          onBack={() =>
            visitStep > 0 ? setVisitStep((step) => step - 1) : goBack("task")
          }
          right={
            visitStep === 1 ? (
              <button
                className="text-button"
                onClick={() => {
                  setDraftSaved(true)
                  notify("Draft saved")
                }}
              >
                Save draft
              </button>
            ) : undefined
          }
        />
        <div className="stepper">
          {[0, 1, 2].map((s, i) => (
            <div key={s} className={visitStep >= s ? "done" : ""}>
              <i>{visitStep > s ? <Icon name="check" size={14} /> : i + 1}</i>
              <span>{["Prepare", "Details", "Review"][i]}</span>
            </div>
          ))}
        </div>
        {visitStep === 0 && (
          <section className="content">
            <div className="visit-provider">
              <span className="avatar">MP</span>
              <div>
                <span>VISITING</span>
                <h2>{task.provider}</h2>
                <p>
                  {providers.find((p) => p.name === task.provider)?.specialty}
                </p>
              </div>
            </div>
            <section className="white-section">
              <span className="eyebrow">VISIT PURPOSE</span>
              <h3>{task.title}</h3>
              <p>{task.objective}</p>
            </section>
            <section className="white-section">
              <span className="eyebrow">PROJECT</span>
              <p>{task.plan}</p>
              {measurement && (
                <>
                  <span className="eyebrow">{measurement.name}</span>
                  <p>
                    Current {measurement.actual}
                    {measurement.unit} · Target {measurement.target}
                    {measurement.unit}
                  </p>
                </>
              )}
            </section>
            <div className="privacy">
              <Icon name="alert" size={18} />
              <span>
                Do not include patient names or patient-level information.
              </span>
            </div>
            <div className="sticky-inline">
              <Button onClick={() => setVisitStep(1)}>
                Begin visit <Icon name="chevron" size={19} />
              </Button>
            </div>
          </section>
        )}
        {visitStep === 1 && (
          <section className="content form-content">
            <div className="active-visit">
              <i />
              <div>
                <span>VISIT IN PROGRESS</span>
                <strong>{task.provider}</strong>
              </div>
              <time>Started 9:04 AM</time>
            </div>
            <fieldset>
              <legend>Visit type</legend>
              <div className="segment">
                {["In-person", "Phone", "Virtual"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisitDraft((d) => ({ ...d, type: v }))}
                    className={visitDraft.type === v ? "selected" : ""}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              Attendees <b>*</b>
              <input
                value={visitDraft.attendees}
                onChange={(e) =>
                  setVisitDraft((d) => ({ ...d, attendees: e.target.value }))
                }
                placeholder="Names and roles"
              />
            </label>
            <label>
              Discussion notes <b>*</b>
              <textarea
                value={visitDraft.notes}
                onChange={(e) =>
                  setVisitDraft((d) => ({ ...d, notes: e.target.value }))
                }
                placeholder="Key topics and provider feedback"
              />
            </label>
            <label>
              Barriers identified
              <textarea
                value={visitDraft.barriers}
                onChange={(e) =>
                  setVisitDraft((d) => ({ ...d, barriers: e.target.value }))
                }
                placeholder="Workflow, staffing, scheduling..."
              />
            </label>
            <div className="form-card">
              <div className="section-heading">
                <h3>Commitment / action</h3>
                <Badge tone="blue">Required</Badge>
              </div>
              <label>
                Description
                <input
                  value={visitDraft.commitment}
                  onChange={(e) =>
                    setVisitDraft((d) => ({ ...d, commitment: e.target.value }))
                  }
                  placeholder="What was agreed?"
                />
              </label>
              <div className="two-col">
                <label>
                  Owner
                  <input
                    value={visitDraft.owner}
                    onChange={(e) =>
                      setVisitDraft((d) => ({ ...d, owner: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    value={visitDraft.due}
                    onChange={(e) =>
                      setVisitDraft((d) => ({ ...d, due: e.target.value }))
                    }
                  />
                </label>
              </div>
            </div>
            <button
              className="evidence"
              onClick={() => {
                setVisitDraft((d) => ({ ...d, evidence: true }))
                notify("Mock evidence attached")
              }}
            >
              <span>
                <Icon name="plus" />
              </span>
              <div>
                <strong>Add permitted evidence</strong>
                <small>
                  Meeting materials or provider handouts or provider visit photo
                </small>
              </div>
            </button>
            {visitDraft.evidence && (
              <div className="attachment">
                <Icon name="file" />
                <div>
                  <strong>Wellness-workflow-notes.pdf</strong>
                  <small>Mock attachment · 248 KB</small>
                </div>
                <Badge tone="success">Added</Badge>
              </div>
            )}
            {!canReview && (
              <p className="validation">
                Complete all required fields to continue.
              </p>
            )}
            <div className="privacy">
              <Icon name="alert" size={18} />
              <span>
                No patient information. Evidence is simulated for this
                prototype.
              </span>
            </div>
            <div className="sticky-inline">
              <Button disabled={!canReview} onClick={() => setVisitStep(2)}>
                Review visit
              </Button>
            </div>
          </section>
        )}
        {visitStep === 2 && (
          <section className="content review-content">
            <div className="review-hero">
              <span>VISIT SUMMARY</span>
              <h2>{task.provider}</h2>
              <p>Oct 20, 2026 · {visitDraft.type}</p>
            </div>
            {[
              ["Attendees", visitDraft.attendees],
              ["Discussion notes", visitDraft.notes],
              ["Barriers identified", visitDraft.barriers || "None documented"],
            ].map(([a, b]) => (
              <section className="review-row" key={a}>
                <span>{a}</span>
                <p>{b}</p>
              </section>
            ))}
            <section className="action-review">
              <span>AGREED ACTION</span>
              <h3>{visitDraft.commitment}</h3>
              <div>
                <span>
                  Owner
                  <br />
                  <b>{visitDraft.owner}</b>
                </span>
                <span>
                  Due
                  <br />
                  <b>{formatDate(visitDraft.due)}</b>
                </span>
              </div>
            </section>
            {visitDraft.evidence && (
              <section className="review-row">
                <span>Evidence</span>
                <p>Wellness-workflow-notes.pdf</p>
              </section>
            )}
            <Button secondary onClick={() => setVisitStep(1)}>
              Edit visit details
            </Button>
            <div className="sticky-inline">
              <Button
                onClick={() => {
                  setSubmitted(true)
                  updateTask({
                    status: "In Progress",
                    note: undefined,
                    notes: [
                      ...notesFor(
                        visitPlan.tasks.find((item) => item.id === task.id)!,
                      ),
                      {
                        id: crypto.randomUUID(),
                        type: "Instruction",
                        text: `${visitDraft.commitment} — Owner: ${visitDraft.owner}; due: ${visitDraft.due}. ${visitDraft.notes}`,
                      },
                    ],
                  })
                }}
              >
                Submit visit report
              </Button>
            </div>
          </section>
        )}
      </main>
    )
  }

  const Visits = () => (
    <main>
      <Header
        title="Visits"
        right={
          <button
            className="icon-button small"
            onClick={() => startVisit("T-2")}
          >
            <Icon name="plus" />
          </button>
        }
      />
      <section className="content">
        <div className="tabs">
          <button className="active">Upcoming</button>
          <button onClick={() => notify("Showing completed visits")}>
            Completed
          </button>
          <button onClick={() => notify("Showing saved drafts")}>
            Drafts {draftSaved && "· 1"}
          </button>
        </div>
        {draftSaved && (
          <button
            className="draft-card"
            onClick={() => {
              setVisitStep(1)
              go("visit")
            }}
          >
            <Badge tone="warm">Draft</Badge>
            <h3>{task.provider}</h3>
            <p>{task.title}</p>
            <span>
              Saved just now · Resume <Icon name="chevron" size={17} />
            </span>
          </button>
        )}
        <h3 className="list-title">Upcoming</h3>
        <button className="visit-card" onClick={() => startVisit("T-2")}>
          <div className="date-tile">
            <b>22</b>
            <span>OCT</span>
          </div>
          <div>
            <Badge tone="blue">In-person</Badge>
            <h3>Dr. Maya Patel</h3>
            <p>Annual wellness visit gap</p>
            <small>10:00 AM · Central Region Clinic</small>
          </div>
        </button>
        <h3 className="list-title">Recent reports</h3>
        <button className="visit-card" onClick={() => go("report")}>
          <div className="date-tile muted">
            <b>16</b>
            <span>OCT</span>
          </div>
          <div>
            <Badge tone="success">Submitted</Badge>
            <h3>Dr. Maya Patel</h3>
            <p>Preventive-care performance discussion</p>
          </div>
        </button>
      </section>
    </main>
  )

  const Providers = () => {
    const list = providers.filter(
      (p) =>
        (providerFilter === "All" || p.type === providerFilter) &&
        `${p.name} ${p.specialty}`
          .toLowerCase()
          .includes(providerQuery.toLowerCase()),
    )

    return (
      <main>
        <Header title="Providers" />
        <section className="content">
          <label className="search">
            <Icon name="search" size={19} />
            <input
              placeholder="Search name or specialty"
              value={providerQuery}
              onChange={(e) => setProviderQuery(e.target.value)}
            />
          </label>
          <div className="chips">
            {["All", "Individual", "Facility"].map((f) => (
              <button
                className={providerFilter === f ? "selected" : ""}
                key={f}
                onClick={() => setProviderFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="card-list">
            {list.map((p) => (
              <button
                className="provider-card"
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id)
                  go("provider")
                }}
              >
                <span className="provider-avatar">
                  {p.type === "Individual"
                    ? p.name
                        .split(" ")
                        .slice(-2)
                        .map((x) => x[0])
                        .join("")
                    : p.name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)}
                </span>
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.specialty} · {p.location}
                  </p>
                  <Badge
                    tone={p.participation === "In Network" ? "success" : "warm"}
                  >
                    {p.participation}
                  </Badge>
                  {p.metric && (
                    <span className="mini-metric">
                      {p.metric}% / {p.target}% target
                    </span>
                  )}
                </div>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  const ProviderDetail = () => (
    <main>
      <Header title="Provider" onBack={() => goBack("providers")} />
      <section className="content">
        <div className="provider-hero">
          <span className="provider-avatar large">
            {provider.name
              .split(" ")
              .slice(-2)
              .map((x) => x[0])
              .join("")}
          </span>
          <h2>{provider.name}</h2>
          <p>
            {provider.specialty} · {provider.type}
          </p>
          <Badge
            tone={provider.participation === "In Network" ? "success" : "warm"}
          >
            {provider.participation}
          </Badge>
        </div>
        <section className="white-section">
          <div className="detail-row">
            <span>Location</span>
            <strong>{provider.location}</strong>
          </div>
          <div className="detail-row">
            <span>Open issue</span>
            <strong>{provider.issue}</strong>
          </div>
        </section>
        {provider.metric && (
          <section className="metric-card">
            <div>
              <span>Current</span>
              <b>{provider.metric}%</b>
            </div>
            <div className="metric-arrow">→</div>
            <div>
              <span>Target</span>
              <b>{provider.target}%</b>
            </div>
          </section>
        )}
        <div className="section-heading">
          <h2>Open tasks</h2>
        </div>
        {tasks
          .filter((t) => t.provider === provider.name)
          .map((t) => (
            <TaskCard key={t.id} item={t} />
          ))}
        <div className="quick-provider">
          <Button
            onClick={() => {
              const t = tasks.find((t) => t.provider === provider.name)
              if (t) startVisit(t.id)
              else notify("No assigned task for this provider")
            }}
          >
            Start visit
          </Button>
          <Button secondary onClick={() => notify("Provider note added")}>
            Add note
          </Button>
        </div>
      </section>
    </main>
  )

  const Followups = () => (
    <main>
      <Header title="Follow-ups" onBack={() => goBack("home")} />
      <section className="content">
        <p className="page-intro">
          Project follow-ups and actions from provider visits.
        </p>
        <div className="mb-4 space-y-3">
          {projectFollowups.map((note) => (
            <article
              key={`${note.planId}-${note.taskId}-${note.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <Badge>{note.type}</Badge>
              <h3 className="mt-3 break-words">{note.text}</h3>
              <p className="text-xs">
                {note.taskName} · {note.project}
              </p>
              <Button
                secondary
                onClick={() => openProject(note.planId, "Follow-ups")}
              >
                Manage follow-up
              </Button>
            </article>
          ))}
        </div>
        <div className="card-list">
          {actions.map((a) => (
            <article
              className={`follow-card ${a.status === "Done" ? "complete" : ""}`}
              key={a.id}
            >
              <button
                className={`round-check ${
                  a.status === "Done" ? "checked" : ""
                }`}
                onClick={() =>
                  setActions((all) =>
                    all.map((x) =>
                      x.id === a.id
                        ? {
                            ...x,
                            status: x.status === "Done" ? "Open" : "Done",
                          }
                        : x,
                    ),
                  )
                }
              >
                {a.status === "Done" && <Icon name="check" size={16} />}
              </button>
              <div>
                <Badge tone={a.status === "Done" ? "success" : "warm"}>
                  {a.status}
                </Badge>
                <h3>{a.description}</h3>
                <p>{a.provider}</p>
                <small>
                  {a.owner} · Due {a.due}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )

  const Notifications = () => (
    <main>
      <Header
        title="Notifications"
        onBack={() => goBack("home")}
        right={
          <button
            className="text-button"
            onClick={() =>
              setNotifications((n) => n.map((x) => ({ ...x, read: true })))
            }
          >
            Mark all read
          </button>
        }
      />
      <section className="content notification-list">
        {notifications.map((n) => (
          <button
            className={n.read ? "" : "unread"}
            key={n.id}
            onClick={() => {
              setNotifications((all) =>
                all.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
              )
              if (n.target) openTask(n.target)
              else go("followups")
            }}
          >
            <i />
            <div>
              <strong>{n.text}</strong>
              <span>{n.meta} · Today</span>
            </div>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </section>
    </main>
  )

  const Report = () => (
    <main>
      <Header title="Visit report" onBack={() => goBack("visits")} />
      <section className="content">
        <div className="report-head">
          <Badge tone="success">Submitted</Badge>
          <h2>Preventive-care performance discussion</h2>
          <p>Dr. Maya Patel · Oct 16, 2026</p>
          <strong>VIS-2026-0107</strong>
        </div>
        <section className="white-section">
          <span className="eyebrow">VISIT DETAILS</span>
          <div className="detail-row">
            <span>Type</span>
            <strong>In-person</strong>
          </div>
          <div className="detail-row">
            <span>Attendees</span>
            <strong>Dr. Patel, Office Manager, Jordan Lee</strong>
          </div>
        </section>
        <section className="white-section">
          <span className="eyebrow">DISCUSSION NOTES</span>
          <p>
            Reviewed current wellness visit completion rate and identified
            outreach workflow opportunities.
          </p>
          <span className="eyebrow">BARRIERS</span>
          <p>Limited staff capacity for outbound scheduling.</p>
        </section>
        <Button onClick={() => go("followups")}>View follow-up actions</Button>
      </section>
    </main>
  )

  const Profile = () => {
    return (
      <main>
        <Header title="Profile" />
        <section className="content">
          <div className="profile-card">
            <span className="avatar large">JL</span>
            <h2>Jordan Lee</h2>
            <p>Provider Relations Representative</p>
            <small>Central Region</small>
          </div>
          <section className="white-section">
            <div className="section-heading">
              <h3>Demo session</h3>
              <Badge tone="neutral">Session only</Badge>
            </div>
            <div className="sync-row">
              <Icon name="sync" />
              <div>
                <strong>Changes stay in this tab</strong>
                <span>
                  Reloading resets the mobile demo. No workspace records are
                  changed.
                </span>
              </div>
            </div>
          </section>
          <section className="white-section">
            <h3>Notifications</h3>
            {[
              "Tasks and due dates",
              "Follow-up reminders",
              "Manager updates",
            ].map((x, i) => (
              <div className="toggle-row" key={x}>
                <span>{x}</span>
                <button
                  onClick={() =>
                    setPrefs((p) => p.map((v, j) => (j === i ? !v : v)))
                  }
                  className={prefs[i] ? "on" : ""}
                >
                  <i />
                </button>
              </div>
            ))}
          </section>
          <section className="privacy-card">
            <Icon name="alert" />
            <div>
              <strong>Protect sensitive information</strong>
              <p>
                Never enter patient names, member IDs, or clinical information
                in this app.
              </p>
            </div>
          </section>
          <a className="button-secondary" href="../#/relations/workplans">
            Return to IPA Workspace
          </a>
          <p className="version">Provider Relations Mobile · Prototype v1.0</p>
        </section>
      </main>
    )
  }

  let content: React.ReactNode

  if (screen === "projects")
    content = (
      <ProjectDetail
        key={`${selectedProject}-${projectTab}-${editingProjectTask || ""}`}
        plan={plans.find((item) => item.id === selectedProject)!}
        initialTab={projectTab}
        initialTaskId={editingProjectTask}
        onSave={savePlan}
        onBack={() => goBack("home")}
        onOpenTask={openTask}
      />
    )
  else if (screen === "home") content = Home()
  else if (screen === "tasks") content = Tasks()
  else if (screen === "task") content = TaskDetail()
  else if (screen === "visit") content = Visit()
  else if (screen === "visits") content = Visits()
  else if (screen === "providers") content = Providers()
  else if (screen === "provider") content = ProviderDetail()
  else if (screen === "followups") content = Followups()
  else if (screen === "notifications") content = Notifications()
  else if (screen === "report") content = Report()
  else content = Profile()

  const rootTabs: Screen[] = ["home", "tasks", "visits", "providers", "profile"]

  useLayoutEffect(() => {
    screenScroll.current?.scrollTo(0, 0)
  }, [screen, visitStep, selectedProject])

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <aside
        aria-label="Mobile demo information"
        className="mx-auto w-full max-w-[430px] shrink-0 px-4 py-2 text-xs leading-relaxed text-[#173c49]"
      >
        <a
          href="../#/relations/workplans"
          className="font-semibold underline underline-offset-4"
        >
          Back to IPA Workspace
        </a>
      </aside>
      <div className="app-shell">
        <div className="phone">
          <div ref={screenScroll} role="region" aria-label="Mobile screen" tabIndex={0} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable]">
            {content}
          </div>
          {screen === 'task' && <div className="sticky-action"><Button onClick={() => startVisit(task.id)}><Icon name="visit" size={19} /> Start provider visit</Button></div>}
          {rootTabs.includes(screen) && BottomNav()}
          {toast && (
            <div className="toast">
              <Icon name="check" size={17} />
              {toast}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
