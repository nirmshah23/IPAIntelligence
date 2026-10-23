import { test, expect } from "@playwright/test"

test('compact project cards and every mobile screen scroll inside the phone', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 620 })
  await page.goto('/ProviderRelationsMobileApp/index.html')
  const viewport = page.getByRole('region', { name: 'Mobile screen', exact: true })
  const cards = page.getByRole('region', { name: 'Active projects' }).getByRole('button')
  await expect(cards).toHaveCount(4)
  for (const card of await cards.all()) {
    expect((await card.boundingBox())!.height).toBeLessThan(160)
    await expect(card).not.toContainText('Project owner')
    await expect(card).not.toContainText('Source goal')
  }
  const checkScroll = async () => {
    await expect(viewport).toHaveCSS('overflow-y', 'auto')
    const bounds = await viewport.boundingBox()
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual((page.viewportSize()!.height))
    await viewport.hover({ position: { x: 30, y: 100 } })
    await page.mouse.wheel(0, 900)
    const canScroll = await viewport.evaluate(element => element.scrollHeight > element.clientHeight)
    if (canScroll) await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  }
  await checkScroll()
  await viewport.evaluate(element => element.scrollTo(0, 200))
  await page.screenshot({ path: testInfo.outputPath('compact-projects-mobile.png') })
  const nav = page.locator('.bottom-nav')
  for (const name of ['My Tasks', 'Visits', 'Providers', 'Profile', 'Home']) {
    await nav.getByRole('button', { name, exact: true }).click()
    await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBe(0)
    await checkScroll()
    await expect(nav.getByRole('button', { name, exact: true })).toBeInViewport()
  }
  await cards.first().click()
  await checkScroll()
  for (const name of ['Tasks', 'Follow-ups', 'Outcomes', 'Risks & Blockers', 'Overview']) {
    await page.getByRole('tab', { name, exact: true }).click()
    await checkScroll()
  }
  await page.getByRole('button', { name: 'Edit project', exact: true }).click()
  await page.getByLabel('Sponsor', { exact: true }).fill('Demo sponsor')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Changes saved for this mobile session.')
  await page.setViewportSize({ width: 1280, height: 800 })
  await checkScroll()
  await page.screenshot({ path: testInfo.outputPath('project-scroll-desktop.png') })
});

test("mobile projects edit every section independently and reset on reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/#/relations/workplans")
  const storageBefore = await page.evaluate(() => JSON.stringify(localStorage))
  await page.goto("/ProviderRelationsMobileApp/index.html")
  await expect(page.getByRole('heading', { name: 'Active projects' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Projects', exact: true })).toHaveCount(0)
  await page
    .getByRole("region", { name: "Active projects" }).getByRole("button", { name: /Improve annual wellness visit compliance/ })
    .click()
  await page.getByRole("button", { name: "Edit project", exact: true }).click()
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Mobile project edited")
  await page.getByLabel("Progress (%)", { exact: true }).fill("150")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("alert")).toContainText(
    "Progress must be between 0 and 100",
  )
  await page.getByLabel("Progress (%)", { exact: true }).fill("55")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(
    page.getByRole("heading", { name: "Mobile project edited" }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Tasks", exact: true }).click()
  await page
    .getByRole("button", { name: "Edit task", exact: true })
    .first()
    .click()
  await page.getByLabel("Task name", { exact: true }).fill("Mobile task edited")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(
    page.getByRole("heading", { name: "Mobile task edited" }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Follow-ups", exact: true }).click()
  await page.getByRole("button", { name: "Add follow-up", exact: true }).click()
  await page.getByLabel("Follow-up details").fill("Mobile follow-up added")
  await page.getByLabel("Follow-up type").selectOption("Progress Update")
  await page.getByRole("button", { name: "Save changes" }).click()
  await page
    .getByRole("button", { name: "Edit follow-up", exact: true })
    .last()
    .click()
  await page.getByLabel("Follow-up details").fill("Mobile follow-up edited")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(
    page.getByRole("heading", { name: "Mobile follow-up edited" }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Outcomes", exact: true }).click()
  await page.getByRole("button", { name: "Edit outcome", exact: true }).click()
  await page.getByLabel("Actual", { exact: true }).fill("101")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("alert")).toContainText("Percentage values")
  await page.getByLabel("Actual", { exact: true }).fill("80")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(
    page.getByText("80% / 82% · On Track", { exact: true }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Risks & Blockers", exact: true }).click()
  await page.getByRole("button", { name: "Add issue", exact: true }).click()
  await page.getByLabel("Type", { exact: true }).selectOption("Blocker")
  await page.getByLabel("Issue", { exact: true }).fill("Mobile blocker")
  await page.getByLabel("Impact", { exact: true }).fill("Demo delay")
  await page.getByRole("button", { name: "Save changes" }).click()
  await page.getByRole("button", { name: "Edit issue", exact: true }).click()
  await page.getByLabel("Status", { exact: true }).selectOption("Resolved")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(
    page.getByText("Blocker · Medium · Resolved", { exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Active projects" }).getByRole("button", { name: /Mobile project edited/ }),
  ).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(
    storageBefore,
  )
  await page.reload()
  await expect(
    page.getByRole("region", { name: "Active projects" }).getByRole("button", {
      name: /Improve annual wellness visit compliance/,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Active projects" }).getByRole("button", { name: /Mobile project edited/ }),
  ).toHaveCount(0)
})

test('project tasks, follow-ups and visits share the existing mobile workflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ProviderRelationsMobileApp/index.html')
  await page.getByRole('region', { name: 'Active projects' }).getByRole('button', { name: /Improve annual wellness visit compliance/ }).click()
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Add task', exact: true }).click()
  await page.getByLabel('Task name', { exact: true }).fill('Integrated outreach task')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  const projectCard = page.getByRole('region', { name: 'Active projects' }).getByRole('button', { name: /Improve annual wellness visit compliance/ })
  await expect(projectCard).toContainText('25% complete')
  await page.screenshot({ path: testInfo.outputPath('active-projects.png'), fullPage: true })
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click()
  await page.getByPlaceholder('Search tasks, projects or owners').fill('Integrated outreach task')
  await page.getByRole('button', { name: /Integrated outreach task/ }).click()
  await expect(page.getByRole('heading', { name: 'Integrated outreach task' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit task', exact: true }).click()
  await page.getByLabel('Task name', { exact: true }).fill('Renamed project task')
  await page.getByLabel('Status', { exact: true }).selectOption('Awaiting Review')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Renamed project task' })).toBeVisible()
  await expect(page.getByText('Awaiting Review', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
  await page.getByRole('button', { name: 'Improve annual wellness visit compliance', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Go back', exact: true }).click()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Active projects' }).getByRole('button', { name: /Improve annual wellness visit compliance/ })).toContainText('50% complete')
  await page.getByRole('button', { name: 'Start visit', exact: true }).click()
  await expect(page.getByText('Complete provider outreach', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Begin visit' }).click()
  await page.getByLabel('Attendees').fill('Demo office manager')
  await page.getByLabel('Discussion notes').fill('Fictional outreach plan agreed')
  await page.getByLabel('Description', { exact: true }).fill('Send integrated visit follow-up')
  await page.getByRole('button', { name: 'Review visit' }).click()
  await page.getByRole('button', { name: 'Submit visit report' }).click()
  await page.getByRole('button', { name: 'Return home' }).click()
  await page.getByRole('button', { name: /Follow-ups/ }).first().click()
  await expect(page.getByRole('heading', { name: /Send integrated visit follow-up/ })).toBeVisible()
  await page.getByRole('button', { name: 'Manage follow-up', exact: true }).last().click()
  await expect(page.getByRole('tab', { name: 'Follow-ups', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: /Send integrated visit follow-up/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test("Provider Relations opens the standalone mobile demo and keeps the workspace intact", async ({
  page,
  context,
}) => {
  await page.goto("/#/relations/workplans")
  const link = page.getByRole("link", {
    name: "Mobile app (opens in a new tab)",
  })
  const [mobile] = await Promise.all([
    context.waitForEvent("page"),
    link.click(),
  ])
  await expect(mobile).toHaveURL(/\/ProviderRelationsMobileApp\/index.html$/)
  await expect(
    mobile.getByRole("heading", { name: "Good morning, Jordan" }),
  ).toBeVisible()
  await expect(page).toHaveURL(/#\/relations\/workplans$/)
  await mobile.setViewportSize({ width: 390, height: 844 })
  await expect(mobile.locator(".phone")).toHaveCSS("max-width", "430px")
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await mobile.getByRole("button", { name: "Start visit", exact: true }).click()
  await mobile.getByRole("button", { name: "Begin visit" }).click()
  await expect(
    mobile.getByRole("button", { name: "Review visit" }),
  ).toBeDisabled()
  await expect(
    mobile.getByText("Complete all required fields to continue."),
  ).toBeVisible()
  await mobile.getByLabel("Attendees").fill("Jordan Lee, demo representative")
  await mobile
    .getByLabel("Discussion notes")
    .fill("Reviewed fictional outreach workflow.")
  await mobile
    .getByLabel("Description", { exact: true })
    .fill("Send demo workflow")
  await mobile.getByRole("button", { name: "Review visit" }).click()
  await mobile.getByRole("button", { name: "Submit visit report" }).click()
  await expect(
    mobile.getByRole("heading", { name: "Visit captured" }),
  ).toBeVisible()
  await mobile.reload()
  await expect(
    mobile.getByRole("heading", { name: "Good morning, Jordan" }),
  ).toBeVisible()
  await expect(
    mobile.getByText("Changes reset on reload", {
      exact: false,
    }),
  ).toBeVisible()
  await mobile.getByRole("button", { name: "Providers", exact: true }).click()
  await mobile.getByPlaceholder("Search name or specialty").fill("Maya")
  await mobile.getByRole("button", { name: /Dr. Maya Patel/ }).click()
  await expect(
    mobile.getByRole("heading", { name: "Dr. Maya Patel" }),
  ).toBeVisible()
  await mobile.getByRole("link", { name: "Back to IPA Workspace" }).click()
  await expect(mobile).toHaveURL(/#\/relations\/workplans$/)
  await expect(
    mobile.getByRole("navigation", { name: "Workspace navigation" }),
  ).toBeVisible()
  for (const path of [
    "/missing-page",
    "/ProviderRelationsMobileApp/missing-page",
  ]) {
    expect((await page.request.get(path)).status()).toBe(404)
  }
})
