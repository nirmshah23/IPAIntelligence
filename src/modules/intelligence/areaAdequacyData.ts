import type { Action, Provider } from './types';
import type { Member } from './memberData';

export const areaGoalTitle = 'Ensure Area Adequacy';
const baselineSpecialties = ['Primary Care', 'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology', 'Orthopedics', 'Behavioral Health'];
export function accessSpecialties(providers: Provider[]) {
  return [...new Set([...baselineSpecialties, ...providers.filter(p => p.type === 'Individual').map(p => p.specialty)])];
}
export const specialtyLabel = (specialty: string) => specialty === 'Primary Care' ? 'PCP' : specialty;
export function memberAccess(member: Member, providers: Provider[], specialties = accessSpecialties(providers)) {
  return specialties.map(specialty => {
    const radius = specialty === 'Primary Care' ? 15 : 30;
    const hash = [...`${member.id}:${specialty}`].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
    const hasProvider = providers.some(p => p.type === 'Individual' && p.specialty === specialty && p.status === 'Active' && p.network === 'In Network');
    const distance = hasProvider ? (hash % (radius * 14) + 10) / 10 : null;
    return { specialty, radius, distance, available: distance !== null && distance <= radius };
  });
}
export type AccessGap = ReturnType<typeof memberAccess>[number] & { member: Member };
export const areaGoalSubject = (gap: AccessGap) => `${gap.member.name} (${gap.member.id}) - ${specialtyLabel(gap.specialty)}`;
export function makeAreaGoal(gap: AccessGap, id: string, period: string): Action {
  const due = new Date(); due.setDate(due.getDate() + 21);
  return { id, category: 'Area Adequacy', goalDescription: areaGoalTitle, subject: areaGoalSubject(gap), memberId: gap.member.id, specialty: gap.specialty,
    reason: `${gap.member.name} (${gap.member.id}), ${gap.member.provider.county}: no ${specialtyLabel(gap.specialty)} within ${gap.radius} miles. ${gap.distance === null ? 'No active in-network provider in this specialty.' : `Fictional nearest provider: ${gap.distance.toFixed(1)} miles.`}`,
    evidence: `Fictional member access assessment | ${period} | radius ${gap.radius} miles`, expectedResult: `Ensure ${specialtyLabel(gap.specialty)} access within ${gap.radius} miles for this member.`,
    owner: 'Unassigned', department: 'Provider Relations', priority: gap.specialty === 'Primary Care' ? 'High' : 'Medium', status: 'New', approval: 'Pending', due: due.toISOString().slice(0, 10), createdAt: new Date().toISOString() };
}
export function seedAreaGoals(members: Member[], providers: Provider[], period: string) {
  const specialties = accessSpecialties(providers);
  const seeds: Action[] = [];
  let memberCount = 0;
  for (const member of members) {
    const gaps = memberAccess(member, providers, specialties).filter(access => !access.available).slice(0, 2);
    if (!gaps.length) continue;
    for (const access of gaps) seeds.push({ ...makeAreaGoal({ ...access, member }, `ACT-AREA-SEED-${member.id}-${access.specialty.replaceAll(' ', '-')}`, period), owner: ['Maya Ortiz', 'Jordan Lee', 'Priya Shah'][memberCount % 3], status: memberCount % 2 ? 'Under Review' : 'New' });
    if (++memberCount === 4) break;
  }
  return seeds;
}
