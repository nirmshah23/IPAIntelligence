import { readAssuranceStorage } from "./storage";
import { WorkflowDetail } from "./WorkflowDetail";
import { initializeWorkflow, workflowDefinitions } from "./workflows";
import { PaginatedTable, PaginatedList } from "../../components/PaginatedResults";
import { useEffect, useRef, useMemo, useState } from "react";
import { QualityDetail } from "./QualityDetail";
import { initializeQuality, isQuality } from "./quality";
import { EligibilityDetail } from "./EligibilityDetail";
import { initializeEligibility, syncEligibilityDependency } from "./eligibility";
import { CredentialingDetail } from "./CredentialingDetail";
import { additionalObligations } from "./seedObligations";
import { initialSchedule, scheduleTypes, scheduleError, occurrenceDates, displayDate, type Schedule } from "./schedule";

import type { Page, Item } from './types';
export type { Page } from './types';

const seed: Item[] = [
  { id:"ELG-2026-03", title:"Monthly eligibility file — March", category:"Eligibility", payer:"Northstar Health", period:"March 2026", due:"Apr 3, 2026 · 5:00 PM ET", owner:"Maya Chen", execution:"Completed", deadline:"On track", verification:"Verified", risk:"High", next:"No action" },
  { id:"ELG-2026-04", title:"Monthly eligibility file — April", category:"Eligibility", payer:"Northstar Health", period:"April 2026", due:"May 5, 2026 · 5:00 PM ET", owner:"Maya Chen", execution:"Submitted / awaiting verification", deadline:"At risk", verification:"Failed", risk:"Critical", next:"Resolve 142-record mismatch", impact:"Provider roster update blocked" },
  { id:"CRD-8842", title:"Recredentialing — Dr. Elena Ruiz", category:"Credentialing", payer:"Meridian Choice", period:"2026 cycle", due:"May 8, 2026 · 5:00 PM ET", owner:"Jon Bell", execution:"In progress", deadline:"At risk", verification:"Pending", risk:"High", next:"Obtain committee approval", impact:"Network participation renewal at risk" },
  { id:"QLT-2026-Q1", title:"Q1 quality measure submission", category:"Quality", payer:"HarborCare", period:"Q1 2026", due:"May 12, 2026 · 5:00 PM ET", owner:"Priya Shah", execution:"Submitted / awaiting verification", deadline:"On track", verification:"Pending", risk:"High", next:"Await payer acknowledgment" },
  { id:"CMP-2026-04", title:"Monthly compliance monitoring report", category:"Compliance", payer:"All plans", period:"April 2026", due:"May 15, 2026 · 3:00 PM ET", owner:"Alex Morgan", execution:"In progress", deadline:"Upcoming", verification:"Pending", risk:"Medium", next:"Reviewer sign-off" },
  { id:"POL-2026", title:"Annual privacy policy review", category:"Compliance", payer:"All plans", period:"2026", due:"Jun 1, 2026 · 5:00 PM ET", owner:"Sam Lee", execution:"Not started", deadline:"Upcoming", verification:"Not required", risk:"Medium", next:"Begin legal review" },
  { id:"CON-771", title:"Value-based contract renewal milestone", category:"Contracts", payer:"HarborCare", period:"2027 renewal", due:"Apr 28, 2026 · 12:00 PM ET", owner:"Unassigned", execution:"Blocked", deadline:"Overdue", verification:"Pending", risk:"Critical", next:"Assign executive owner", impact:"$4.2M contract renewal at risk" },
  { id:"ROS-2026-04", title:"Monthly provider roster reconciliation", category:"Provider Data", payer:"Northstar Health", period:"April 2026", due:"May 7, 2026 · 5:00 PM ET", owner:"Dana Wright", execution:"Blocked", deadline:"At risk", verification:"Pending", risk:"High", next:"Wait for eligibility acceptance", impact:"Dependent on ELG-2026-04" },
  { id:"FAC-441", title:"Facility credential renewal — Lakeview", category:"Credentialing", payer:"Meridian Choice", period:"2026 renewal", due:"May 20, 2026 · 5:00 PM ET", owner:"Jon Bell", execution:"In progress", deadline:"On track", verification:"Pending", risk:"Medium", next:"Validate insurance certificate" },
  { id:"ENC-2026-04", title:"Encounter data certification", category:"Quality", payer:"Summit Advantage", period:"April 2026", due:"May 22, 2026 · 5:00 PM ET", owner:"Priya Shah", execution:"Not started", deadline:"Upcoming", verification:"Pending", risk:"High", next:"Generate control totals" },
  ...additionalObligations,
];

const nav = [
  ["overview","Compliance workflow","grid"], ["queue","Obligations","check"],
  ["exceptions","Exceptions & escalations","alert"], ["calendar","Compliance calendar","calendar"],
  ["editor","Definition editor","settings"], ["reports","Compliance","chart"],
] as const;

function Icon({name, size=18}:{name:string,size?:number}) {
  const paths:Record<string, React.ReactNode> = {
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    check:<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    list:<><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    alert:<><path d="M10.3 2.9L1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>,
    calendar:<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
    chart:<><path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/></>, search:<circle cx="11" cy="11" r="7"/>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus:<path d="M12 5v14M5 12h14"/>, arrow:<path d="M5 12h14M13 6l6 6-6 6"/>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Chip({children, tone}:{children:React.ReactNode,tone?:string}) {
  const c = tone || (String(children).includes("Verified")||children==="On track"||children==="Completed" ? "green" : String(children).match(/Failed|Overdue|Critical|Blocked/) ? "red" : String(children).match(/At risk|Pending|awaiting/) ? "amber" : "slate");
  return <span className={`chip ${c}`}><span className="dot"/>{children}</span>;
}
function Button({children, onClick, kind="primary", disabled=false}:{children:React.ReactNode,onClick?:()=>void,kind?:string,disabled?:boolean}) {
  return <button className={`btn ${kind}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Section({title,sub,action,children}:{title:string,sub?:string,action?:React.ReactNode,children:React.ReactNode}) {
  return <section className="card"><div className="card-head"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>{children}</section>;
}

export default function App({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const [items,setItems] = useState<Item[]>(() => {
    const initialItems = seed.map(item => item.category === "Credentialing" ? {
      ...item, execution: "In progress", verification: "Pending",
      next: item.owner === "Unassigned" ? "Assign owner and verify credentialing evidence" : "Verify credentialing evidence",
    } : initializeWorkflow(initializeQuality(initializeEligibility(item))));
    let restored = initialItems;
    try {
      const saved: unknown = JSON.parse(readAssuranceStorage("credentialing") || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        restored = restored.map(item => {
          const entry = (saved as Record<string, Item>)[item.id];
          return item.category === "Credentialing" && entry?.credentialing &&
            ["Verification", "Committee review", "Approved", "Denied"].includes(entry.credentialing.stage) &&
            entry.credentialing.checks && Array.isArray(entry.credentialing.history)
            ? { ...item, ...entry, id: item.id, category: item.category } : item;
        });
      }
    } catch { /* Keep initial credentialing cases if browser storage is unavailable. */ }
    try {
      const saved: unknown = JSON.parse(readAssuranceStorage("eligibility") || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        restored = restored.map(item => {
          const entry = (saved as Record<string, Item>)[item.id];
          return item.category === "Eligibility" && entry?.eligibility &&
            ["Awaiting file", "Reconcile", "Ready to process", "Processing", "Rejected", "Accepted"].includes(entry.eligibility.stage) &&
            Array.isArray(entry.eligibility.history)
            ? { ...item, ...entry, id: item.id, category: item.category } : item;
        });
      }
    } catch { /* Keep initial eligibility cases if browser storage is unavailable. */ }
    try {
      const saved: unknown = JSON.parse(readAssuranceStorage("quality") || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        restored = restored.map(item => {
          const entry = (saved as Record<string, Item>)[item.id];
          return isQuality(item) && entry?.quality &&
            ["Prepare", "Review", "Ready to submit", "Awaiting payer", "Rejected", "Accepted"].includes(entry.quality.stage) &&
            Array.isArray(entry.quality.measures) && Array.isArray(entry.quality.history) &&
            typeof entry.quality.source === "string" && typeof entry.quality.specification === "string" &&
            typeof entry.quality.schemaPassed === "boolean"
            ? { ...item, ...entry, id: item.id, category: item.category } : item;
        });
      }
    } catch { /* Keep initial quality cases if browser storage is unavailable. */ }
    try {
      const saved = JSON.parse(readAssuranceStorage("workflows") || "{}");
      restored = restored.map(item => {
        const entry = saved?.[item.id];
        const state = entry?.workflow;
        return workflowDefinitions[item.category] && state &&
          ["Preparation", "Review", "Completed", "Rejected"].includes(state.stage) &&
          state.evidence && typeof state.evidence === "object" && !Array.isArray(state.evidence) &&
          Object.values(state.evidence).every((value: any) => value && typeof value.reference === "string" && typeof value.passed === "boolean") &&
          Array.isArray(state.history) && state.history.every((event: any) => typeof event?.at === "string" && typeof event?.text === "string") && typeof entry.owner === "string"
          ? { ...item, ...entry, id: item.id, category: item.category } : item;
      });
    } catch { /* Retain initial workflows if storage is unavailable. */ }
    try {
      const saved = JSON.parse(readAssuranceStorage("escalations") || "{}") as Record<string, Partial<Item>>;
      restored = restored.map(item => {
        const entry = saved?.[item.id];
        return entry ? {
          ...item,
          owner: entry.owner || item.owner,
          due: entry.due || item.due,
          execution: entry.execution || item.execution,
          next: entry.next || item.next,
          remediationPlan: entry.remediationPlan,
          delayReason: entry.delayReason,
          proposedDue: entry.proposedDue,
          previousDue: entry.previousDue,
          escalationAcknowledgedAt: entry.escalationAcknowledgedAt,
        } : item;
      });
    } catch { /* Keep escalation responses session-only if saved data is unavailable. */ }
    return syncEligibilityDependency(restored);
  });
  useEffect(() => {
    try { localStorage.setItem("arcwell-credentialing-v1", JSON.stringify(Object.fromEntries(items.filter(item => item.credentialing).map(item => [item.id, item])))); }
    catch { setToast("Browser storage unavailable. Credentialing changes will last for this session only."); }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem("arcwell-eligibility-v1", JSON.stringify(Object.fromEntries(items.filter(item => item.eligibility).map(item => [item.id, item])))); }
    catch { setToast("Browser storage unavailable. Eligibility changes will last for this session only."); }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem("arcwell-quality-v1", JSON.stringify(Object.fromEntries(items.filter(item => item.quality).map(item => [item.id, item])))); }
    catch { setToast("Browser storage unavailable. Quality changes will last for this session only."); }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem("arcwell-workflows-v1", JSON.stringify(Object.fromEntries(items.filter(item => item.workflow).map(item => [item.id, item])))); }
    catch { setToast("Browser storage unavailable. Workflow changes will last for this session only."); }
  }, [items]);
  useEffect(() => {
    try {
      localStorage.setItem("arcwell-escalations-v1", JSON.stringify(Object.fromEntries(items.filter(item => item.remediationPlan || item.delayReason || item.escalationAcknowledgedAt).map(item => [item.id, {
        owner: item.owner, due: item.due, execution: item.execution, next: item.next, remediationPlan: item.remediationPlan,
        delayReason: item.delayReason, proposedDue: item.proposedDue, previousDue: item.previousDue, escalationAcknowledgedAt: item.escalationAcknowledgedAt,
      }]))));
    } catch { setToast("Browser storage unavailable. Escalation changes will last for this session only."); }
  }, [items]);
  const [selected,setSelected] = useState(seed[1].id);
  const [filter,setFilter] = useState("Open");
  const [toast,setToast] = useState("");
  const [detailTab,setDetailTab] = useState("Overview");
  const [ack,setAck] = useState(false);
  const [remediation,setRemediation] = useState("");
  const [step,setStep] = useState(1);
  const [newTitle,setNewTitle] = useState("Monthly compliance oversight report");
  const [newOwner,setNewOwner] = useState("Alex Morgan");
  const [schedule,setSchedule] = useState<Schedule>(initialSchedule);
  const [newCategory,setNewCategory] = useState("Compliance");
  const [activated,setActivated] = useState(false);
  const flash=(m:string)=>{setToast(m);setTimeout(()=>setToast(""),2800)};
  const open=(id:string)=>{setSelected(id);setPage("detail");setDetailTab("Overview")};
  const update=(id:string, data:Partial<Item>, message:string)=>{setItems(x=>syncEligibilityDependency(x.map(i=>i.id===id?{...i,...data}:i)));flash(message)};

  const current=items.find(i=>i.id===selected)!;
  const pageTitle:Record<Page,string>={overview:"Compliance workflow",queue:"Obligations",detail:current?.title||"Occurrence detail",exceptions:"Exceptions & escalations",calendar:"Compliance calendar",editor:"Obligation definition editor",reports:"Compliance"};

  return <div className="app">
    <aside>
      <div className="brand"><div className="brandmark">OA</div><div><strong>Operational<br/>Assurance</strong><small>Redwood Valley IPA</small></div></div>
      <nav>{nav.map(([key,label,icon])=><button key={key} className={page===key?"active":""} onClick={()=>setPage(key as Page)}><Icon name={icon}/><span>{label}</span>{key==="exceptions"&&<b>3</b>}</button>)}</nav>
      <div className="sidebar-foot"><div className="mini-avatar">AM</div><div><strong>Alex Morgan</strong><small>Operations Manager</small></div><span>⌄</span></div>
    </aside>
    <main>
      <header><div className="header-actions"><span className="demo">DEMO ENVIRONMENT</span><button className="icon-btn" onClick={()=>flash("You have 3 unresolved escalations")}><Icon name="bell"/><i>3</i></button><button className="help" onClick={()=>flash("Assurance help center opened")}>?</button></div></header>
      <div className="content">
        <div className="crumbs"><span>{page === "reports" ? "Reports & Analytics" : "Operational Compliance"}</span><b>/</b><span>{pageTitle[page]}</span></div>
        {toast&&<div className="toast"><span>✓</span>{toast}</div>}
        <div className={page === "overview" ? undefined : "workflow-page obligation-portal"}>
        {page==="overview"&&<Overview items={items} go={(p,f)=>{setPage(p);setFilter(f||"Open")}}/>}
        {page==="queue"&&<WorkQueue items={items} scope={filter} setScope={setFilter} open={open}/>}
        {page==="detail"&&(current.category==="Credentialing" ? <CredentialingDetail key={current.id} item={current} update={update} back={()=>setPage("queue")}/> : current.category==="Eligibility" ? <EligibilityDetail key={current.id} item={current} update={update} back={()=>setPage("queue")}/> : isQuality(current) ? <QualityDetail key={current.id} item={current} update={update} back={()=>setPage("queue")}/> : workflowDefinitions[current.category] ? <WorkflowDetail key={current.id} item={current} update={update} back={()=>setPage("queue")}/> : <Detail item={current} tab={detailTab} setTab={setDetailTab} update={update} flash={flash}/>)}
        {page==="exceptions"&&<Exceptions items={items} ack={ack} setAck={setAck} remediation={remediation} setRemediation={setRemediation} update={update} open={open} flash={flash}/>}
        {page==="calendar"&&<Calendar items={items} activated={activated} open={open}/>}
        {page==="editor"&&<Editor category={newCategory} setCategory={setNewCategory} schedule={schedule} setSchedule={setSchedule} step={step} setStep={setStep} title={newTitle} setTitle={setNewTitle} owner={newOwner} setOwner={setNewOwner} activated={activated} activate={()=>{if(scheduleError(schedule))return;setActivated(true);const dates=occurrenceDates(schedule);setItems(x=>[...x,...dates.map((date,n)=>initializeEligibility({id:`${newCategory === "Eligibility" ? "ELG" : "CMP"}-NEW-${n+1}`,title:newTitle,category:newCategory,payer:"All plans",period:displayDate(date),due:`${displayDate(date)} ? ${schedule.cutoff} ${schedule.timezone}`,owner:newOwner,execution:"Not started",deadline:"Upcoming",verification:"Pending",risk:"Medium",next:"Prepare source report"}))]);flash(schedule.type==="Event-triggered"?"Definition activated. Occurrences will be due after the configured event; event ingestion is not connected in this demo.":`Definition activated and ${dates.length} future occurrences generated`)}}/>}
        {page==="reports"&&<Reports items={items}/>}
        </div>
      </div>
    </main>
  </div>
}

function PageHead({eyebrow,title,sub,action}:{eyebrow?:string,title:string,sub:string,action?:React.ReactNode}) {
  return <div className="page-head"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}

function ObligationGrids({items}:{items:Item[]}) {
  const values = (field: "category" | "owner") => [...new Set(items.map(item=>item[field]))].sort((a,b)=>a.localeCompare(b));
  const risks = ["Critical", "High", "Medium", "Low", ...new Set(items.map(item=>item.risk).filter(value=>!["Critical", "High", "Medium", "Low"].includes(value)))];
  const executions = ["Not started", "In progress", "Blocked", "Submitted / awaiting verification", "Completed", ...new Set(items.map(item=>item.execution).filter(value=>!["Not started", "In progress", "Blocked", "Submitted / awaiting verification", "Completed"].includes(value)))];
  const deadlines = ["Upcoming", "On track", "At risk", "Overdue", ...new Set(items.map(item=>item.deadline).filter(value=>!["Upcoming", "On track", "At risk", "Overdue"].includes(value)))];
  const summary = (title:string, field:"category" | "risk" | "owner", rows:string[]) => <Section title={title} sub={`${items.length} obligations total`}><div className="table-wrap"><table aria-label={title}><thead><tr><th scope="col">{field === "category" ? "Category" : field === "risk" ? "Risk" : "Owner"}</th><th scope="col">Obligations</th></tr></thead><tbody>{rows.map(value=><tr key={value}><th scope="row">{value}</th><td>{items.filter(item=>item[field]===value).length}</td></tr>)}</tbody><tfoot><tr><th scope="row">Total</th><td>{items.length}</td></tr></tfoot></table></div></Section>;
  const matrix = (title:string, field:"execution" | "deadline", columns:string[]) => <Section title={title} sub={field==="deadline" ? "Obligation counts by current deadline status" : "Obligation counts by current execution status"}><div className="table-wrap"><table aria-label={title}><thead><tr><th scope="col">Owner</th>{columns.map(value=><th scope="col" key={value}>{value}</th>)}<th scope="col">Total</th></tr></thead><tbody>{values("owner").map(owner=><tr key={owner}><th scope="row">{owner}</th>{columns.map(value=><td key={value}>{items.filter(item=>item.owner===owner && item[field]===value).length}</td>)}<td>{items.filter(item=>item.owner===owner).length}</td></tr>)}</tbody><tfoot><tr><th scope="row">Total</th>{columns.map(value=><td key={value}>{items.filter(item=>item[field]===value).length}</td>)}<td>{items.length}</td></tr></tfoot></table></div></Section>;
  return <div className="obligation-grids">
    {matrix("Obligations by Owner and execution status", "execution", executions)}
    {matrix("Obligations by Owner and timeliness", "deadline", deadlines)}
    <div className="obligation-summary-grids">{summary("Obligations by Category", "category", values("category"))}{summary("Obligations by Risk", "risk", risks)}{summary("Obligations by Owner", "owner", values("owner"))}</div>
  </div>;
}

function Overview({items,go}:{items:Item[],go:(p:Page,f?:string)=>void}) {
  return <div className="workflow-page"><PageHead eyebrow="Operational compliance" title="Compliance workflow" sub={`Counts across ${items.length} obligations.`} action={<Button onClick={()=>go("queue")}>Review obligations</Button>}/>
    <ObligationGrids items={items}/>
  </div>;
}

function WorkQueue({items,open,scope,setScope}:{items:Item[],open:(id:string)=>void,scope:string,setScope:(scope:string)=>void}) {
  const [category,setCategory] = useState("All");
  const [owner,setOwner] = useState("All");
  const [deadline,setDeadline] = useState("All");
  const [verification,setVerification] = useState("All");
  const [risk,setRisk] = useState("All");
  const priority = (item:Item) => (item.deadline==="Overdue"?100:0) + (item.verification==="Failed"?80:0) + (item.execution==="Blocked"?60:0) + (item.deadline==="At risk"?40:0) + ({Critical:30,High:20,Medium:10}[item.risk]||0);
  const scopes=["Open","All","Completed","Verified","Needs intervention","Awaiting verification","Unassigned","Overdue","At risk","Pending","Failed","Critical"];
  const queue=items.filter(item=> {
    const isOpen=item.execution!=="Completed"&&item.verification!=="Verified";
    const matches=scope==="All" || scope==="Open"&&isOpen || scope==="Completed"&&item.execution==="Completed" || scope==="Verified"&&item.verification==="Verified" || scope==="Needs intervention"&&isOpen&&(item.deadline==="Overdue"||item.deadline==="At risk"||item.execution==="Blocked"||item.verification==="Failed") || scope==="Awaiting verification"&&item.execution==="Submitted / awaiting verification" || scope==="Unassigned"&&item.owner==="Unassigned" || item.deadline===scope || item.verification===scope || item.risk===scope;
    return matches && (category==="All"||item.category===category) && (owner==="All"||item.owner===owner) && (deadline==="All"||item.deadline===deadline) && (verification==="All"||item.verification===verification) && (risk==="All"||item.risk===risk);
  }).sort((a,b)=>priority(b)-priority(a)||Date.parse(a.due.split(/[??]/)[0])-Date.parse(b.due.split(/[??]/)[0]));
  return <><PageHead title="Obligations" sub="Manage all obligations, review next actions, and filter by status, ownership, and risk"/>
    <div className="filterbar"><label>View<select value={scope} onChange={e=>setScope(e.target.value)}>{scopes.map(value=><option key={value}>{value}</option>)}</select></label>
      {[{label:"Category",value:category,set:setCategory,options:[...new Set(items.map(i=>i.category))]},{label:"Owner",value:owner,set:setOwner,options:[...new Set(items.map(i=>i.owner))]},{label:"Deadline",value:deadline,set:setDeadline,options:["Upcoming","On track","At risk","Overdue"]},{label:"Verification",value:verification,set:setVerification,options:["Pending","Failed","Verified","Not required"]},{label:"Risk",value:risk,set:setRisk,options:["Critical","High","Medium","Low"]}].map(field=><label key={field.label}>{field.label}<select value={field.value} onChange={e=>field.set(e.target.value)}><option>All</option>{field.options.map(value=><option key={value}>{value}</option>)}</select></label>)}
      <Button kind="secondary" onClick={()=>{setScope("All");setCategory("All");setOwner("All");setDeadline("All");setVerification("All");setRisk("All")}}>Clear filters</Button><span>{queue.length} obligations</span></div>
    <Section title="Obligations" sub="Prioritized by deadline, verification failures, blockers, and risk"><div className="table-wrap"><PaginatedTable><thead><tr><th>Obligation</th><th>Category / payer</th><th>Next required action</th><th>Owner</th><th>Due date</th><th>Execution</th><th>Deadline</th><th>Verification</th><th>Risk</th><th>Action</th></tr></thead><tbody>{queue.map(item=><tr key={item.id}><td><strong>{item.title}</strong><small>{item.id} ? {item.period}</small></td><td>{item.category}<small>{item.payer}</small></td><td>{item.next}{item.category==="Credentialing"&&<small>{item.credentialing?.stage || "Verification"}</small>}{item.eligibility&&<small>{item.eligibility.stage}</small>}{item.quality&&<small>{item.quality.stage}</small>}{workflowDefinitions[item.category]&&<small>{item.workflow?.stage || "Preparation"}</small>}</td><td>{item.owner}</td><td>{item.due}</td><td><Chip>{item.execution}</Chip></td><td><Chip>{item.deadline}</Chip></td><td><Chip>{item.verification}</Chip></td><td><span className={`risk ${item.risk.toLowerCase()}`}>{item.risk}</span></td><td><Button kind="secondary" onClick={()=>open(item.id)}>Review</Button></td></tr>)}</tbody></PaginatedTable>{!queue.length&&<div className="empty"><Icon name="search" size={32}/><h3>No obligations found</h3><p>Try clearing filters.</p></div>}</div></Section>
  </>;
}

function Detail({item,tab,setTab,update,flash}:{item:Item,tab:string,setTab:(x:string)=>void,update:(id:string,x:Partial<Item>,m:string)=>void,flash:(m:string)=>void}) {
  const tabs=["Overview","Completion checklist","Verification","Evidence","Dependencies & impact","Activity & audit"];
  const failed=item.verification==="Failed", verified=item.verification==="Verified";
  const simulate=()=>{
    flash("Simulated external check completed. No new status was returned.");
  };
  return <><button className="back" onClick={()=>history.back()}>← Back to obligations</button><PageHead eyebrow={`${item.id} · ${item.category.toUpperCase()}`} title={item.title} sub={`${item.payer} · Reporting period: ${item.period}`} action={<div className="head-actions"><Button kind="secondary" onClick={()=>flash("Owner notification sent")}>Send reminder</Button><Button onClick={simulate}>Simulate external response</Button></div>}/>
    <div className="status-strip"><div><small>EXECUTION</small><Chip>{item.execution}</Chip></div><div><small>DEADLINE</small><Chip>{item.deadline}</Chip></div><div><small>VERIFICATION</small><Chip>{item.verification}</Chip></div><div><small>RISK</small><span className={`risk ${item.risk.toLowerCase()}`}>{item.risk}</span></div></div>
    {failed&&<div className="alert-panel danger"><Icon name="alert"/><div><b>Verification failed — reconciliation mismatch</b><p>142 member records differ from the authoritative enrollment control total. Downstream provider roster processing is blocked.</p><Button kind="danger" onClick={()=>update(item.id,{execution:"In progress",verification:"Pending",next:"Correct file and resubmit"},"Remediation started. Occurrence returned to in progress.")}>Start remediation</Button></div></div>}
    {verified&&<div className="alert-panel success"><Icon name="check"/><div><b>Verified completion</b><p>Supported by validation report VAL-88214, reconciliation control totals, and payer acknowledgment ACK-994128.</p></div></div>}
    <div className="tabs">{tabs.map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {tab==="Overview"&&<div className="two-col wide-left"><Section title="Occurrence details"><div className="detail-grid"><Field a="Exact due date" b={item.due}/><Field a="Accountable owner" b={item.owner}/><Field a="Reporting period" b={item.period}/><Field a="Payer / scope" b={item.payer}/><Field a="Risk rationale" b={item.risk==="Critical"?"Contractual deadline and downstream financial impact":"Time-sensitive external dependency"}/><Field a="Source reference" b="Master agreement §4.2 / SOP-ELG-07"/></div></Section><Section title="Next required action"><div className="next-action"><Icon name="arrow"/><b>{item.next}</b><p>Completion is recorded only after every required verification criterion passes.</p></div></Section></div>}
    {tab==="Completion checklist"&&<Section title="Required completion criteria" sub="Checks must pass in order"><div className="checklist">{["Source file generated and encrypted","Schema and format validation passed","Control totals reconciled","Submission receipt recorded","Payer acknowledgment received"].map((x,n)=><div key={x}><span className={verified||n<2?"done":failed&&n===2?"fail":""}>{verified||n<2?"✓":failed&&n===2?"!":n+1}</span><div><b>{x}</b><small>{failed&&n===2?"Failed: expected 18,442 records; received 18,300":verified||n<2?"Passed · system recorded":"Required before verification"}</small></div></div>)}</div></Section>}
    {tab==="Verification"&&<div className="two-col"><Section title="Verification policy" sub="Integration + reconciliation policy v3"><div className="policy"><Field a="Authoritative source" b="Northstar payer gateway"/><Field a="Verification mode" b="Automated acknowledgment"/><Field a="Required result" b="Accepted with zero control-total variance"/><Field a="Verifier" b="Assurance Integration Service"/></div><Button onClick={simulate}>Simulate verification check</Button></Section><Section title="Latest result"><div className={`result ${failed?"bad":verified?"good":""}`}><Icon name={failed?"alert":"check"} size={28}/><b>{failed?"Failed — mismatch detected":verified?"All criteria passed":"Verification pending"}</b><p>{failed?"Correct the source file, regenerate control totals, and resubmit.":"Awaiting authoritative response from the configured source."}</p></div></Section></div>}
    {tab==="Evidence"&&<Section title="Evidence history" sub="Immutable references supporting this occurrence"><div className="evidence">{[["VAL-88214","File validation report","May 4, 10:22 AM","System generated"],["REC-11902","Reconciliation control totals","May 4, 10:24 AM",failed?"Variance: 142 records":"Passed"],["ACK-994128","Payer acknowledgment",verified?"May 4, 11:08 AM":"Pending",verified?"Accepted":"Not received"]].map(x=><div key={x[0]}><Icon name="check"/><div><b>{x[1]}</b><small>{x[0]} · {x[2]}</small></div><Chip>{x[3]}</Chip></div>)}</div></Section>}
    {tab==="Dependencies & impact"&&<Section title="Dependency relationship" sub="Failures propagate visible risk to downstream work"><div className="dependency"><div><small>UPSTREAM</small><b>{item.title}</b><Chip>{item.verification}</Chip></div><span>→<small>{failed?"BLOCKS":"ENABLES"}</small></span><div><small>DOWNSTREAM</small><b>{item.impact||"Provider roster reconciliation"}</b><Chip>{failed?"Blocked":"On track"}</Chip></div></div></Section>}
    {tab==="Activity & audit"&&<Section title="Activity & audit trail" sub="System and user actions are retained"><div className="audit">{[["10:24 AM","Assurance Integration Service","Reconciliation check completed",failed?"FAILED":"PASSED"],["10:22 AM","Maya Chen","Submission package transmitted","SUBMITTED"],["9:41 AM","System","Deadline risk recalculated","AT RISK"],["Apr 1","System","Occurrence generated from definition v3","CREATED"]].map(x=><div key={x[0]}><time>{x[0]}</time><i/><div><b>{x[2]}</b><small>{x[1]}</small></div><code>{x[3]}</code></div>)}</div></Section>}
  </>;
}
function Field({a,b}:{a:string,b:string}){return <div className="field"><small>{a}</small><b>{b}</b></div>}

function Exceptions({items,update,open,flash}:{items:Item[],ack:boolean,setAck:(x:boolean)=>void,remediation:string,setRemediation:(x:string)=>void,update:(id:string,x:Partial<Item>,m:string)=>void,open:(x:string)=>void,flash:(x:string)=>void}) {
  const [search,setSearch] = useState("");
  const [risk,setRisk] = useState("All");
  const [selected,setSelected] = useState<string|null>(null);
  const [drafts,setDrafts] = useState<Record<string,{owner:string,plan:string,reason:string,nextDue:string,ack:boolean}>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const exceptions=items.filter(i=>i.verification==="Failed"||i.deadline==="Overdue"||i.execution==="Blocked");
  const shown=exceptions.filter(i=>(risk==="All"||i.risk===risk)&&`${i.id} ${i.title} ${i.owner} ${i.payer}`.toLowerCase().includes(search.trim().toLowerCase()));
  const item=items.find(i=>i.id===selected);
  const draft=item ? drafts[item.id]||{owner:item.owner,plan:item.remediationPlan||"",reason:item.delayReason||"",nextDue:item.proposedDue||"",ack:false} : null;
  const change=(patch:Partial<{owner:string,plan:string,reason:string,nextDue:string,ack:boolean}>)=>{if(item&&draft)setDrafts(current=>({...current,[item.id]:{...draft,...patch}}))};
  useEffect(()=>{if(selected)dialog.current?.showModal();else dialog.current?.close()},[selected]);
  function save(acknowledge:boolean) {
    if(!item||!draft)return;
    if(!draft.plan.trim())return flash("Add a remediation plan before saving.");
    if(acknowledge&&(!draft.ack||!draft.reason.trim()||!draft.nextDue))return flash("Add the delay reason and next due date before acknowledging.");
    const response: Partial<Item> = { owner:draft.owner, remediationPlan:draft.plan.trim(), delayReason:draft.reason.trim(), proposedDue:draft.nextDue };
    if (acknowledge) {
      const time = item.due.includes(" · ") ? ` · ${item.due.split(" · ").slice(1).join(" · ")}` : "";
      const nextDate = new Date(`${draft.nextDue}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
      Object.assign(response,{execution:"In progress",next:draft.plan.trim(),previousDue:item.due,due:`${nextDate}${time}`,escalationAcknowledgedAt:new Date().toISOString()});
    }
    update(item.id,response,acknowledge?"Escalation acknowledged and linked obligation due date updated.":"Escalation response saved");
    setSelected(null);
  }
  return <div className="exceptions-page"><PageHead title="Exceptions & escalations" sub="Acknowledge, assign, remediate, and resolve verified operational exceptions"/>
    <div className="exceptions-toolbar">
      <label className="exception-control exception-search">Search escalations<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ID, obligation, owner, payer?"/></label>
      <label className="exception-control">Risk<select value={risk} onChange={e=>setRisk(e.target.value)}>{["All","Critical","High","Medium","Low"].map(x=><option key={x}>{x}</option>)}</select></label>
      <Button kind="text" onClick={()=>{setSearch("");setRisk("All")}}>Clear filters</Button><span className="exception-count" aria-live="polite">{shown.length} escalations</span>
    </div>
    <Section title="Open escalations" sub={`${exceptions.length} require action`}><div className="table-wrap"><PaginatedTable><thead><tr><th>Obligation</th><th>Risk</th><th>Owner</th><th>Deadline</th><th>Verification</th><th>Actions</th></tr></thead><tbody>{shown.map(i=><tr key={i.id}><td><button className="exception-link" onClick={()=>open(i.id)}><strong>{i.title}</strong><small>{i.id} ? {i.payer}</small></button></td><td><span className={`risk ${i.risk.toLowerCase()}`}>{i.risk}</span></td><td>{i.owner}</td><td><Chip>{i.deadline}</Chip></td><td><Chip>{i.verification}</Chip></td><td><Button kind="secondary" onClick={()=>setSelected(i.id)}>Respond</Button></td></tr>)}</tbody></PaginatedTable></div>{!shown.length&&<div className="empty"><h3>No escalations found</h3><p>Try clearing or changing your search filters.</p></div>}</Section>
    <dialog ref={dialog} className="exception-modal" aria-labelledby="exception-response-title" onCancel={()=>setSelected(null)} onClose={()=>setSelected(null)}>
      {item&&draft&&<><div className="exception-modal-head"><div><p>{item.id} ? {item.risk} risk</p><h2 id="exception-response-title">Escalation response</h2></div><button className="exception-close" aria-label="Close escalation response" onClick={()=>setSelected(null)}>?</button></div>
      <div className="exception-modal-body"><div className="alert-panel danger compact"><Icon name="alert"/><div><b>{item.title}</b><p>{item.next}</p></div></div>
      <label className="exception-control">Assigned owner<select value={draft.owner} onChange={e=>change({owner:e.target.value})}>{Array.from(new Set([item.owner,...items.map(i=>i.owner)])).map(owner=><option key={owner}>{owner}</option>)}</select></label>
      <label className="exception-control">Remediation plan<textarea value={draft.plan} onChange={e=>change({plan:e.target.value})} placeholder="Document corrective actions, accountable owner, and target time?"/></label>
      <label className="exception-control">Reason for delay<textarea required value={draft.reason} onChange={e=>change({reason:e.target.value})} placeholder="Explain what caused the delay or exception."/></label>
      <label className="exception-control">Next due date<input required type="date" value={draft.nextDue} onChange={e=>change({nextDue:e.target.value})}/><small>Current obligation due date: {item.due}</small></label>
      <label className="exception-check"><input type="checkbox" checked={draft.ack} onChange={e=>change({ack:e.target.checked})}/><span>I acknowledge this escalation and accept accountability for remediation.</span></label><p className="exception-guard">Resolution is unavailable until configured verification criteria pass.</p></div>
      <div className="exception-modal-actions"><Button kind="secondary" onClick={()=>setSelected(null)}>Cancel</Button><Button kind="secondary" disabled={!draft.plan.trim()} onClick={()=>save(false)}>Save response</Button><Button disabled={!draft.ack||!draft.plan.trim()||!draft.reason.trim()||!draft.nextDue} onClick={()=>save(true)}>Acknowledge escalation</Button></div></>}
    </dialog>
  </div>;
}

function Calendar({items,activated,open}:{items:Item[],activated:boolean,open:(x:string)=>void}) {
  const days=Array.from({length:35},(_,i)=>i-2);
  const byDay:Record<number,Item[]>= {3:[items[0]],5:[items[1]],7:[items[7]],8:[items[2]],12:[items[3]],15:[items[4]],20:[items[8]],22:[items[9]],28:[items[6]]};
  return <><PageHead title="Compliance calendar" sub="May 2026 · Deadline and verification commitments" action={<div className="month-nav"><Button kind="secondary">←</Button><b>May 2026</b><Button kind="secondary">→</Button></div>}/><div className="calendar-card"><div className="week">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(x=><b key={x}>{x}</b>)}</div><div className="month">{days.map((d,i)=><div className={d<1||d>31?"muted":""} key={i}><span>{d<1?30+d:d>31?d-31:d}</span>{byDay[d]?.map(x=><button key={x.id} className={x.deadline==="Overdue"||x.verification==="Failed"?"event red":x.deadline==="At risk"?"event amber":"event blue"} onClick={()=>open(x.id)}>{x.title}</button>)}</div>)}</div></div><div className="calendar-key"><Chip tone="blue">Scheduled</Chip><Chip tone="amber">At risk</Chip><Chip tone="red">Overdue / failed</Chip><Chip tone="green">Newly activated</Chip></div></>;
}

function Editor({category,setCategory,schedule,setSchedule,step,setStep,title,setTitle,owner,setOwner,activated,activate}:{category:string,setCategory:(x:string)=>void,schedule:Schedule,setSchedule:(x:Schedule)=>void,step:number,setStep:(x:number)=>void,title:string,setTitle:(x:string)=>void,owner:string,setOwner:(x:string)=>void,activated:boolean,activate:()=>void}) {
  const changeSchedule = (patch: Partial<Schedule>) => setSchedule({...schedule,...patch});
  const error = scheduleError(schedule);
  const dates = occurrenceDates(schedule);
  const labels=["Basics","Applicability","Schedule","Ownership","Verification","Escalations","Effective date"];
  return <><PageHead title="Create obligation definition" sub="Configure a controlled, repeatable assurance obligation" action={<Chip tone={activated?"green":"slate"}>{activated?"Active":"Draft"}</Chip>}/><div className="editor"><div className="steps">{labels.map((x,n)=><button className={step===n+1?"active":step>n+1?"done":""} onClick={()=>setStep(n+1)} key={x}><span>{step>n+1?"✓":n+1}</span><b>{x}</b></button>)}</div><div className="form-card"><div className="form-head"><small>STEP {step} OF {labels.length}</small><h2>{labels[step-1]}</h2><p>{step===1?"Define the obligation and its operational purpose.":step===3?"Choose the recurrence and deadline calculation.":step===5?"Specify the evidence required for verified completion.":"Configure accountable controls for this definition."}</p></div>
    {step===1&&<div className="form-grid"><label className="span2">Obligation name<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);if(e.target.value==="Eligibility")setTitle("Recurring eligibility file receipt");}}><option>Compliance</option><option>Eligibility</option><option>Credentialing</option><option>Claims</option><option>Provider Network</option><option>Quality Management</option><option>Utilization Management</option><option>Finance</option><option>Member Services</option><option>Data Reporting</option></select></label><label>Risk classification<select><option>Medium</option><option>High</option><option>Critical</option></select></label><label className="span2">Description<textarea key={category} defaultValue={category==="Eligibility"?"Receive eligibility files from the payer at regular intervals, reconcile control totals, and verify successful processing for each scheduled period.":"Prepare, review, and submit the monthly oversight report with supporting evidence."}/></label></div>}
    {step===2&&<div className="form-grid"><label>Payer scope<select><option>All contracted payers</option><option>Northstar Health</option><option>Summit Health Plan</option><option>Horizon Care</option><option>Evergreen Health</option><option>Pacific Health Partners</option></select></label><label>Line of business<select><option>All lines of business</option><option>Medicare Advantage</option><option>Medicaid</option><option>Commercial</option></select></label><label className="span2">Applicability rule<input defaultValue="Generate when contract is active on the first calendar day"/></label></div>}
    {step===3&&<><div className="choice-grid">{scheduleTypes.map(x=><button type="button" className={schedule.type===x?"active":""} aria-pressed={schedule.type===x} onClick={()=>changeSchedule({type:x})} key={x}><Icon name="calendar"/><b>{x}</b><small>{x==="Business day"?"Nth weekday each month":x==="Interval-based"?"Every N months":x==="Event-triggered"?"Deadline after an event":"Recurring schedule"}</small></button>)}</div><div className="form-grid">
      {["Monthly","Quarterly","Annual"].includes(schedule.type)&&<label>{category==="Eligibility"?"Expected receipt day of month":"Due day of month"}<select value={schedule.day} onChange={e=>changeSchedule({day:Number(e.target.value)})}>{Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>}
      {schedule.type==="Quarterly"&&<label>Due month within each calendar quarter<select value={schedule.quarterMonth} onChange={e=>changeSchedule({quarterMonth:Number(e.target.value)})}><option value={1}>First month (Jan, Apr, Jul, Oct)</option><option value={2}>Second month (Feb, May, Aug, Nov)</option><option value={3}>Third month (Mar, Jun, Sep, Dec)</option></select></label>}
      {schedule.type==="Annual"&&<label>Due month<select value={schedule.month} onChange={e=>changeSchedule({month:Number(e.target.value)})}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2026,i,1).toLocaleString("en-US",{month:"long"})}</option>)}</select></label>}
      {schedule.type==="Business day"&&<label>Business day of each month<input type="number" min={1} max={23} value={schedule.businessDay} onChange={e=>changeSchedule({businessDay:Number(e.target.value)})}/></label>}
      {schedule.type==="Interval-based"&&<><label>Repeat every (months)<input type="number" min={1} max={120} value={schedule.interval} onChange={e=>changeSchedule({interval:Number(e.target.value)})}/></label><label>First due date<input type="date" value={schedule.anchor} onChange={e=>changeSchedule({anchor:e.target.value})}/></label></>}
      {schedule.type==="Event-triggered"&&<><label>Trigger event<input value={schedule.event} placeholder="e.g. Contract signed or payer notice received" onChange={e=>changeSchedule({event:e.target.value})}/></label><label>Due after event (calendar days)<input type="number" min={0} max={365} value={schedule.offset} onChange={e=>changeSchedule({offset:Number(e.target.value)})}/></label></>}
      <label>Cutoff time<input type="time" value={schedule.cutoff} onChange={e=>changeSchedule({cutoff:e.target.value})}/></label><label>Time zone<select value={schedule.timezone} onChange={e=>changeSchedule({timezone:e.target.value})}>{["America/New_York","America/Chicago","America/Denver","America/Los_Angeles"].map(zone=><option key={zone}>{zone}</option>)}</select></label>
      </div><p>{schedule.type==="Business day"?"Business days are Monday?Friday; holidays are not excluded. Months without the selected business day are skipped.":schedule.type==="Event-triggered"?"Each event on or after the effective date creates a deadline at the cutoff time, the selected number of calendar days later. Event ingestion is not connected in this demo.":"If the due day does not exist in a month, use the last calendar day. Dates before the effective date are excluded."}</p></>}

    {step===4&&<div className="form-grid"><label>Primary owner<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Alex Morgan</option><option>Maya Chen</option><option>Priya Shah</option></select></label><label>Responsible team<select><option>Compliance Operations</option><option>Eligibility Operations</option><option>Claims Operations</option><option>Provider Network Operations</option><option>Quality Management</option><option>Utilization Management</option><option>Finance Operations</option><option>Member Services</option><option>Data Reporting</option></select></label><label>Backup owner<select><option>Sam Lee</option><option>Dana Wright</option></select></label></div>}
    {step===5&&<div className="verification-builder"><div className="info"><Icon name="check"/><p>Verification prevents an occurrence from becoming complete until each required criterion passes.</p></div>{(category==="Eligibility"?["Eligibility file received for the scheduled period","Received control totals match payer source","Internal processing completed and verified"]:["Report file attached","Control totals match source system","Authorized reviewer approval recorded"]).map((x,n)=><label className="criterion" key={x}><input type="checkbox" defaultChecked/><span><b>{x}</b><small>{n===2?"Evidence review · Compliance Manager":"System or evidence check · Required"}</small></span><select><option>Required</option><option>Optional</option></select></label>)}</div>}
    {step===6&&<div className="form-grid"><label>First reminder<select><option>5 days before due</option></select></label><label>Escalate at<select><option>1 day before due</option></select></label><label>Critical escalation recipient<select><option>COO + Compliance Officer</option><option>Claims Director</option><option>Provider Network Director</option><option>Quality Director</option><option>Medical Director</option><option>Chief Financial Officer</option><option>Member Services Director</option><option>Data Reporting Director</option></select></label></div>}
    {step===7&&<><div className="form-grid"><label>Effective date<input type="date" value={schedule.effective} onChange={e=>changeSchedule({effective:e.target.value})}/></label><label>Configuration version<input value="1.0" readOnly/></label></div><Section title="Future occurrence preview" sub={`${schedule.type} ? ${schedule.cutoff} ${schedule.timezone}`}><div className="preview">{schedule.type==="Event-triggered"?<p>{schedule.event||"Configured event"}: due {schedule.offset} calendar days after each event. Dates are determined when an event occurs; no occurrences are generated in advance.</p>:dates.map((date,n)=><div key={date}><span>{n+1}</span><b>{title}</b><small>{displayDate(date)} ? {owner} ? Verification required</small></div>)}</div></Section></>}
    {error&&(error==="Describe the event that creates an obligation."?step===1:step===3||step===7)&&<p role="alert">{error}</p>}

    <div className="form-actions"><Button kind="secondary" disabled={step===1} onClick={()=>setStep(Math.max(1,step-1))}>Back</Button>{step<labels.length?<Button disabled={step===3&&!!error} onClick={()=>setStep(step+1)}>Continue <Icon name="arrow"/></Button>:<Button disabled={activated||!!error} onClick={activate}>{activated?"Definition activated":"Activate definition"}</Button>}</div></div></div></>;
}

function Reports({items}:{items:Item[]}) {
  return <><PageHead title="Compliance" sub="Operational reliability, exception rates, and verified completion" action={<Button>Export report</Button>}/><div className="report-filters"><select><option>Last 6 months</option><option>Last 12 months</option></select><select><option>All categories</option><option>Eligibility</option></select><select><option>All payers</option><option>Northstar Health</option></select></div><div className="report-kpis"><div><span>Verified on time</span><b>94.2%</b><small className="positive">↑ 2.8 points</small></div><div><span>Median verification time</span><b>3.4h</b><small className="positive">↓ 0.6 hours</small></div><div><span>Exception rate</span><b>4.8%</b><small>12 of 251 occurrences</small></div><div><span>Open critical</span><b>2</b><small className="negative">1 overdue</small></div></div><div className="two-col"><Section title="Verified completion trend" sub="Percentage completed on time with evidence"><div className="chart-area"><div className="line one"/><div className="line two"/>{[82,86,84,90,91,94].map((x,n)=><i key={n} style={{left:`${8+n*17}%`,bottom:`${x-68}%`}}><span>{x}%</span></i>)}<div className="xlabels">{["Dec","Jan","Feb","Mar","Apr","May"].map(x=><span key={x}>{x}</span>)}</div></div></Section><Section title="Assurance by category"><div className="category-bars">{["Eligibility","Credentialing","Quality","Compliance","Contracts"].map((x,n)=><div key={x}><span>{x}</span><i><b style={{width:`${[92,88,96,94,81][n]}%`}}/></i><strong>{[92,88,96,94,81][n]}%</strong></div>)}</div></Section></div><div className="two-col">
      <Section title="Verified on-time completion" sub="Trailing 6 months"><div className="trend-top"><b>94.2%</b><span>↑ 2.8% vs prior period</span></div><div className="bars">{[82,88,86,91,89,94].map((x,n)=><i key={n} style={{height:`${x/1.4}%`}}><em>{["Dec","Jan","Feb","Mar","Apr","May"][n]}</em></i>)}</div></Section>
      <Section title="Obligations by category"><div className="donut-row"><div className="donut"><b>42</b><span>active</span></div><div className="legend">{[["Eligibility","12"],["Credentialing","10"],["Compliance","8"],["Quality","7"],["Contracts","5"]].map(x=><div key={x[0]}><i/><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></div></Section>
    </div><Section title="Recurring failure themes" sub="Root causes across the selected period"><div className="table-wrap"><PaginatedTable><thead><tr><th>Theme</th><th>Occurrences</th><th>Primary category</th><th>Trend</th><th>Control recommendation</th></tr></thead><tbody><tr><td><strong>External acknowledgment delay</strong></td><td>7</td><td>Quality</td><td><Chip tone="amber">Stable</Chip></td><td>Automate payer status polling</td></tr><tr><td><strong>Control-total mismatch</strong></td><td>4</td><td>Eligibility</td><td><Chip tone="red">Increasing</Chip></td><td>Reconcile received files against source totals</td></tr><tr><td><strong>Approval bottleneck</strong></td><td>3</td><td>Credentialing</td><td><Chip tone="green">Improving</Chip></td><td>Backup committee approver</td></tr></tbody></PaginatedTable></div></Section></>;
}
