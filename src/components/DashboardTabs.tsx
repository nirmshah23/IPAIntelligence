import { Children, type ReactElement, type ReactNode, useId, useState } from 'react';

export function DashboardTabs({ label, children }: { label: string; children: ReactNode }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const panels = Children.toArray(children) as ReactElement<{ title: string }>[];
  return <div className="min-w-0">
    <div role="tablist" aria-label={label} className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {panels.map((panel, index) => <button key={index} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel-${index}`} className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active === index ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} onClick={() => setActive(index)}>{panel.props.title}</button>)}
    </div>
    {panels.map((panel, index) => <div key={index} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== index}>{panel}</div>)}
  </div>;
}

