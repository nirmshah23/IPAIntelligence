// Keep saved assurance records available when the workspace branding changes.
export function readAssuranceStorage(category: string): string | null {
  const key = `arcwell-${category}-v1`;
  const current = localStorage.getItem(key);
  if (current !== null) return current;

  const suffix = `-${category}-v1`;
  const previousKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((candidate): candidate is string => candidate !== null && candidate.endsWith(suffix) && candidate !== key);
  if (previousKeys.length !== 1) return null;

  const saved = localStorage.getItem(previousKeys[0]);
  if (saved !== null) localStorage.setItem(key, saved);
  return saved;
}
