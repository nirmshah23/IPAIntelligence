import { defineConfig } from '@playwright/test'

const port = process.env.PORT || '4173'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, channel: 'msedge', headless: true },
  webServer: {
    command: 'corepack pnpm preview',
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
