import type { Action, Provider } from './types';

export const defaultDisenrollmentMinimum = 5;
export function disenrollmentPeriods(period: string) {
  const year = Number(period.slice(0, 4));
  return [period, ...[1, 2, 3].map(offset => String(year - offset))];
}

// Fictional membership snapshots: losses / membership at the start of each period.
export function disenrollmentMeasurements(provider: Provider, period: string) {
  const index = Number(provider.id.split('-')[1]) - 1;
  const cohort = Math.floor(index / 8);
  return disenrollmentPeriods(period).map((id, measurement) => {
    const year = Number(id.slice(0, 4));
    const startingMembers = Math.max(1, Math.round(provider.members * (1 + (2026 - year) * .08)));
    const quarter = id.includes('Q') ? Number(id.at(-1)) : 0;
    const targetRate = cohort % 7 < 2 ? 1.2 + (cohort % 4) * .5 + measurement * .3 + quarter * .1 : 4 + (cohort % 9) + measurement * .6;
    const lostMembers = Math.round(startingMembers * targetRate / 100);
    return { id, startingMembers, lostMembers, rate: lostMembers / startingMembers * 100 };
  });
}
export function isDisenrollmentFlagged(provider: Provider, period: string, minimum: number) {
  return disenrollmentMeasurements(provider, period).every(value => value.rate > minimum);
}

export function seedDisenrollmentActions(providers: Provider[]): Action[] {
  const flagged = providers.filter(provider => provider.type === 'Individual' && provider.members > 0 && isDisenrollmentFlagged(provider, '2026-Q1', defaultDisenrollmentMinimum)).slice(0, 6);
  const topics = ['Validate membership loss records', 'Review disenrollment reasons', 'Complete provider outreach', 'Agree membership monitoring plan'];
  return flagged.length ? Array.from({ length: 22 }, (_, index) => {
    const provider = flagged[index % flagged.length];
    const values = disenrollmentMeasurements(provider, '2026-Q1');
    return {
      id: `ACT-DIS-${String(index + 1).padStart(3, '0')}`, category: 'Disenrollments', providerId: provider.id,
      subject: `${topics[Math.floor(index / flagged.length)]}: ${provider.name}`,
      reason: `${provider.name} (${provider.id}) is above the 5% minimum in all four measurement periods.`,
      evidence: values.map(value => `${value.id}: ${value.lostMembers} lost / ${value.startingMembers} starting members (${value.rate.toFixed(2)}%)`).join('; '),
      owner: ['Maya Ortiz', 'Jordan Lee', 'Priya Shah'][index % 3], department: 'Provider Relations',
      priority: index % 3 === 0 ? 'High' : 'Medium', status: index % 3 === 0 ? 'Under Review' : 'New', approval: 'Pending',
      start: '2026-04-01', due: '2026-06-30', nextReview: '2026-04-30',
      expectedResult: 'Validate the four-period finding and document provider review and follow-up.',
    };
  }) : [];
}
