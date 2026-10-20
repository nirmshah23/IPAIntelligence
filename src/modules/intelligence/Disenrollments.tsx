import { useState } from 'react';
import { PaginatedTable } from '../../components/PaginatedResults';
import type { Action, Provider } from './types';
import { defaultDisenrollmentMinimum, disenrollmentMeasurements, disenrollmentPeriods, isDisenrollmentFlagged } from './disenrollmentData';

export function Disenrollments({ providers, period, actions, openActions }: { providers: Provider[]; period: string; actions: Action[]; openActions: (providerId?: string) => void }) {
  const [minimum, setMinimum] = useState(() => {
    const stored = localStorage.getItem('ipa-disenrollment-minimum');
    const value = stored === null ? defaultDisenrollmentMinimum : Number(stored);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : defaultDisenrollmentMinimum;
  });
  const [county, setCounty] = useState('All');
  const counties = [...new Set(providers.filter(provider => provider.type === 'Individual' && provider.members > 0).map(provider => provider.county))].sort();
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const rows = providers.filter(provider => provider.type === 'Individual' && provider.members > 0 && (county === 'All' || provider.county === county)).map(provider => {
    const values = disenrollmentMeasurements(provider, period);
    return { provider, values, flagged: isDisenrollmentFlagged(provider, period, minimum) };
  });
  const shown = rows.filter(row => (!flaggedOnly || row.flagged) && `${row.provider.name} ${row.provider.id} ${row.provider.county}`.toLowerCase().includes(search.toLowerCase()));
  const linked = actions.filter(action => action.category === 'Disenrollments');
  return <>
    <div className="page-header"><div><p className="eyebrow">Membership Management</p><h1>Disenrollments</h1><p>Review lost membership for the selected quarter and the three preceding calendar years.</p></div></div>
    <div className="settings-strip"><div><b>Minimum acceptable disenrollment rate</b><p>Flag when the rate is strictly above the minimum in all four periods. Rate = lost members ÷ starting membership × 100.</p><p>Quarterly and annual rates cover different durations and are not annualized. Fictional demo data; providers with attributed membership only.</p></div><label className="control">Minimum rate (%)<input type="number" min="0" max="100" step="0.1" value={minimum} onChange={event => { if (!event.target.value) return; const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0 && value <= 100) { setMinimum(value); localStorage.setItem('ipa-disenrollment-minimum', String(value)); } }} /></label></div>
    <div className="toolbar"><label className="control">County<select value={county} onChange={event => setCounty(event.target.value)}><option value="All">All counties</option>{counties.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="control">Search providers<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, ID or county" /></label><label className="check"><input type="checkbox" checked={flaggedOnly} onChange={event => setFlaggedOnly(event.target.checked)} />Flagged providers only</label><span className="result-count">{shown.length} providers</span></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Provider</th>{disenrollmentPeriods(period).map(id => <th key={id}>{id}<br />Lost / starting members · rate</th>)}<th>Assessment</th><th>Actions</th></tr></thead><tbody>{shown.map(({ provider, values, flagged }) => <tr key={provider.id}><td><b>{provider.name}</b><small>{provider.id} · {provider.county}</small></td>{values.map(value => <td key={value.id} className={value.rate > minimum ? 'metric-low' : ''}><b>{value.lostMembers} / {value.startingMembers}</b><small>{value.rate.toFixed(2)}%</small></td>)}<td>{flagged ? <span className="metric-low">Flagged · above in all 4</span> : 'Not flagged'}</td><td>{linked.some(action => action.providerId === provider.id) ? <button className="btn secondary" onClick={() => openActions(provider.id)}>{linked.filter(action => action.providerId === provider.id).length} actions</button> : '—'}</td></tr>)}</tbody></PaginatedTable></div>{!shown.length && <p style={{ padding: 20 }}>No providers match these filters.</p>}</section>
  </>;
}
