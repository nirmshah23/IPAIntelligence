import { test, expect } from '@playwright/test';

test('Provider Relations opens the standalone mobile demo and keeps the workspace intact', async ({ page, context }) => {
  await page.goto('/#/relations/workplans');
  const link = page.getByRole('link', { name: 'Mobile app (opens in a new tab)' });
  const [mobile] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await expect(mobile).toHaveURL(/\/ProviderRelationsMobileApp\/index.html$/);
  await expect(mobile.getByRole('heading', { name: 'Good morning, Jordan' })).toBeVisible();
  await expect(page).toHaveURL(/#\/relations\/workplans$/);
  await mobile.setViewportSize({ width: 390, height: 844 });
  await expect(mobile.locator('.phone')).toHaveCSS('max-width', '430px');
  expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await mobile.getByRole('button', { name: 'Start visit', exact: true }).click();
  await mobile.getByRole('button', { name: 'Begin visit' }).click();
  await expect(mobile.getByRole('button', { name: 'Review visit' })).toBeDisabled();
  await expect(mobile.getByText('Complete all required fields to continue.')).toBeVisible();
  await mobile.getByLabel('Attendees').fill('Jordan Lee, demo representative');
  await mobile.getByLabel('Discussion notes').fill('Reviewed fictional outreach workflow.');
  await mobile.getByLabel('Description', { exact: true }).fill('Send demo workflow');
  await mobile.getByRole('button', { name: 'Review visit' }).click();
  await mobile.getByRole('button', { name: 'Submit visit report' }).click();
  await expect(mobile.getByRole('heading', { name: 'Visit captured' })).toBeVisible();
  await mobile.reload();
  await expect(mobile.getByRole('heading', { name: 'Good morning, Jordan' })).toBeVisible();
  await expect(mobile.getByText('Changes last only in this tab and reset on reload.', { exact: false })).toBeVisible();
  await mobile.getByRole('button', { name: 'Providers', exact: true }).click();
  await mobile.getByPlaceholder('Search name or specialty').fill('Maya');
  await mobile.getByRole('button', { name: /Dr. Maya Patel/ }).click();
  await expect(mobile.getByRole('heading', { name: 'Dr. Maya Patel' })).toBeVisible();
  await mobile.getByRole('link', { name: 'Back to IPA Workspace' }).click();
  await expect(mobile).toHaveURL(/#\/relations\/workplans$/);
  await expect(mobile.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
  for (const path of ['/missing-page', '/ProviderRelationsMobileApp/missing-page']) {
    expect((await page.request.get(path)).status()).toBe(404);
  }
});
