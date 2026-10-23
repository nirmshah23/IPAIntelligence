import { expect, test } from '@playwright/test'

const templatesKey = 'ipa-project-templates-v1'

test('six starter templates persist, retain edits, and provide project tasks', async ({ page }) => {
  await page.goto('/#/relations/project-templates')
  const names = ['Enrollments', 'Disenrollments', 'Preventive compliance', 'Network adequacy', 'OON referrals', 'Facilities']
  for (const name of names) {
    await expect(page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) })).toBeVisible()
  }
  const seeded = await page.evaluate(key => localStorage.getItem(key), templatesKey)
  expect(JSON.parse(seeded!)).toHaveLength(6)
  await page.reload()
  expect(await page.evaluate(key => localStorage.getItem(key), templatesKey)).toBe(seeded)
  await page.getByRole('row').filter({ has: page.getByText('Enrollments', { exact: true }) }).getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Tasks (one per line)').fill('Review saved enrollment baseline\nCoordinate provider follow-up')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.locator('.modal')).toHaveCount(0)
  await page.reload()
  await page.getByRole('navigation').getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: /Create project/i }).first().click()
  for (const name of names) await expect(page.getByRole('option', { name, exact: true })).toBeAttached()
  await page.locator('.modal select').filter({ has: page.getByRole('option', { name: 'Enrollments', exact: true }) }).selectOption({ label: 'Enrollments' })
  await expect(page.locator('.review-tasks')).toContainText('Review saved enrollment baseline')
  await expect(page.locator('.review-tasks')).toContainText('Coordinate provider follow-up')
})

test('templates validate, persist through reload, update, and remain available for projects', async ({ page }) => {
  const errors: string[] = []
  const mutations: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()) })
  await page.goto('/#/relations/project-templates')
  await page.getByRole('button', { name: 'Create template', exact: true }).click()
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.locator('.modal').getByRole('alert')).toContainText('Enter a template name')
  await page.getByLabel('Template name').fill('Browser persistence test')
  await page.getByLabel('Description', { exact: true }).fill('Saved without a backend')
  await page.getByLabel('Tasks (one per line)').fill('Review baseline\nCoordinate follow-up')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Browser persistence test', exact: false })).toBeVisible()
  const savedId = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).find((item: { name: string }) => item.name.includes('browser template') || item.name === 'Browser persistence test').id, templatesKey)
  await page.reload()
  const row = page.getByRole('row').filter({ hasText: 'Browser persistence test' })
  await expect(row).toContainText('Saved without a backend')
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Tasks (one per line)')).toHaveValue('Review baseline\nCoordinate follow-up')
  await page.getByLabel('Template name').fill('Updated browser template')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: 'Updated browser template' })).toBeVisible()
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).find((item: { name: string }) => item.name.includes('browser template') || item.name === 'Browser persistence test').id, templatesKey)).toBe(savedId)
  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: /Create project/i }).first().click()
  await expect(page.getByRole('option', { name: 'Updated browser template' })).toBeAttached()
  expect(errors).toEqual([])
  expect(mutations).toEqual([])
})

test('failed storage writes show an error and keep the draft open', async ({ page }) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError')
      return original.call(this, name, value)
    }
  }, templatesKey)
  await page.goto('/#/relations/project-templates')
  await expect(page.locator('main > [role="alert"]')).toContainText('Could not save the starter templates')
  await page.getByRole('button', { name: 'Create template', exact: true }).click()
  await page.getByLabel('Template name').fill('Unsaved template')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.locator('.modal').getByRole('alert')).toContainText('Could not save')
  await expect(page.getByLabel('Template name')).toHaveValue('Unsaved template')
  expect(await page.evaluate(key => localStorage.getItem(key), templatesKey)).toBeNull()
})

test('unreadable stored templates are not silently overwritten', async ({ page }) => {
  await page.addInitScript(key => { localStorage.setItem(key, '{broken json') }, templatesKey)
  await page.goto('/#/relations/project-templates')
  await page.getByRole('button', { name: 'Create template', exact: true }).click()
  await page.getByLabel('Template name').fill('New template')
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page.locator('.modal').getByRole('alert')).toContainText('Existing data has been preserved')
  expect(await page.evaluate(key => localStorage.getItem(key), templatesKey)).toBe('{broken json')
})

test('former backend endpoints are removed', async ({ request }) => {
  for (const path of ['/admin', '/api/project-templates', '/missing-page']) {
    expect((await request.get(path)).status()).toBe(404)
  }
})

test('unknown paths return 404 and the document entry loads', async ({ page, request }) => {
  expect((await request.get('/missing-page')).status()).toBe(404)
  await page.goto('/index.html')
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible()
})
