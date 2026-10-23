export type ProjectTemplateRecord = {
  id: string
  name: string
  description: string
  tasks: string[]
  active: boolean
}

type ProjectTemplateInput = Omit<ProjectTemplateRecord, 'id'> & { id?: string }

export const PROJECT_TEMPLATES_KEY = 'ipa-project-templates-v1'

// Saved once on a new browser origin. Stable IDs and existing records are kept
// on later loads, including edits and inactive templates.
const seededTemplates: ProjectTemplateRecord[] = [
  {
    id: 'ipa-template-enrollments-v1', name: 'Enrollments', active: true,
    description: 'Coordinate enrollment growth, provider readiness, and member assignment follow-up.',
    tasks: ['Review enrollment baseline and target gaps', 'Validate provider capacity and panel availability', 'Coordinate enrollment outreach and payer follow-up', 'Reconcile member assignments and enrollment exceptions', 'Measure enrollment results and document closure'],
  },
  {
    id: 'ipa-template-disenrollments-v1', name: 'Disenrollments', active: true,
    description: 'Investigate membership losses and coordinate retention improvements.',
    tasks: ['Review disenrollment trends and reason codes', 'Validate affected provider and member cohorts', 'Identify service and access issues driving losses', 'Coordinate retention actions and accountable owners', 'Measure disenrollment changes and document outcomes'],
  },
  {
    id: 'ipa-template-preventive-compliance-v1', name: 'Preventive compliance', active: true,
    description: 'Close preventive care gaps through provider coordination and evidence review.',
    tasks: ['Review preventive measure baseline and open care gaps', 'Validate eligible populations and supporting evidence', 'Coordinate provider outreach and appointment availability', 'Track completed screenings and reconcile remaining gaps', 'Review compliance improvement and document follow-up'],
  },
  {
    id: 'ipa-template-network-adequacy-v1', name: 'Network adequacy', active: true,
    description: 'Assess network access gaps and coordinate provider capacity improvements.',
    tasks: ['Review access gaps by specialty and geography', 'Validate provider directory and accepting-member status', 'Assess appointment availability and capacity constraints', 'Coordinate recruitment or contracting for coverage gaps', 'Reassess network access and document remaining risks'],
  },
  {
    id: 'ipa-template-oon-referrals-v1', name: 'OON referrals', active: true,
    description: 'Analyze out-of-network referral drivers and improve appropriate in-network access.',
    tasks: ['Review out-of-network referral volume and specialties', 'Validate referral reasons and in-network alternatives', 'Identify access barriers and provider education needs', 'Coordinate referral routing and network follow-up', 'Measure referral trends and verify access is maintained'],
  },
  {
    id: 'ipa-template-facilities-v1', name: 'Facilities', active: true,
    description: 'Review facility readiness, coverage, and operational follow-up.',
    tasks: ['Review facility roster and service coverage gaps', 'Validate facility credentials and directory details', 'Assess capacity and operational readiness', 'Coordinate facility remediation and accountable owners', 'Verify readiness evidence and document final review'],
  },
]

function isTemplate(value: unknown): value is ProjectTemplateRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && !!item.id &&
    typeof item.name === 'string' && typeof item.description === 'string' &&
    typeof item.active === 'boolean' && Array.isArray(item.tasks) &&
    item.tasks.every(task => typeof task === 'string')
}

export async function listProjectTemplates(): Promise<ProjectTemplateRecord[]> {
  const saved = window.localStorage.getItem(PROJECT_TEMPLATES_KEY)
  if (saved === null) {
    try {
      window.localStorage.setItem(PROJECT_TEMPLATES_KEY, JSON.stringify(seededTemplates))
    } catch {
      throw new Error('Could not save the starter templates. Browser storage may be full or blocked. Allow browser storage or free space, then reload.')
    }
    return [...seededTemplates].sort((a, b) => a.name.localeCompare(b.name))
  }
  const records: unknown = JSON.parse(saved)
  if (!Array.isArray(records) || !records.every(isTemplate)) {
    throw new Error('Saved project templates could not be read. Existing browser data has been preserved.')
  }
  return records.sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveProjectTemplate(input: ProjectTemplateInput): Promise<
  { ok: true; template: ProjectTemplateRecord } | { ok: false; error: string }
> {
  const name = input.name.trim()
  const description = input.description.trim()
  const tasks = input.tasks.map(task => task.trim()).filter(Boolean)
  if (!name || name.length > 120) return { ok: false, error: 'Enter a template name of 120 characters or fewer.' }
  if (description.length > 500) return { ok: false, error: 'Keep the description to 500 characters or fewer.' }
  if (tasks.length > 20 || tasks.some(task => task.length > 200)) {
    return { ok: false, error: 'Add up to 20 tasks, each no longer than 200 characters.' }
  }

  try {
    const records = await listProjectTemplates()
    if (input.id && !records.some(record => record.id === input.id)) {
      return { ok: false, error: 'This template no longer exists. Reload the page before saving.' }
    }
    const template = { id: input.id || crypto.randomUUID(), name, description, tasks, active: input.active }
    window.localStorage.setItem(PROJECT_TEMPLATES_KEY, JSON.stringify([
      ...records.filter(record => record.id !== template.id), template,
    ]))
    return { ok: true, template }
  } catch {
    return { ok: false, error: 'Could not save the template. Browser storage may be full, blocked, or contain unreadable data. Existing data has been preserved.' }
  }
}
