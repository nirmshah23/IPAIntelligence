import { useEffect, useState } from 'react';
import Intelligence, { type Page as IntelligencePage } from './modules/intelligence/App';
import Assurance, { type Page as AssurancePage } from './modules/assurance/App';
import './modules/intelligence/styles.css';
import './modules/assurance/styles.css';

type Module = 'intelligence' | 'relations' | 'assurance' | 'reports';
type Navigation = { planId?: string; filter?: string };
const intelligencePages: [IntelligencePage, string][] = [
  ['dashboard', 'Membership workflow'],
  ['providers', 'Provider directory'], ['compliance', 'Preventive compliance'],
  ['adequacy', 'Network adequacy'], ['dofr', 'DOFR Expansion'],
  ['referrals', 'Referral intelligence'], ['facilities', 'Facilities'],
  ['actions', 'Action center'],
];
const relationsPages: [IntelligencePage, string][] = [['relations', 'Relations workflow'], ['workplans', 'Work plan'], ['measurements', 'Measurement setup']];
const assurancePages: [AssurancePage, string][] = [
  ['overview', 'Compliance workflow'], ['queue', 'Obligations'],
  ['exceptions', 'Exceptions & escalations'],
  ['calendar', 'Compliance calendar'], ['editor', 'Definition editor'],
];
type ReportsPage = 'providers' | 'membership' | 'compliance';
const reportsPages = [['membership', 'Membership'], ['providers', 'Providers'], ['compliance', 'Compliance']] as const;
function initialRoute() {
  const [path, query] = window.location.hash.slice(2).split('?');
  const [module, page] = path.split('/');
  const params = new URLSearchParams(query);
  const isRelations = module === 'relations' || (module === 'intelligence' && ['relations', 'workplans', 'measurements'].includes(page));
  const isReports = module === 'reports' || (module === 'intelligence' && page === 'analytics') || (module === 'assurance' && page === 'reports');
  return {
    module: (isReports ? 'reports' : isRelations ? 'relations' : module === 'assurance' ? 'assurance' : 'intelligence') as Module,
    reports: (page === 'reports' || page === 'compliance' ? 'compliance' : page === 'membership' ? 'membership' : 'providers') as ReportsPage,
    navigation: { planId: params.get('plan') || undefined, filter: params.get('filter') || undefined } as Navigation,
    relations: (page === 'measurements' ? 'measurements' : page === 'workplans' ? 'workplans' : 'relations') as IntelligencePage,
    intelligence: intelligencePages.some(([id]) => id === page) ? page as IntelligencePage : 'dashboard' as IntelligencePage,
    assurance: page === 'register' ? 'queue' as AssurancePage : [...assurancePages.map(([id]) => id), 'detail'].includes(page) ? page as AssurancePage : 'overview' as AssurancePage,
  };
}
export default function App() {
  const [route, setRoute] = useState(initialRoute);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<Module, boolean>>({ intelligence: true, relations: true, assurance: true, reports: true });
  useEffect(() => {
    const restoreRoute = () => {
      const next = initialRoute();
      setExpanded(current => ({ ...current, [next.module]: true }));
      setRoute(current => ({ ...current, module: next.module, navigation: next.navigation, [next.module]: next[next.module] }));
      setNavigationOpen(false);
    };
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
            {pages.map(([id, label]) => <button key={id} aria-current={route.module === module && route[module] === id ? 'page' : undefined} onClick={() => navigate(module, id)}>{label}</button>)}
          </div>
        </div>)}
      </nav>
      <div className="workspace-note">Demo workspace · Fictional data</div>
    </aside>
    {navigationOpen && <button className="workspace-overlay" aria-label="Close navigation" onClick={() => setNavigationOpen(false)} />}
    <div id="workspace-content" className="workspace-content" tabIndex={-1}>
      <section className="intelligence-module" aria-label={route.module === "reports" ? "Reports & Analytics" : route.module === "relations" ? "Provider Relations" : "Membership Management"} hidden={route.module === 'assurance' || (route.module === 'reports' && route.reports === 'compliance')}><Intelligence analyticsView={route.reports === "membership" ? "membership" : "providers"} page={route.module === "reports" ? 'analytics' : route.module === "relations" ? route.relations : route.intelligence} navigation={route.navigation} setPage={(page, navigation) => navigate(page === 'analytics' ? 'reports' : page === "relations" || page === "workplans" || page === "measurements" ? "relations" : "intelligence", page, navigation)} /></section>
      <section className="assurance-module" aria-label={route.module === 'reports' ? 'Reports & Analytics' : 'Operational Compliance'} hidden={route.module !== 'assurance' && !(route.module === 'reports' && route.reports === 'compliance')}><Assurance page={route.module === 'reports' ? 'reports' : route.assurance} setPage={page => navigate(page === 'reports' ? 'reports' : 'assurance', page)} /></section>
    </div>
  </div>;
}
