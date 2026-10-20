import { useEffect, useState } from 'react';
import Intelligence, { type Page as IntelligencePage } from './modules/intelligence/App';
import Assurance, { type Page as AssurancePage } from './modules/assurance/App';
import './modules/intelligence/styles.css';
import './modules/assurance/styles.css';

type Module = 'intelligence' | 'relations' | 'assurance';
type Navigation = { planId?: string; filter?: string };
const intelligencePages: [IntelligencePage, string][] = [
  ['dashboard', 'Membership workflow'], ['analytics', 'Performance analytics'],
  ['providers', 'Provider directory'], ['compliance', 'Preventive compliance'],
  ['adequacy', 'Network adequacy'], ['dofr', 'Division of responsibility'],
  ['referrals', 'Referral intelligence'], ['facilities', 'Facilities'],
  ['actions', 'Action center'],
];
const relationsPages: [IntelligencePage, string][] = [['relations', 'Relations workflow'], ['workplans', 'Work plan']];
const assurancePages: [AssurancePage, string][] = [
  ['overview', 'Compliance workflow'], ['queue', 'Work queue'],
  ['exceptions', 'Exceptions & escalations'],
  ['calendar', 'Compliance calendar'], ['editor', 'Definition editor'],
  ['reports', 'Reports & trends'],
];
function initialRoute() {
  const [path, query] = window.location.hash.slice(2).split('?');
  const [module, page] = path.split('/');
  const params = new URLSearchParams(query);
  const isRelations = module === 'relations' || (module === 'intelligence' && ['relations', 'workplans'].includes(page));
  return {
    module: (isRelations ? 'relations' : module === 'assurance' ? 'assurance' : 'intelligence') as Module,
    navigation: { planId: params.get('plan') || undefined, filter: params.get('filter') || undefined } as Navigation,
    relations: (page === 'workplans' ? 'workplans' : 'relations') as IntelligencePage,
    intelligence: intelligencePages.some(([id]) => id === page) ? page as IntelligencePage : 'dashboard' as IntelligencePage,
    assurance: page === 'register' ? 'queue' as AssurancePage : [...assurancePages.map(([id]) => id), 'detail'].includes(page) ? page as AssurancePage : 'overview' as AssurancePage,
  };
}
export default function App() {
  const [route, setRoute] = useState(initialRoute);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<Module, boolean>>({ intelligence: true, relations: true, assurance: true });
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
  // Keep both modules mounted so unfinished forms and filters survive navigation.
  function navigate(module: Module, page: IntelligencePage | AssurancePage, navigation: Navigation = {}) {
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
    <header className="workspace-mobile"><strong>QuickCap · IPA Workspace</strong><button onClick={() => setNavigationOpen(!navigationOpen)} aria-expanded={navigationOpen} aria-controls="workspace-navigation">Menu</button></header>
    <aside id="workspace-navigation" className={`workspace-navigation ${navigationOpen ? 'is-open' : ''}`}>
      <div className="workspace-brand"><span>QC</span><div><strong>QuickCap</strong><small>IPA Workspace</small></div></div>
      <nav aria-label="Workspace navigation">
        {([
          ['intelligence', 'Membership Management', intelligencePages],
          ['relations', 'Provider Relations', relationsPages],
          ['assurance', 'Operational Compliance', assurancePages],
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
      <section className="intelligence-module" aria-label={route.module === "relations" ? "Provider Relations" : "Membership Management"} hidden={route.module === 'assurance'}><Intelligence page={route.module === "relations" ? route.relations : route.intelligence} navigation={route.navigation} setPage={(page, navigation) => navigate(page === "relations" || page === "workplans" ? "relations" : "intelligence", page, navigation)} /></section>
      <section className="assurance-module" aria-label="Operational Compliance" hidden={route.module !== 'assurance'}><Assurance page={route.assurance} setPage={page => navigate('assurance', page)} /></section>
    </div>
  </div>;
}
