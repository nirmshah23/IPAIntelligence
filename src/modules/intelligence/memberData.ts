import type { Provider, ProviderPeriodData } from './types';
const names = ['Alex Morgan', 'Jordan Lee', 'Taylor Rivera', 'Casey Patel', 'Riley Chen', 'Jamie Brooks', 'Avery Garcia', 'Morgan Kim', 'Cameron Davis', 'Sam Nguyen', 'Drew Wilson', 'Robin Shah'];
export const linesOfBusiness = ['Medicare Advantage', 'Commercial', 'Medicaid'];
export const plans = ['Cedarbridge Health', 'Meadowlight Health Plan', 'Harborleaf Health'];


export function getMembers(providers: Provider[], period: string, getPeriod: (provider: Provider, period: string) => ProviderPeriodData) {
  return providers.filter(p => p.type === 'Individual' && p.specialty === 'Primary Care').flatMap(provider => {
    const metrics = getPeriod(provider, period);
    const completed = Math.round(metrics.attributedMembers * metrics.preventiveCompliance / 100);
    const [year, quarter] = period.split('-Q').map(Number);
    return Array.from({ length: metrics.attributedMembers }, (_, index) => {
      const id = `DEMO-${provider.id}-${String(index + 1).padStart(4, '0')}`;
      const completedInPeriod = index < completed;
      const date = completedInPeriod ? `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-${String(1 + index % 28).padStart(2, '0')}` : index % 3 === 0 ? 'None recorded' : `${year - 1}-12-${String(1 + index % 28).padStart(2, '0')}`;
      const awvDates = date === 'None recorded' ? [] : [date, ...Array.from({ length: 2 + index % 3 }, (_, offset) => `${year - 2 - offset}-12-${String(1 + index % 28).padStart(2, '0')}`)];
      const periodStart = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
      const periodEnd = `${year}-${String(quarter * 3).padStart(2, '0')}-31`;
      const performed = awvDates.some(visit => visit >= periodStart && visit <= periodEnd);
      return { awvDates, lineOfBusiness: linesOfBusiness[index % 3], id, name: names[index % names.length], provider, plan: plans[index % 3], performed, flag: performed ? 'Complete' : date === 'None recorded' ? 'No AWV on record' : 'Prior-period AWV only', index };
    });
  });
}
export type Member = ReturnType<typeof getMembers>[number];
