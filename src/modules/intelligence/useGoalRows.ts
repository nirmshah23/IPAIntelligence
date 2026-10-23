import { useEffect, useState } from 'react';

function readGoals(key: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set<string>(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set<string>();
  }
}

export function useGoalRows(screen: string, period: string) {
  const storageKey = `ipa-goals-${screen}-${period}`;
  const [added, setAdded] = useState<Set<string>>(() => readGoals(storageKey));

  useEffect(() => setAdded(readGoals(storageKey)), [storageKey]);

  const add = (rowId: string, createAction: () => boolean | void) => {
    if (createAction() === false) return;
    setAdded(current => {
      const next = new Set(current).add(rowId);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const refresh = () => {
    localStorage.removeItem(storageKey);
    setAdded(new Set());
  };

  return { has: (rowId: string) => added.has(rowId), add, refresh };
}
