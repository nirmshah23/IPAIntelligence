import { expect, test } from '@playwright/test';

test('member access gaps, goals, and workflow counts agree and persist', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/intelligence/membership');
  await expect(page.getByRole('columnheader')).toHaveText(['Member', 'Assigned PCP', 'Health plan', 'AWV status', 'Area access']);
  const first = page.locator('tbody tr:visible').first();
  const memberId = await first.locator('td').first().locator('small').innerText();
  const pcp = (await first.locator('td').nth(4).locator('.badge').innerText()).replace('PCP: ', '');
  await first.getByRole('button').click();
  const accessDetails = page.getByRole('region', { name: 'Provider access', exact: true });
  await expect(accessDetails).toContainText(`PCP within 15 miles${pcp}`);
  for (const specialty of ['Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology', 'Orthopedics', 'Behavioral Health']) {
    await expect(accessDetails).toContainText(`${specialty} within 30 miles`);
  }
  await page.getByRole('button', { name: 'Area Adequacy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Area Adequacy', exact: true })).toBeVisible();
  const seeded = await page.evaluate(() => JSON.parse(localStorage.getItem('ipa-actions')!).filter((a: { category: string }) => a.category === 'Area Adequacy'));
  expect(seeded.length).toBeGreaterThanOrEqual(4);
  expect(new Set(seeded.map((a: { memberId: string }) => a.memberId)).size).toBe(4);
  expect(new Set(seeded.map((a: { specialty: string }) => a.specialty)).size).toBeGreaterThan(1);
  await page.getByRole('combobox', { name: /^Goal status/ }).selectOption('Needs goal');
  const gapRow = page.locator('tbody tr:visible').first();
  const targetMemberId = await gapRow.locator('td').nth(1).innerText();
  const specialty = await gapRow.locator('td').nth(3).innerText();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('ipa-actions')!).length);
  await gapRow.getByRole('button', { name: 'Add goal', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ipa-actions')!).length)).toBe(before + 1);
  await page.getByRole('combobox', { name: /^Goal status/ }).selectOption('Goal added');
  await page.getByLabel('Search members', { exact: true }).fill(targetMemberId);
  const savedRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: specialty, exact: true }) }).filter({ hasText: targetMemberId });
  await expect(savedRow.getByRole('button', { name: 'Goal added', exact: true })).toBeDisabled();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ipa-actions')!));
  expect(saved).toHaveLength(before + 1);
  expect(saved.filter((a: { memberId?: string; specialty?: string }) => a.memberId === targetMemberId && a.specialty === (specialty === 'PCP' ? 'Primary Care' : specialty))).toHaveLength(1);
  await page.getByRole('button', { name: 'Workflows', exact: true }).click();
  const dashboard = page.getByRole('region', { name: 'Membership workflow', exact: true });
  await dashboard.getByRole('tab', { name: 'Goals by type', exact: true }).click();
  const areaRow = dashboard.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Area Adequacy', exact: true }) });
  await expect(areaRow.getByRole('button')).toHaveText(String(seeded.length + 1));
  const active = saved.filter((a: { status: string }) => !['Completed', 'Cancelled', 'Dismissed'].includes(a.status)).length;
  await expect(dashboard.getByRole('button', { name: 'View all active goals', exact: true })).toHaveText(String(active));
  await areaRow.getByRole('button').click();
  await expect(page.getByRole('heading', { name: 'Goal Center', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr:visible')).toHaveCount(seeded.length + 1);
  expect(errors).toEqual([]);
  expect((await page.request.get('/not-a-real-area-route')).status()).toBe(404);
  expect(memberId).toBeTruthy();
});

test('failed goal save remains actionable and never adds a goal', async ({ page }) => {
  await page.goto('/#/intelligence/area-adequacy');
  await expect(page.getByRole('heading', { name: 'Area Adequacy', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /^Goal status/ }).selectOption('Needs goal');
  const before = await page.evaluate(() => localStorage.getItem('ipa-actions'));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'ipa-actions') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  const row = page.locator('tbody tr:visible').first();
  await row.getByRole('button', { name: 'Add goal', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Goal could not be saved');
  await expect(row.getByRole('button', { name: 'Add goal', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('ipa-actions'))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
