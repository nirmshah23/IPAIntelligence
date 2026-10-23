import { useMemo, useState } from 'react';
import { PaginatedTable } from '../../components/PaginatedResults';
import { getMembers } from './memberData';
import { accessSpecialties, areaGoalSubject, memberAccess, specialtyLabel, type AccessGap } from './areaAdequacyData';
import type { Action, Provider, ProviderPeriodData } from './types';

type Props = { providers: Provider[]; period: string; actions: Action[]; getPeriod: (provider: Provider, period: string) => ProviderPeriodData; onAdd: (gap: AccessGap) => string | null; onOpenMember: (id: string) => void; onOpenGoals: () => void };
export function AreaAdequacy({ providers, period, actions, getPeriod, onAdd, onOpenMember, onOpenGoals }: Props) {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [county, setCounty] = useState('All');
  const [goalFilter, setGoalFilter] = useState('All');
  const [error, setError] = useState('');
  const specialties = useMemo(() => accessSpecialties(providers), [providers]);
  const gaps = useMemo(() => getMembers(providers, period, getPeriod).flatMap(member => memberAccess(member, providers, specialties).filter(access => !access.available).map(access => ({ ...access, member }))), [providers, period, getPeriod, specialties]);
  const openGoals = actions.filter(a => a.category === 'Area Adequacy' && !['Completed', 'Cancelled', 'Dismissed'].includes(a.status));
  const goalFor = (gap: AccessGap) => openGoals.find(a => a.memberId === gap.member.id && a.specialty === gap.specialty || a.subject === areaGoalSubject(gap));
  const query = search.trim().toLowerCase();
  const rows = gaps.filter(gap => (!query || `${gap.member.name} ${gap.member.id}`.toLowerCase().includes(query)) && (specialty === 'All' || gap.specialty === specialty) && (county === 'All' || gap.member.provider.county === county) && (goalFilter === 'All' || Boolean(goalFor(gap)) === (goalFilter === 'Goal added')));
  return <>
    <div className="page-header"><div><p className="eyebrow">Membership Management</p><h1>Area Adequacy</h1><p>Members without PCP or specialist access within the predefined radius for {period}.</p></div><button className="btn btn-secondary self-start" onClick={onOpenGoals}>View area adequacy goals</button></div>
    <section className="settings-strip"><div><b>Area adequacy rule</b><p>Demo radius: PCP 15 miles; specialists 30 miles. Each row is one member-specialty gap.</p></div></section>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="mb-5 flex flex-wrap gap-3"><span className="badge badge-neutral">{new Set(gaps.map(g => g.member.id)).size.toLocaleString()} members with access gaps</span><span className="badge badge-warn">{gaps.length.toLocaleString()} specialty gaps</span><span className="badge badge-good">{openGoals.length} active area adequacy goals</span></div>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="control min-w-0">Search members<input className="w-full! min-w-0!" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or member ID" /></label>
      <label className="control min-w-0">Specialty<select className="w-full! min-w-0!" value={specialty} onChange={e => setSpecialty(e.target.value)}><option>All</option>{specialties.map(s => <option key={s} value={s}>{specialtyLabel(s)}</option>)}</select></label>
      <label className="control min-w-0">County<select className="w-full! min-w-0!" value={county} onChange={e => setCounty(e.target.value)}><option>All</option>{[...new Set(providers.map(p => p.county))].map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="control min-w-0">Goal status<select className="w-full! min-w-0!" value={goalFilter} onChange={e => setGoalFilter(e.target.value)}><option>All</option><option>Needs goal</option><option>Goal added</option></select></label>
    </div>
    <div className="mb-3 flex items-center justify-between"><span role="status">{rows.length.toLocaleString()} member-specialty gaps</span><button className="btn btn-secondary" onClick={() => { setSearch(''); setSpecialty('All'); setCounty('All'); setGoalFilter('All'); }}>Reset filters</button></div>
    <section className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Member</th><th>Member ID</th><th>County</th><th>Specialty</th><th>Radius</th><th>Nearest provider (demo)</th><th>Available within radius</th><th>Goal</th></tr></thead><tbody>{rows.map(gap => { const goal = goalFor(gap); return <tr key={`${gap.member.id}:${gap.specialty}`}><td><button className="cursor-pointer text-teal-700 underline" onClick={() => onOpenMember(gap.member.id)}>{gap.member.name}</button></td><td>{gap.member.id}</td><td>{gap.member.provider.county}</td><td>{specialtyLabel(gap.specialty)}</td><td>{gap.radius} miles</td><td>{gap.distance === null ? 'None in network' : `${gap.distance.toFixed(1)} miles`}</td><td><span className="badge badge-warn">No</span></td><td><button className="btn btn-secondary" disabled={Boolean(goal)} onClick={() => setError(onAdd(gap) || '')}>{goal ? 'Goal added' : 'Add goal'}</button><small>{goal ? `${goal.goalDescription} | ${goal.owner} | ${goal.status}` : 'Ensure Area Adequacy'}</small></td></tr>; })}</tbody></PaginatedTable></div>{!rows.length && <p className="p-6 text-sm">No access gaps match these filters. Reset filters to review other members or specialties.</p>}</section>
  </>;
}
