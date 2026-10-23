'use client'

import { useEffect, useState } from 'react';
import { WorkspaceBanner } from './components/WorkspaceBanner';
import Intelligence, { type Page as IntelligencePage } from './modules/intelligence/App';
import Assurance, { type Page as AssurancePage } from './modules/assurance/App';

type Module = 'workflows' | 'intelligence' | 'relations' | 'assurance' | 'reports';
type Navigation = { planId?: string; filter?: string; memberId?: string; period?: string };
const intelligencePages: [IntelligencePage, string][] = [
  ['membership', 'Membership'], ['providers', 'Provider directory'], ['enrollments', 'Enrollments'], ['disenrollments', 'Disenrollments'],
  ['compliance', 'Preventive compliance'],
  ['adequacy', 'Network adequacy'], ['area-adequacy', 'Area Adequacy'],
  ['referrals', 'OON referrals'], ['facilities', 'Facilities'],
  ['actions', 'Goal center'],
];
const relationsPages: [IntelligencePage, string][] = [['workplans', 'Projects'], ['project-templates', 'Project templates'], ['measurements', 'Measurement setup']];
const assurancePages: [AssurancePage, string][] = [
  ['queue', 'Obligations'],
  ['exceptions', 'Exceptions & escalations'],
  ['calendar', 'Compliance calendar'], ['editor', 'Definition editor'],
];
type ReportsPage = 'providers' | 'membership' | 'compliance';
const reportsPages = [['membership', 'Membership'], ['providers', 'Providers'], ['compliance', 'Compliance']] as const;
function initialRoute() {
  if (typeof window === 'undefined') {
    return {
      module: 'workflows' as Module,
      workflows: 'dashboard' as const,
    reports: 'providers' as ReportsPage,
      navigation: {} as Navigation,
      relations: 'relations' as IntelligencePage,
      intelligence: 'dashboard' as IntelligencePage,
      assurance: 'overview' as AssurancePage,
    };
  }
  const [path, query] = window.location.hash.slice(2).split('?');
  const [module, page] = path.split('/');
  const params = new URLSearchParams(query);
  const isRelations = module === 'relations' || (module === 'intelligence' && ['relations', 'workplans', 'project-templates', 'measurements'].includes(page));
  const isReports = module === 'reports' || (module === 'intelligence' && page === 'analytics') || (module === 'assurance' && page === 'reports');
  const isWorkflow = !module || module === 'workflows' || (module === 'intelligence' && ['dashboard', 'relations'].includes(page)) || (module === 'relations' && (!page || page === 'relations')) || (module === 'assurance' && (!page || page === 'overview'));
  const known = isReports || isRelations || module === 'assurance' || (module === 'intelligence' && (page === 'member-details' || page === 'dofr' || intelligencePages.some(([id]) => id === page)));
  return {
    workflows: 'dashboard' as const,
    module: (isWorkflow || !known ? 'workflows' : isReports ? 'reports' : isRelations ? 'relations' : module === 'assurance' ? 'assurance' : 'intelligence') as Module,
    reports: (page === 'reports' || page === 'compliance' ? 'compliance' : page === 'membership' ? 'membership' : 'providers') as ReportsPage,
    navigation: { memberId: params.get('member') || undefined, period: params.get('period') || undefined, planId: params.get('plan') || undefined, filter: params.get('filter') || undefined } as Navigation,
    relations: (page === 'measurements' ? 'measurements' : page === 'project-templates' ? 'project-templates' : page === 'workplans' ? 'workplans' : 'relations') as IntelligencePage,
    intelligence: page === 'member-details' ? 'member-details' as IntelligencePage : page === 'dofr' ? 'adequacy' as IntelligencePage : intelligencePages.some(([id]) => id === page) ? page as IntelligencePage : 'dashboard' as IntelligencePage,
    assurance: page === 'register' ? 'queue' as AssurancePage : [...assurancePages.map(([id]) => id), 'detail'].includes(page) ? page as AssurancePage : 'overview' as AssurancePage,
  };
}
export default function App() {
  const [route, setRoute] = useState(() => ({
    module: 'workflows' as Module,
    workflows: 'dashboard' as const,
    reports: 'providers' as ReportsPage,
    navigation: {} as Navigation,
    relations: 'relations' as IntelligencePage,
    intelligence: 'dashboard' as IntelligencePage,
    assurance: 'overview' as AssurancePage,
  }));
  const [reportingTarget, setReportingTarget] = useState<HTMLDivElement | null>(null);
  const [goalTarget, setGoalTarget] = useState<HTMLDivElement | null>(null);
  const [complianceTarget, setComplianceTarget] = useState<HTMLDivElement | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<Module, boolean>>({ workflows: true, intelligence: true, relations: true, assurance: true, reports: true });
  useEffect(() => {
    const restoreRoute = () => {
      const next = initialRoute();
      setExpanded(current => ({ ...current, [next.module]: true }));
      setRoute(current => ({ ...current, module: next.module, navigation: next.navigation, [next.module]: next[next.module] }));
      setNavigationOpen(false);
    };
    restoreRoute();
    window.addEventListener('hashchange', restoreRoute);
    return () => window.removeEventListener('hashchange', restoreRoute);
  }, []);
  // Keep the data-owning views mounted so forms, filters, and report data survive navigation.
  function navigate(module: Module, page: IntelligencePage | AssurancePage | ReportsPage, navigation: Navigation = {}) {
    if (module === 'reports' && page === 'analytics') page = 'providers';
    if (module === 'reports' && page === 'reports') page = 'compliance';
    setRoute(current => ({ ...current, module, navigation, [module]: page }));
    const params = new URLSearchParams();
    if (navigation.planId) params.set('plan', navigation.planId);
    if (navigation.filter) params.set('filter', navigation.filter);
    if (navigation.memberId) params.set('member', navigation.memberId);
    if (navigation.period) params.set('period', navigation.period);
    const hash = `#/${module}/${page}${params.size ? '?' + params.toString() : ''}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setExpanded(current => ({ ...current, [module]: true }));
    setNavigationOpen(false);
  }
  return <div className="workspace">
    <a className="skip-link" href="#workspace-content" onClick={event => { event.preventDefault(); document.getElementById("workspace-content")?.focus(); }}>Skip to content</a>
    <header className="workspace-mobile"><strong>Arcwell IPA · IPA Workspace</strong><button onClick={() => setNavigationOpen(!navigationOpen)} aria-expanded={navigationOpen} aria-controls="workspace-navigation">Menu</button></header>
    <aside id="workspace-navigation" className={`workspace-navigation ${navigationOpen ? 'is-open' : ''}`}>
      <div className="workspace-brand"><span>AW</span><div><strong>Arcwell IPA</strong><small>IPA Workspace</small></div></div>
      <nav aria-label="Workspace navigation">
        <button aria-current={route.module === "workflows" ? "page" : undefined} onClick={() => navigate("workflows", "dashboard")}>Workflows</button>
        {([
          ['intelligence', 'Membership Management', intelligencePages],
          ['relations', 'Provider Relations', relationsPages],
          ['assurance', 'Operational Compliance', assurancePages],
          ['reports', 'Reports & Analytics', reportsPages],
        ] as const).map(([module, title, pages]) => <div className="navigation-group" key={module}>
          <button className="navigation-group-toggle" aria-expanded={expanded[module]} aria-controls={`navigation-${module}`} onClick={() => setExpanded(current => ({ ...current, [module]: !current[module] }))}>
            <span>{title}</span><svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" style={{ transform: expanded[module] ? "rotate(90deg)" : undefined }}><path d="m4 2 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <div className="navigation-children" id={`navigation-${module}`} hidden={!expanded[module]}>
            {pages.map(([id, label]) => <button key={id} aria-current={route.module === module && (route[module] === id || (id === 'membership' && route[module] === 'member-details')) ? 'page' : undefined} onClick={() => navigate(module, id)}>{label}</button>)}
            {module === 'relations' && <a className="block w-full rounded-[6px] border-0 bg-transparent px-3 py-[9px] text-left text-xs text-[#d5e4e1] no-underline hover:bg-[#1c5149] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#74d1be]" href="./ProviderRelationsMobileApp/index.html" target="_blank" rel="noopener noreferrer" aria-label="Mobile app (opens in a new tab)">Mobile app</a>}
          </div>
        </div>)}
      </nav>
      
    </aside>
    {navigationOpen && <button className="workspace-overlay" aria-label="Close navigation" onClick={() => setNavigationOpen(false)} />}
    <div id="workspace-content" className="workspace-content" tabIndex={-1}>
      <WorkspaceBanner>
        <div className="intelligence-module min-h-0! min-w-0! bg-transparent!" ref={setReportingTarget} hidden={route.module === 'workflows' || route.module === 'assurance' || (route.module === 'reports' && route.reports === 'compliance')} />
        {(route.module === 'workflows' || route.module === 'assurance' || (route.module === 'reports' && route.reports === 'compliance')) && <span className="text-sm font-semibold">{route.module === 'workflows' ? 'Workflows' : route.module === 'reports' ? 'Reports & Analytics' : 'Operational Compliance'}</span>}
      </WorkspaceBanner>
      <div hidden={route.module !== 'workflows'} className="px-4 py-8 md:px-8">
        <div className="intelligence-module" ref={setGoalTarget} />
        <div className="assurance-module mt-10!" ref={setComplianceTarget} />
      </div>
      <section className="intelligence-module" aria-label={route.module === "reports" ? "Reports & Analytics" : route.module === "relations" ? "Provider Relations" : "Membership Management"} hidden={route.module === 'workflows' || route.module === 'assurance' || (route.module === 'reports' && route.reports === 'compliance')}><Intelligence reportingTarget={reportingTarget} dashboardTarget={goalTarget} analyticsView={route.reports === "membership" ? "membership" : "providers"} page={route.module === "reports" ? 'analytics' : route.module === "relations" ? route.relations : route.intelligence} navigation={route.navigation} setPage={(page, navigation) => navigate(page === 'analytics' ? 'reports' : page === "relations" || page === "workplans" || page === "measurements" || page === "project-templates" ? "relations" : "intelligence", page, navigation)} /></section>
      <section className="assurance-module" aria-label={route.module === 'reports' ? 'Reports & Analytics' : 'Operational Compliance'} hidden={route.module !== 'assurance' && !(route.module === 'reports' && route.reports === 'compliance')}><Assurance dashboardTarget={complianceTarget} page={route.module === 'reports' ? 'reports' : route.assurance} setPage={page => navigate(page === 'reports' ? 'reports' : 'assurance', page)} /></section>
    </div>
  </div>;
}
