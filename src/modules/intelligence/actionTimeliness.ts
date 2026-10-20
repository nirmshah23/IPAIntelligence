export const timelinessBuckets = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Due today' },
  { id: 'next-seven-days', label: 'Due in the next 7 days' },
  { id: 'later', label: 'Due later' },
  { id: 'undated', label: 'No valid target date' },
] as const;

export function actionDateToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function actionTimeliness(due: string, today: string) {
  const parsed = new Date(`${due}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== due) return 'undated';
  if (due < today) return 'overdue';
  if (due === today) return 'today';
  const nextWeek = new Date(`${today}T00:00:00Z`);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  return due <= nextWeek.toISOString().slice(0, 10) ? 'next-seven-days' : 'later';
}
