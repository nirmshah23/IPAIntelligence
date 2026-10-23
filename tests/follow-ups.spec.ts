import { test, expect } from '@playwright/test';
test('follow-ups persist and log activity, with recoverable save errors', async ({ page }) => {
  await page.goto('/#/relations/workplans');
  await page.locator('tbody tr:visible').first().click();
  await page.getByRole('button', { name: 'Follow-ups', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Task follow-ups' });
  await expect(panel.getByRole('columnheader', { name: 'Linked task', exact: true })).toBeVisible();
  await expect(panel.getByRole('combobox', { name: 'Filter by task' })).toHaveValue('');
  await panel.getByRole('button', { name: 'Add follow-up', exact: true }).click();
  await panel.getByRole('button', { name: 'Save follow-up' }).click();
  await expect(panel.getByRole('alert')).toContainText('Enter follow-up details');
  await page.getByLabel('Follow-up details').fill('Demo outreach follow-up');
  await panel.getByRole('button', { name: 'Save follow-up' }).click();
  await expect(panel.getByRole('status')).toContainText('added');
  await panel.getByRole('button', { name: 'Edit follow-up: Demo outreach follow-up', exact: true }).click();
  await page.getByLabel('Follow-up details').fill('Updated demo outreach');
  await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if(key === 'ipa-work-plans') throw new Error('full'); return original.call(this,key,value); }; });
  await panel.getByRole('button', { name: 'Save follow-up' }).click();
  await expect(panel.getByRole('alert')).toContainText('Could not save');
  await expect(page.getByLabel('Follow-up details')).toHaveValue('Updated demo outreach');
  await page.reload();
  await page.getByRole("button", { name: /Back to projects/ }).click();
  await page.locator('tbody tr:visible').first().click();
  await page.getByRole('button', { name: 'Follow-ups', exact: true }).click();
  await panel.getByRole('button', { name: 'Edit follow-up: Demo outreach follow-up', exact: true }).click();
  await page.getByLabel('Follow-up details').fill('Updated demo outreach');
  await panel.getByRole('button', { name: 'Save follow-up' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.activity-feed')).toContainText('Follow-up updated');
  await expect(page.locator('.activity-feed')).toContainText('Follow-up added');
  await page.reload();
  await page.getByRole("button", { name: /Back to projects/ }).click();
  await page.locator('tbody tr:visible').first().click();
  await expect(page.locator('.activity-feed')).toContainText('Updated demo outreach');
  for (const path of ['/missing-page', '/admin']) { const response = await page.request.get(path); expect(response.status()).toBe(404); }
});


