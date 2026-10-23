import { useState } from 'react';
import { PaginatedTable } from '../../components/PaginatedResults';
import { LatestAction } from './LatestAction';
import { defaultAcceptableEnrollmentRate, enrollmentMeasurements, enrollmentPeriods, isEnrollmentFlagged } from './enrollmentData';
import { useGoalRows } from './useGoalRows';
import type { Action, Provider } from './types';

export function Enrollments({ providers, period, addAction }: { providers: Provider[]; period: string; addAction: (subject: string, reason: string, priority: Action["priority"], context: Pick<Action, "providerId" | "evidence" | "expectedResult" | "goalDescription">) => void }) {
  const [acceptableRate, setAcceptableRate] = useState(() => {
    const stored = localStorage.getItem('ipa-enrollment-acceptable-rate');
    const value = stored === null ? defaultAcceptableEnrollmentRate : Number(stored);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : defaultAcceptableEnrollmentRate;
  });
  const [county, setCounty] = useState('All');
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const goals = useGoalRows('enrollments', period);
  const eligibleProviders = providers.filter(provider => provider.type === 'Individual' && provider.members > 0);
  const counties = [...new Set(eligibleProviders.map(provider => provider.county))].sort();
  const rows = eligibleProviders.filter(provider => county === 'All' || provider.county === county).map(provider => {
    const values = enrollmentMeasurements(provider, period);
    return { provider, values, flagged: isEnrollmentFlagged(provider, period, acceptableRate) };
  });
  const shown = rows.filter(row => (!flaggedOnly || row.flagged) && `${row.provider.name} ${row.provider.id} ${row.provider.county}`.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div className="page-header"><div><p className="eyebrow">Membership Management</p><h1>Enrollments</h1><p>Review newly joined membership for the selected quarter and the three preceding calendar years.</p></div><button className="btn btn-secondary" onClick={goals.refresh}>Refresh Data</button></div>
    <div className="settings-strip"><div><b>Acceptable enrollment rate</b><p>Flag when the enrollment rate is strictly below the acceptable rate in all four periods. Rate = newly joined members ÷ starting membership × 100.</p><p>Quarterly and annual rates cover different durations and are not annualized. Fictional demo data; providers with attributed membership only.</p></div><label className="control">Acceptable rate (%)<input type="number" min="0" max="100" step="0.1" value={acceptableRate} onChange={event => { if (!event.target.value) return; const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0 && value <= 100) { setAcceptableRate(value); localStorage.setItem('ipa-enrollment-acceptable-rate', String(value)); } }} /></label></div>
    <div className="toolbar"><label className="control">County<select value={county} onChange={event => setCounty(event.target.value)}><option value="All">All counties</option>{counties.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="control">Search providers<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, ID or county" /></label><label className="check"><input type="checkbox" checked={flaggedOnly} onChange={event => setFlaggedOnly(event.target.checked)} />Flagged providers only</label><span className="result-count">{shown.length} providers</span></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Provider</th>{enrollmentPeriods(period).map(id => <th key={id}>{id}<br />Joined / starting members · rate</th>)}<th>Assessment</th><th>Goal</th></tr></thead><tbody>{shown.map(({ provider, values, flagged }) => <tr className={goals.has(provider.id) ? 'goal-added' : ''} key={provider.id}><td><b>{provider.name}</b><small>{provider.id} · {provider.county}</small></td>{values.map(value => <td key={value.id} className={value.rate < acceptableRate ? 'metric-low' : ''}><b>{value.joinedMembers} / {value.startingMembers}</b><small>{value.rate.toFixed(2)}%</small></td>)}<td>{flagged ? <span className="metric-low">Flagged · below in all 4</span> : 'Not flagged'}</td><td><button className="btn btn-secondary" disabled={goals.has(provider.id)} onClick={() => goals.add(provider.id, () => addAction(
      `Review enrollments: ${provider.name} (${provider.id}) · ${period}`,
      `${provider.name} (${provider.id}), ${provider.county} County. ${flagged ? 'Rates fall below' : 'Rates do not fall below'} the ${acceptableRate}% acceptable rate in all four measurement periods for ${period}.`,
      flagged ? 'High' : 'Medium',
      { providerId: provider.id, goalDescription: 'Review enrollments', evidence: values.map(value => `${value.id}: ${value.joinedMembers} joined / ${value.startingMembers} starting members (${value.rate.toFixed(2)}%)`).join('; '), expectedResult: 'Review new-member enrollment performance and document provider follow-up.' }
    ))}>Add</button>{goals.has(provider.id) && <LatestAction category="Enrollments" providerId={provider.id} />}</td></tr>)}</tbody></PaginatedTable></div>{!shown.length && <div className="empty"><strong>No providers found</strong><p>No providers match these filters.</p></div>}</section>
  </>;
}
