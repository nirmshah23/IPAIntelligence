import { useMemo, useState } from "react";

type Page = "overview" | "queue" | "register" | "detail" | "exceptions" | "calendar" | "editor" | "reports";
type Item = {
  id: string; title: string; category: string; payer: string; period: string; due: string; owner: string;
  execution: string; deadline: string; verification: string; risk: string; next: string; impact?: string;
};

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
];

const nav = [
  ["overview","Assurance workflow","grid"], ["queue","My work queue","check"], ["register","All obligations","list"],
  ["exceptions","Exceptions & escalations","alert"], ["calendar","Compliance calendar","calendar"],
  ["editor","Definition editor","settings"], ["reports","Reports & trends","chart"],
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

export default function App() {
  const [page,setPage] = useState<Page>("overview");
  const [items,setItems] = useState(seed);
  const [selected,setSelected] = useState(seed[1].id);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("All");
  const [toast,setToast] = useState("");
  const [detailTab,setDetailTab] = useState("Overview");
  const [ack,setAck] = useState(false);
  const [remediation,setRemediation] = useState("");
  const [step,setStep] = useState(1);
  const [newTitle,setNewTitle] = useState("Monthly compliance oversight report");
  const [newOwner,setNewOwner] = useState("Alex Morgan");
  const [activated,setActivated] = useState(false);
  const flash=(m:string)=>{setToast(m);setTimeout(()=>setToast(""),2800)};
  const open=(id:string)=>{setSelected(id);setPage("detail");setDetailTab("Overview")};
  const update=(id:string, data:Partial<Item>, message:string)=>{setItems(x=>x.map(i=>i.id===id?{...i,...data}:i));flash(message)};
  const visible=items.filter(i=>(filter==="All"||i.category===filter||i.deadline===filter||i.verification===filter) && (i.title+i.id+i.owner+i.payer).toLowerCase().includes(search.toLowerCase()));
  const current=items.find(i=>i.id===selected)!;
  const pageTitle:Record<Page,string>={overview:"Assurance workflow",queue:"My work queue",register:"All obligations",detail:current?.title||"Occurrence detail",exceptions:"Exceptions & escalations",calendar:"Compliance calendar",editor:"Obligation definition editor",reports:"Reports & trends"};

  return <div className="app">
    <aside>
      <div className="brand"><div className="brandmark">OA</div><div><strong>Operational<br/>Assurance</strong><small>Redwood Valley IPA</small></div></div>
      <nav>{nav.map(([key,label,icon])=><button key={key} className={page===key?"active":""} onClick={()=>setPage(key as Page)}><Icon name={icon}/><span>{label}</span>{key==="exceptions"&&<b>3</b>}</button>)}</nav>
      <div className="sidebar-foot"><div className="mini-avatar">AM</div><div><strong>Alex Morgan</strong><small>Operations Manager</small></div><span>⌄</span></div>
    </aside>
    <main>
      <header><div className="search"><Icon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search obligations, payers, owners…"/></div><div className="header-actions"><span className="demo">DEMO ENVIRONMENT</span><button className="icon-btn" onClick={()=>flash("You have 3 unresolved escalations")}><Icon name="bell"/><i>3</i></button><button className="help" onClick={()=>flash("Assurance help center opened")}>?</button></div></header>
      <div className="content">
        <div className="crumbs"><span>Operational Compliance</span><b>/</b><span>{pageTitle[page]}</span></div>
        {toast&&<div className="toast"><span>✓</span>{toast}</div>}
        {page==="overview"&&<Overview items={items} open={open} go={(p,f)=>{setPage(p);setFilter(f||"All")}}/>}
        {(page==="queue"||page==="register")&&<Register title={page==="queue"?"My work queue":"All obligations"} items={visible} filter={filter} setFilter={setFilter} open={open}/>}
        {page==="detail"&&<Detail item={current} tab={detailTab} setTab={setDetailTab} update={update} flash={flash}/>}
        {page==="exceptions"&&<Exceptions items={items} ack={ack} setAck={setAck} remediation={remediation} setRemediation={setRemediation} update={update} open={open} flash={flash}/>}
        {page==="calendar"&&<Calendar items={items} activated={activated} open={open}/>}
        {page==="editor"&&<Editor step={step} setStep={setStep} title={newTitle} setTitle={setNewTitle} owner={newOwner} setOwner={setNewOwner} activated={activated} activate={()=>{setActivated(true);setItems(x=>x.some(i=>i.id==="CMP-NEW-01")?x:[...x,{id:"CMP-NEW-01",title:newTitle,category:"Compliance",payer:"All plans",period:"June 2026",due:"Jun 5, 2026 · 5:00 PM ET",owner:newOwner,execution:"Not started",deadline:"Upcoming",verification:"Pending",risk:"Medium",next:"Prepare source report"}]);flash("Definition activated and 3 future occurrences generated")}}/>}
        {page==="reports"&&<Reports items={items}/>}
      </div>
    </main>
  </div>
}

function PageHead({eyebrow,title,sub,action}:{eyebrow?:string,title:string,sub:string,action?:React.ReactNode}) {
  return <div className="page-head"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}

function Overview({items,open,go}:{items:Item[],open:(x:string)=>void,go:(p:Page,f?:string)=>void}) {
  const kpis=[["Overdue","1","Needs immediate action","red","Overdue"],["Critical due soon","2","Within next 7 days","orange","Critical"],["Awaiting verification","3","Submitted, not yet proven","blue","Pending"],["Failed / rejected","1","Requires remediation","red","Failed"],["At risk","3","May miss commitment","amber","At risk"],["Unassigned","1","No accountable owner","slate","All"]];
  const attention=items.filter(i=>["Critical","High"].includes(i.risk)&&i.verification!=="Verified").slice(0,5);
  return <><PageHead eyebrow="MONDAY, MAY 4, 2026" title="Assurance workflow" sub="Operational reliability across Redwood Valley IPA" action={<div className="fresh"><span/>Data refreshed 2 min ago</div>}/>
    <div className="kpi-grid">{kpis.map(([a,b,c,t,f])=><button className={`kpi ${t}`} key={a} onClick={()=>go("register",f)}><div><span>{a}</span><b>{b}</b><small>{c}</small></div><Icon name={a.includes("verification")?"check":"alert"}/></button>)}</div>
    <div className="two-col wide-left">
      <Section title="Needs attention" sub="Prioritized by deadline, risk, and downstream impact" action={<Button kind="text" onClick={()=>go("queue")}>View work queue <Icon name="arrow"/></Button>}>
        <div className="table-wrap"><table><thead><tr><th>Obligation</th><th>Due</th><th>Owner</th><th>Deadline</th><th>Verification</th></tr></thead><tbody>{attention.map(i=><tr key={i.id} onClick={()=>open(i.id)}><td><strong>{i.title}</strong><small>{i.id} · {i.payer}</small></td><td>{i.due.split(" ·")[0]}</td><td>{i.owner}</td><td><Chip>{i.deadline}</Chip></td><td><Chip>{i.verification}</Chip></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Upcoming deadlines" sub="Next 14 days"><div className="timeline">{items.slice(2,7).map((i,n)=><button key={i.id} onClick={()=>open(i.id)}><span className={n<2?"urgent":""}>{i.due.split(",")[0]}<b>{i.due.match(/\d+/)?.[0]}</b></span><div><strong>{i.title}</strong><small>{i.owner} · {i.category}</small></div></button>)}</div></Section>
    </div>
    <div className="three-col">
      <Section title="Verified on-time completion" sub="Trailing 6 months"><div className="trend-top"><b>94.2%</b><span>↑ 2.8% vs prior period</span></div><div className="bars">{[82,88,86,91,89,94].map((x,n)=><i key={n} style={{height:`${x/1.4}%`}}><em>{["Dec","Jan","Feb","Mar","Apr","May"][n]}</em></i>)}</div></Section>
      <Section title="Obligations by category"><div className="donut-row"><div className="donut"><b>42</b><span>active</span></div><div className="legend">{[["Eligibility","12"],["Credentialing","10"],["Compliance","8"],["Quality","7"],["Contracts","5"]].map(x=><div key={x[0]}><i/><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></div></Section>
      <Section title="Downstream impact" sub="Active dependencies at risk"><div className="impact"><div className="impact-icon"><Icon name="alert"/></div><div><b>2 dependent activities affected</b><p>April eligibility mismatch blocks provider roster reconciliation.</p><Button kind="secondary" onClick={()=>open("ELG-2026-04")}>Review dependency</Button></div></div></Section>
    </div>
  </>;
}

function Register({title,items,filter,setFilter,open}:{title:string,items:Item[],filter:string,setFilter:(x:string)=>void,open:(x:string)=>void}) {
  return <><PageHead title={title} sub={title.startsWith("My")?"Prioritized obligations assigned to you and your team":"Authoritative register of generated obligation occurrences"} action={<Button onClick={()=>setFilter("All")}>Export register</Button>}/>
    <div className="filterbar"><div className="seg">{["All","At risk","Overdue","Pending","Failed"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><select onChange={e=>setFilter(e.target.value)}><option>All categories</option><option>Eligibility</option><option>Credentialing</option><option>Quality</option><option>Compliance</option></select><span>{items.length} occurrences</span></div>
    <Section title="Occurrence register" sub="Execution, deadline, and verification are tracked independently"><div className="table-wrap"><table className="register"><thead><tr><th>Obligation</th><th>Category / payer</th><th>Due date</th><th>Owner</th><th>Execution</th><th>Deadline</th><th>Verification</th><th>Risk</th></tr></thead><tbody>{items.map(i=><tr key={i.id} onClick={()=>open(i.id)}><td><strong>{i.title}</strong><small>{i.id} · {i.period}</small></td><td>{i.category}<small>{i.payer}</small></td><td>{i.due}</td><td>{i.owner}</td><td><Chip>{i.execution}</Chip></td><td><Chip>{i.deadline}</Chip></td><td><Chip>{i.verification}</Chip></td><td><span className={`risk ${i.risk.toLowerCase()}`}>{i.risk}</span></td></tr>)}</tbody></table>{!items.length&&<div className="empty"><Icon name="search" size={32}/><h3>No obligations found</h3><p>Try clearing filters or searching another term.</p></div>}</div></Section>
  </>;
}

function Detail({item,tab,setTab,update,flash}:{item:Item,tab:string,setTab:(x:string)=>void,update:(id:string,x:Partial<Item>,m:string)=>void,flash:(m:string)=>void}) {
  const tabs=["Overview","Completion checklist","Verification","Evidence","Dependencies & impact","Activity & audit"];
  const failed=item.verification==="Failed", verified=item.verification==="Verified";
  const simulate=()=>{
    if(item.id==="ELG-2026-04") update(item.id,{execution:"Completed",deadline:"On track",verification:"Verified",next:"No action",impact:undefined},"Payer acceptance received. All verification criteria passed.");
    else if(item.id==="QLT-2026-Q1") update(item.id,{execution:"Completed",verification:"Verified",next:"No action"},"Simulated payer acknowledgment received. Occurrence verified.");
    else if(item.id==="CRD-8842") update(item.id,{execution:"Completed",deadline:"On track",verification:"Verified",next:"No action"},"Committee approval recorded. Recredentialing verified.");
    else flash("Simulated external check completed. No new status was returned.");
  };
  return <><button className="back" onClick={()=>history.back()}>← Back to register</button><PageHead eyebrow={`${item.id} · ${item.category.toUpperCase()}`} title={item.title} sub={`${item.payer} · Reporting period: ${item.period}`} action={<div className="head-actions"><Button kind="secondary" onClick={()=>flash("Owner notification sent")}>Send reminder</Button><Button onClick={simulate}>Simulate external response</Button></div>}/>
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

function Exceptions({items,ack,setAck,remediation,setRemediation,update,open,flash}:{items:Item[],ack:boolean,setAck:(x:boolean)=>void,remediation:string,setRemediation:(x:string)=>void,update:(id:string,x:Partial<Item>,m:string)=>void,open:(x:string)=>void,flash:(x:string)=>void}) {
  const exceptions=items.filter(i=>i.verification==="Failed"||i.deadline==="Overdue"||i.execution==="Blocked");
  return <><PageHead title="Exceptions & escalations" sub="Acknowledge, assign, remediate, and resolve verified operational exceptions"/><div className="exception-layout"><Section title="Open escalations" sub={`${exceptions.length} require action`}><div className="exception-list">{exceptions.map((i,n)=><button className={n===0?"active":""} key={i.id} onClick={()=>open(i.id)}><span className={`risk ${i.risk.toLowerCase()}`}>{i.risk}</span><strong>{i.title}</strong><small>{i.id} · {i.owner}</small><Chip>{i.verification==="Failed"?"Verification failed":i.deadline}</Chip></button>)}</div></Section><Section title="Escalation response" sub="ELG-2026-04 · Created today at 10:25 AM"><div className="alert-panel danger compact"><Icon name="alert"/><div><b>Critical reconciliation failure</b><p>Resolution requires a passing reconciliation and accepted payer acknowledgment.</p></div></div><label>Assigned owner<select><option>Maya Chen — Eligibility Ops</option><option>Dana Wright — Provider Data</option><option>Alex Morgan — Operations</option></select></label><label>Remediation plan<textarea value={remediation} onChange={e=>setRemediation(e.target.value)} placeholder="Document corrective actions, accountable owner, and target time…"/></label><label className="checkrow"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/><span>I acknowledge this escalation and accept accountability for remediation.</span></label><div className="button-row"><Button kind="secondary" onClick={()=>{if(!remediation)return flash("Add a remediation plan before saving.");flash("Remediation plan saved")}}>Save plan</Button><Button disabled={!ack||!remediation} onClick={()=>update("ELG-2026-04",{execution:"In progress",verification:"Pending",next:"Correct file and resubmit"},"Escalation acknowledged. Verification criteria must still pass before resolution.")}>Acknowledge escalation</Button></div><p className="guard">Resolution is unavailable until configured verification criteria pass.</p></Section></div></>;
}

function Calendar({items,activated,open}:{items:Item[],activated:boolean,open:(x:string)=>void}) {
  const days=Array.from({length:35},(_,i)=>i-2);
  const byDay:Record<number,Item[]>= {3:[items[0]],5:[items[1]],7:[items[7]],8:[items[2]],12:[items[3]],15:[items[4]],20:[items[8]],22:[items[9]],28:[items[6]]};
  return <><PageHead title="Compliance calendar" sub="May 2026 · Deadline and verification commitments" action={<div className="month-nav"><Button kind="secondary">←</Button><b>May 2026</b><Button kind="secondary">→</Button></div>}/><div className="calendar-card"><div className="week">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(x=><b key={x}>{x}</b>)}</div><div className="month">{days.map((d,i)=><div className={d<1||d>31?"muted":""} key={i}><span>{d<1?30+d:d>31?d-31:d}</span>{byDay[d]?.map(x=><button key={x.id} className={x.deadline==="Overdue"||x.verification==="Failed"?"event red":x.deadline==="At risk"?"event amber":"event blue"} onClick={()=>open(x.id)}>{x.title}</button>)}{activated&&d===5&&<button className="event green">Monthly compliance oversight</button>}</div>)}</div></div><div className="calendar-key"><Chip tone="blue">Scheduled</Chip><Chip tone="amber">At risk</Chip><Chip tone="red">Overdue / failed</Chip><Chip tone="green">Newly activated</Chip></div></>;
}

function Editor({step,setStep,title,setTitle,owner,setOwner,activated,activate}:{step:number,setStep:(x:number)=>void,title:string,setTitle:(x:string)=>void,owner:string,setOwner:(x:string)=>void,activated:boolean,activate:()=>void}) {
  const labels=["Basics","Applicability","Schedule","Ownership","Dependencies","Verification","Escalations","Effective date"];
  return <><PageHead title="Create obligation definition" sub="Configure a controlled, repeatable assurance obligation" action={<Chip tone={activated?"green":"slate"}>{activated?"Active":"Draft"}</Chip>}/><div className="editor"><div className="steps">{labels.map((x,n)=><button className={step===n+1?"active":step>n+1?"done":""} onClick={()=>setStep(n+1)} key={x}><span>{step>n+1?"✓":n+1}</span><b>{x}</b></button>)}</div><div className="form-card"><div className="form-head"><small>STEP {step} OF 8</small><h2>{labels[step-1]}</h2><p>{step===1?"Define the obligation and its operational purpose.":step===3?"Choose the recurrence and deadline calculation.":step===6?"Specify the evidence required for verified completion.":"Configure accountable controls for this definition."}</p></div>
    {step===1&&<div className="form-grid"><label className="span2">Obligation name<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Category<select><option>Compliance</option><option>Eligibility</option><option>Credentialing</option></select></label><label>Risk classification<select><option>Medium</option><option>High</option><option>Critical</option></select></label><label className="span2">Description<textarea defaultValue="Prepare, review, and submit the monthly oversight report with supporting evidence."/></label></div>}
    {step===2&&<div className="form-grid"><label>Payer scope<select><option>All contracted payers</option><option>Northstar Health</option></select></label><label>Line of business<select><option>All lines of business</option><option>Medicare Advantage</option></select></label><label className="span2">Applicability rule<input defaultValue="Generate when contract is active on the first calendar day"/></label></div>}
    {step===3&&<><div className="choice-grid">{["Monthly","Quarterly","Annual","Business day","Interval-based","Event-triggered"].map((x,n)=><button className={n===0?"active":""} key={x}><Icon name="calendar"/><b>{x}</b><small>{n===3?"Nth business day":n===4?"Every N months":"Recurring schedule"}</small></button>)}</div><div className="form-grid"><label>Due day<select><option>5th calendar day</option><option>3rd business day</option></select></label><label>Cutoff time<input defaultValue="5:00 PM ET"/></label></div></>}
    {step===4&&<div className="form-grid"><label>Primary owner<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Alex Morgan</option><option>Maya Chen</option><option>Priya Shah</option></select></label><label>Responsible team<select><option>Compliance Operations</option><option>Eligibility Operations</option></select></label><label>Backup owner<select><option>Sam Lee</option><option>Dana Wright</option></select></label></div>}
    {step===5&&<div className="dependency-builder"><div><b>Source report finalized</b><small>Required milestone</small></div><span>→</span><div><b>Compliance report submission</b><small>This obligation</small></div><span>→</span><div><b>Leadership certification</b><small>Downstream dependency</small></div></div>}
    {step===6&&<div className="verification-builder"><div className="info"><Icon name="check"/><p>Verification prevents an occurrence from becoming complete until each required criterion passes.</p></div>{["Report file attached","Control totals match source system","Authorized reviewer approval recorded"].map((x,n)=><label className="criterion" key={x}><input type="checkbox" defaultChecked/><span><b>{x}</b><small>{n===2?"Evidence review · Compliance Manager":"System or evidence check · Required"}</small></span><select><option>Required</option><option>Optional</option></select></label>)}</div>}
    {step===7&&<div className="form-grid"><label>First reminder<select><option>5 days before due</option></select></label><label>Escalate at<select><option>1 day before due</option></select></label><label>Critical escalation recipient<select><option>COO + Compliance Officer</option></select></label></div>}
    {step===8&&<><div className="form-grid"><label>Effective date<input type="date" defaultValue="2026-06-01"/></label><label>Configuration version<input defaultValue="1.0" readOnly/></label></div><Section title="Future occurrence preview" sub="Review dates before activation"><div className="preview">{["Jun 5, 2026","Jul 5, 2026","Aug 5, 2026"].map((x,n)=><div key={x}><span>{n+1}</span><b>{title}</b><small>{x} · {owner} · Verification required</small></div>)}</div></Section></>}
    <div className="form-actions"><Button kind="secondary" disabled={step===1} onClick={()=>setStep(Math.max(1,step-1))}>Back</Button>{step<8?<Button onClick={()=>setStep(step+1)}>Continue <Icon name="arrow"/></Button>:<Button disabled={activated} onClick={activate}>{activated?"Definition activated":"Activate definition"}</Button>}</div></div></div></>;
}

function Reports({items}:{items:Item[]}) {
  return <><PageHead title="Reports & trends" sub="Operational reliability, exception rates, and verified completion" action={<Button>Export report</Button>}/><div className="report-filters"><select><option>Last 6 months</option><option>Last 12 months</option></select><select><option>All categories</option><option>Eligibility</option></select><select><option>All payers</option><option>Northstar Health</option></select></div><div className="report-kpis"><div><span>Verified on time</span><b>94.2%</b><small className="positive">↑ 2.8 points</small></div><div><span>Median verification time</span><b>3.4h</b><small className="positive">↓ 0.6 hours</small></div><div><span>Exception rate</span><b>4.8%</b><small>12 of 251 occurrences</small></div><div><span>Open critical</span><b>2</b><small className="negative">1 overdue</small></div></div><div className="two-col"><Section title="Verified completion trend" sub="Percentage completed on time with evidence"><div className="chart-area"><div className="line one"/><div className="line two"/>{[82,86,84,90,91,94].map((x,n)=><i key={n} style={{left:`${8+n*17}%`,bottom:`${x-68}%`}}><span>{x}%</span></i>)}<div className="xlabels">{["Dec","Jan","Feb","Mar","Apr","May"].map(x=><span key={x}>{x}</span>)}</div></div></Section><Section title="Assurance by category"><div className="category-bars">{["Eligibility","Credentialing","Quality","Compliance","Contracts"].map((x,n)=><div key={x}><span>{x}</span><i><b style={{width:`${[92,88,96,94,81][n]}%`}}/></i><strong>{[92,88,96,94,81][n]}%</strong></div>)}</div></Section></div><Section title="Recurring failure themes" sub="Root causes across the selected period"><div className="table-wrap"><table><thead><tr><th>Theme</th><th>Occurrences</th><th>Primary category</th><th>Trend</th><th>Control recommendation</th></tr></thead><tbody><tr><td><strong>External acknowledgment delay</strong></td><td>7</td><td>Quality</td><td><Chip tone="amber">Stable</Chip></td><td>Automate payer status polling</td></tr><tr><td><strong>Control-total mismatch</strong></td><td>4</td><td>Eligibility</td><td><Chip tone="red">Increasing</Chip></td><td>Pre-submit source reconciliation</td></tr><tr><td><strong>Approval bottleneck</strong></td><td>3</td><td>Credentialing</td><td><Chip tone="green">Improving</Chip></td><td>Backup committee approver</td></tr></tbody></table></div></Section></>;
}
