import { useEffect, useMemo, useRef, useState } from 'react';
import { PaginatedTable } from '../../components/PaginatedResults';
import type { Provider, ProviderPeriodData } from './types';

type Props = { provider: Provider; period: string; periodLabel: string; metrics: ProviderPeriodData; onClose: () => void };

export function AssignedMembersModal({ provider, period, periodLabel, metrics, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [plan, setPlan] = useState('All');
  const [flag, setFlag] = useState('All');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const members = useMemo(() => {
    const [year, quarter] = period.split('-Q').map(Number);
    const start = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
    const completed = Math.round(metrics.attributedMembers * metrics.preventiveCompliance / 100);
    const names = ['Alex Morgan', 'Jordan Lee', 'Taylor Rivera', 'Casey Patel', 'Riley Chen', 'Jamie Brooks', 'Avery Garcia', 'Morgan Kim'];
    return Array.from({ length: metrics.attributedMembers }, (_, index) => {
      const performed = index < completed;
      const never = !performed && index % 3 === 0;
      return { id: `DEMO-${provider.id}-${String(index + 1).padStart(4, '0')}`, name: `${names[index % names.length]} ${index + 1}`, plan: ['Medicare Advantage', 'Commercial', 'Medicaid'][index % 3], performed,
        date: performed ? `${start.slice(0, 8)}${String(1 + index % 28).padStart(2, '0')}` : never ? null : `${year - 1}-12-${String(1 + index % 28).padStart(2, '0')}`,
        flag: performed ? 'Complete' : never ? 'No AWV on record' : 'Prior-period AWV only' };
    });
  }, [provider.id, period, metrics.attributedMembers, metrics.preventiveCompliance]);
  const missing = members.filter(member => !member.performed).length;
  const query = search.trim().toLowerCase();
  const rows = members.filter(member => (!query || `${member.name} ${member.id}`.toLowerCase().includes(query)) && (status === 'All' || member.performed === (status === 'Performed')) && (plan === 'All' || member.plan === plan) && (flag === 'All' || member.flag === flag));
  const control = 'w-full! min-w-0!';
  return <dialog ref={dialog} aria-labelledby="assigned-members-title" aria-describedby="assigned-members-description" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }} className="modal task-dialog w-[min(1100px,calc(100%-40px))]!">
    <div className="modal-head"><div><p className="eyebrow">Preventive care compliance</p><h2 id="assigned-members-title">Assigned Members</h2><p className="task-description">{provider.name} · {provider.id} · {periodLabel}</p></div><button type="button" autoFocus onClick={onClose} aria-label="Close assigned members" className="close">?</button></div>
    <div className="px-[22px] py-5"><p id="assigned-members-description" className="mb-4 text-[11px] leading-relaxed text-(--muted)">Fictional demo roster, generated to match the assigned count and rounded compliance rate. AWV means annual wellness visit. Only visits performed within the selected reporting period count as complete.</p>
    <div className="mb-4 flex flex-wrap items-center gap-2"><span className="badge badge-neutral">{members.length} assigned</span><span className="badge badge-good">{members.length - missing} performed</span><button type="button" onClick={() => { setStatus('Not performed'); setFlag('All'); setSearch(''); setPlan('All'); }} className="badge badge-warn cursor-pointer underline underline-offset-2 focus-visible:outline-2">{missing} not performed in period</button></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="control min-w-0">Search members<input className={control} value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or member ID" /></label>
      <label className="control min-w-0">AWV status<select className={control} value={status} onChange={event => setStatus(event.target.value)}><option>All</option><option>Not performed</option><option>Performed</option></select></label>
      <label className="control min-w-0">Health plan<select className={control} value={plan} onChange={event => setPlan(event.target.value)}><option>All</option><option>Medicare Advantage</option><option>Commercial</option><option>Medicaid</option></select></label>
      <label className="control min-w-0">Care-gap flag<select className={control} value={flag} onChange={event => setFlag(event.target.value)}><option>All</option><option>No AWV on record</option><option>Prior-period AWV only</option><option>Complete</option></select></label>
    </div>
    <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-(--muted)"><span role="status">{rows.length} of {members.length} assigned members</span><button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setStatus('All'); setPlan('All'); setFlag('All'); }}>Reset filters</button></div>
    <div className="table-card"><div className="table-wrap"><PaginatedTable><thead><tr><th>Member</th><th>Member ID</th><th>Health plan</th><th>Last recorded AWV</th><th>AWV in selected period</th><th>Care-gap flag</th></tr></thead><tbody>{rows.map(member => <tr key={member.id}><td>{member.name}</td><td>{member.id}</td><td>{member.plan}</td><td>{member.date ?? 'None recorded'}</td><td><span className={`badge ${member.performed ? 'badge-good' : 'badge-warn'}`}>{member.performed ? 'Performed' : 'Not performed'}</span></td><td>{member.flag}</td></tr>)}</tbody></PaginatedTable></div></div>
    {!rows.length && <p className="py-6 text-center text-[11px] text-(--muted)">No members match these filters. Reset filters or try another name or member ID.</p>}
    </div>
  </dialog>;
}

