import { createContext, useContext } from 'react';
import type { Action } from './types';

export const ActionHistoryContext = createContext<Action[]>([]);

export function LatestAction({ category, subject, providerId }: { category: string; subject?: string; providerId?: string }) {
  const actions = useContext(ActionHistoryContext).filter(action => action.category === category && (
    providerId && action.providerId ? action.providerId === providerId :
    subject ? action.subject === subject : providerId ? action.reason.includes(`(${providerId})`) : false
  ));
  if (!actions.length) return null;
  const latest = actions.filter(action => action.createdAt && Number.isFinite(Date.parse(action.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))[0];
  return <small className="latest-action" aria-live="polite">
    {latest ? <>Latest action added: <time dateTime={latest.createdAt}>{new Date(latest.createdAt!).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}</time></> : 'Action already added · creation time unavailable'}
  </small>;
}
