'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export type ProjectTemplateRecord = {
  id: string
  name: string
  description: string
  tasks: string[]
  active: boolean
}

type ProjectTemplateInput = {
  id?: string
  name: string
  description: string
  tasks: string[]
  active: boolean
}

function serializeTemplate(document: {
  id: number | string
  name?: null | string
  description?: null | string
  tasks?: null | { name?: null | string }[]
  active?: boolean | null
}): ProjectTemplateRecord {
  return {
    id: String(document.id),
    name: document.name || '',
    description: document.description || '',
    tasks: (document.tasks || []).map((task) => task.name?.trim() || '').filter(Boolean),
    active: document.active !== false,
  }
}

export async function listProjectTemplates(): Promise<ProjectTemplateRecord[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'project-templates',
    limit: 100,
    overrideAccess: false,
    sort: 'name',
  })
  return result.docs.map(serializeTemplate)
}

export async function saveProjectTemplate(input: ProjectTemplateInput): Promise<
  { ok: true; template: ProjectTemplateRecord } | { ok: false; error: string }
> {
  const name = input.name.trim()
  const description = input.description.trim()
  const tasks = input.tasks.map((task) => task.trim()).filter(Boolean)

  if (!name || name.length > 120) return { ok: false, error: 'Enter a template name of 120 characters or fewer.' }
  if (description.length > 500) return { ok: false, error: 'Keep the description to 500 characters or fewer.' }
  if (tasks.length > 20 || tasks.some((task) => task.length > 200)) {
    return { ok: false, error: 'Add up to 20 tasks, each no longer than 200 characters.' }
  }

  const payload = await getPayload({ config })
  const data = {
    name,
    description,
    tasks: tasks.map((task) => ({ name: task })),
    active: input.active,
  }
  const document = input.id
    ? await payload.update({ collection: 'project-templates', id: input.id, data, overrideAccess: false })
    : await payload.create({ collection: 'project-templates', data, overrideAccess: false })

  return { ok: true, template: serializeTemplate(document) }
}
