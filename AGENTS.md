# arcwell-ipa-workspace

Working prototype using Vite, React 19, TypeScript, and Tailwind CSS v4. Data is saved in the browser; there is no Payload backend, CMS, app login, or Figma Cloud dependency.

## Development

- Use the pnpm version in `package.json`; `corepack pnpm install` installs dependencies.
- Run `corepack pnpm dev` or `./start-app.ps1` on Windows. Respect `$PORT` (default 5173; preview defaults to 4173). Check for an existing server before starting another.
- Use `corepack pnpm exec tsc --noEmit` for typechecking and `corepack pnpm build` for production validation. Do not suppress type/build errors.
- Check `package.json` before adding dependencies. Keep `.mise.toml` as the toolchain version source.

## App structure

- `index.html`, `src/main.tsx`, `src/styles.css`: document, browser entry point, and styles.
- `src/BrowserWorkspace.tsx`: browser-only mounting boundary. Preserve it so saved data loads before persistence effects run.
- `src/WorkspaceApp.tsx`: workspace navigation using URL hashes.
- `src/modules/intelligence/`, `src/modules/assurance/`: prototype features and demo data.
- `src/lib/project-templates.ts`: browser storage and validation for project templates.

## Browser data

- Use browser storage for prototype persistence; do not introduce a backend without a user request.
- Preserve existing storage keys and saved record meanings. Namespace/version new keys and handle missing, malformed, blocked, or full storage without silently overwriting saved data.
- Browser data is specific to the browser profile and origin. It is not shared across devices/users and is removed when site data is cleared. Keep this limitation clear in the UI.
- Never store real credentials, secrets, or sensitive personal data. Use fictional demo records.
- Validate user inputs and display actionable save failures. Do not report success until storage writes succeed.
- Removing backend source does not migrate or delete any records in the former cloud backend. Do not claim cloud data has been migrated without verifying it.

## UI and verification

- Preserve existing navigation, demo workflows, and browser data when making changes.
- Use Tailwind utilities for new UI; reserve global CSS for imports, shared tokens, and base styles. Follow existing components and styles.
- The app runs entirely in the browser; keep storage initialization before persistence effects.
- For frontend work, keep **Verify production delivery** pending until typecheck/build pass and requested views are tested in a browser, including reload persistence and visible error handling where relevant.
- Keep delivery static and inspect the production assets in `dist/`. Test missing routes as well as the public app. This standalone prototype does not require Figma Make deployment commands.
- Batch independent file writes. Avoid unrelated refactors and preserve user changes.
