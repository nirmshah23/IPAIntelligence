import type { Action, Provider, WorkPlan } from './types';

const providerTopics = [
  ['Provider Education', 'Improve preventive-care gap closure', 'Care-gap review identified incomplete preventive screenings', 'Close at least 85% of assigned care gaps'],
  ['Directory Validation', 'Validate provider directory details', 'Directory attestation has not been returned', 'Verify contact details, office hours, and panel availability'],
  ['Recruitment', 'Expand specialist appointment access', 'Appointment availability exceeds the access target', 'Add two weekly appointment slots'],
  ['Referral Optimization', 'Improve in-network referral routing', 'Referral review identified avoidable out-of-network leakage', 'Reduce avoidable out-of-network referrals by 15%'],
  ['Credentialing', 'Complete recredentialing evidence review', 'Recredentialing packet requires updated source verification', 'Complete verification and committee review'],
] as const;
const facilityTopics = [
  ['Facility Improvement', 'Improve discharge follow-up coordination', 'Discharge review identified missing follow-up appointments', 'Document follow-up within seven days for 90% of discharges'],
  ['Facility Quality', 'Improve patient experience follow-up', 'Patient survey responses show communication gaps', 'Increase patient experience score by five points'],
  ['Facility Improvement', 'Reduce avoidable readmissions', 'Utilization review identified repeat admissions requiring review', 'Reduce avoidable readmissions by 10%'],
  ['Directory Validation', 'Validate facility services and access', 'Facility service roster requires current attestation', 'Verify service lines, access hours, and referral contacts'],
  ['DOFR Review', 'Review facility utilization and financial risk', 'Facility expenditure trends require financial and clinical review', 'Deliver an approved utilization and risk recommendation'],
] as const;

export function seedActionCenter(baseActions: Action[], basePlans: WorkPlan[], providers: Provider[]) {
  const individuals = providers.filter(provider => provider.type === 'Individual');
  const facilities = providers.filter(provider => provider.type === 'Facility');
  const actions = [...baseActions];
  const workPlans = [...basePlans];
  const states: Action['status'][] = ['New', 'Under Review', 'Approved', 'In Execution', 'On Hold', 'Completed'];
  for (let i = 0; i < 100 - baseActions.length; i++) {
    const facility = i % 2 === 1;
    const cohortIndex = Math.floor(i / 2);
    const entity = (facility ? facilities : individuals)[cohortIndex];
    const [category, title, reason, expectedResult] = (facility ? facilityTopics : providerTopics)[cohortIndex % 5];
    const status = states[Math.floor(i / 2) % states.length];
    const linked = ['In Execution', 'On Hold', 'Completed'].includes(status);
    const id = `ACT-${1042 + baseActions.length + i}`;
    const owner = ['Maya Ortiz', 'Jordan Lee', 'Priya Shah', 'Evan Brooks'][cohortIndex % 4];
    const department = category === 'DOFR Review' ? 'Finance' : category === 'Directory Validation' || category === 'Recruitment' ? 'Provider Relations' : 'Quality Improvement';
    const due = `2026-${String(5 + cohortIndex % 8).padStart(2, '0')}-${String(10 + cohortIndex % 18).padStart(2, '0')}`;
    const action: Action = {
      id, category, subject: `${title}: ${entity.name}`, reason: `${reason} for ${entity.name} (${entity.id}), ${entity.county} County.`,
      owner, department, priority: (['High', 'Medium', 'Low'] as const)[cohortIndex % 3],
      status, approval: ['New', 'Under Review'].includes(status) ? 'Pending' : 'Approved',
      start: '2026-04-01', due, nextReview: '2026-04-30', expectedResult,
      evidence: `${entity.type} ${entity.id} | ${entity.specialty} | Q1 2026 ${facility ? 'facility quality and utilization' : 'provider performance'} review`,
      ...(linked ? { workPlanId: `WP-${2005 + i}` } : {}),
    };
    actions.push(action);
    if (linked) {
      const completed = status === 'Completed';
      workPlans.push({
        id: action.workPlanId!, actionId: id, name: action.subject, objective: title, rationale: action.reason,
        expectedResult, successCriteria: `${expectedResult}; supporting evidence reviewed and approved.`,
        owner, department, supporting: ['Provider Relations', 'Analytics'], sponsor: 'Dr. Lena Park', priority: action.priority,
        start: action.start!, due, nextReview: action.nextReview!, lastUpdated: '2026-04-15',
        status: completed ? 'Completed' : status === 'On Hold' ? 'On Hold' : 'In Progress',
        health: status === 'On Hold' ? 'Blocked' : 'On Track', progress: completed ? 100 : status === 'On Hold' ? 33 : 67,
        template: facility ? 'Facility Improvement' : 'Provider Performance Improvement',
        tasks: ['Validate baseline and evidence', 'Coordinate improvement activities', 'Review results and approve closure'].map((name, index) => ({
          id: `${id}-T${index + 1}`, name, owner, department, due,
          status: completed || index === 0 || (status === 'In Execution' && index === 1) ? 'Completed' : status === 'On Hold' ? 'Blocked' : 'In Progress',
        })),
        kpis: [], risks: status === 'On Hold' ? [{ id: `${id}-R1`, type: 'Blocker', issue: 'Awaiting source evidence', impact: 'Review cannot proceed until evidence is supplied', severity: 'Medium', owner, due, status: 'Open' }] : [],
        activity: [{ date: '2026-04-15', text: `Work plan linked to ${id}`, by: owner }],
      });
    }
  }
  return { actions, workPlans };
}

export function mergeActionCenterSeed<T extends { id: string }>(stored: T[], seeds: T[]): T[] {
  const existing = new Set(stored.map(item => item.id));
  return [...stored.map(item => ({ ...seeds.find(seed => seed.id === item.id), ...item })), ...seeds.filter(seed => !existing.has(seed.id))];
}
