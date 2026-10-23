import type { Provider } from './types';

export const defaultAcceptableEnrollmentRate = 5;

export function enrollmentPeriods(period: string) {
  const year = Number(period.slice(0, 4));
  return [period, ...[1, 2, 3].map(offset => String(year - offset))];
}

// Fictional membership snapshots: newly joined members / membership at the start of each period.
export function enrollmentMeasurements(provider: Provider, period: string) {
  const index = Number(provider.id.split('-')[1]) - 1;
  const cohort = Math.floor(index / 8);
  return enrollmentPeriods(period).map((id, measurement) => {
    const year = Number(id.slice(0, 4));
    const startingMembers = Math.max(1, Math.round(provider.members * (1 - (2026 - year) * .04)));
    const quarter = id.includes('Q') ? Number(id.at(-1)) : 0;
    const targetRate = cohort % 6 < 2 ? 1.5 + (cohort % 3) * .6 + measurement * .25 : 5.5 + (cohort % 8) * .8 + measurement * .35 + quarter * .1;
    const joinedMembers = Math.round(startingMembers * targetRate / 100);
    return { id, startingMembers, joinedMembers, rate: joinedMembers / startingMembers * 100 };
  });
}

export function isEnrollmentFlagged(provider: Provider, period: string, acceptableRate: number) {
  return enrollmentMeasurements(provider, period).every(value => value.rate < acceptableRate);
}
