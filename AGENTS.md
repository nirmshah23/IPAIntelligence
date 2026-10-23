# arcwell-ipa-workspace

Next.js App Router + React 19 + Payload 4 + Tailwind CSS v4, integrated with Figma Make. Check `package.json` before using dependencies; use `pnpm install` to add them. Toolchain versions belong in `.mise.toml`.

## Skills

This file is supplied at task start; do not reread it before opening source.

- Always load `payload-framework`.
- Load `nextjs-docs` for routing, pages, components, caching, images, or metadata; not for schema-only, data-only, or style-only work.
- Load `payload-data-modeling` before changing collections, globals, fields, relationships, constraints, ownership, access rules, or seeds. Plan preservation of existing records first, including transitions from primitives/static data to relationships.
- Load `payload-content` before inspecting or mutating Payload documents/globals, including seeding.
- Load `payload-auth` before editing app authentication or authorization code.

## Project layout and styling

- `src/app/(frontend)/`: public pages, layout, `not-found.tsx`, and `styles.css`.
- `src/app/(payload)/`: managed Admin/API routes; **do not edit**. Admin is at `/admin`.
- `src/collections/`, `src/globals/`: schema definitions.
- `src/payload.config.ts`: configuration and schema registration.
- `src/payload-types.ts`: automatically generated; preserve its document ID types, never assume numeric IDs.
- `src/lib/payload.ts`: shared `findBySlug` / `findByField` utilities.
- `next.config.ts`, `figma-image-loader.ts`: preserve Payload, preview-origin, and image-loader integration.

Use Tailwind utilities in JSX. Reserve `styles.css` for the Tailwind import, shared tokens, and global base styles. Installed Make Kit/design-system components and tokens take precedence. Batch independent file writes by dependency layer.

## Backend and platform boundaries

Use no backend for static UI, browser-local state, games, or offline tools. Use Next.js server components/actions/handlers for stateless compute and integrations; use Payload for durable records, editable content, uploads, and app accounts. Use Supabase only when explicitly requested. Do not add placeholder collections or replace durable data with static arrays.

Figma Cloud owns database, storage, Admin auth integration, runtime, and platform secrets through `@payloadcms/figma`:

- Keep `buildFigmaConfig()`; do not replace it with `buildConfig()`.
- Do not add `db`, `secret`, a default `editor`, database adapters, storage plugins for normal uploads, Admin OAuth/auth plugins, migrations, DDL, or local database setup.
- Do not inspect, duplicate, or reinterpret package-owned bootstrap/env/OAuth internals, or run `@payloadcms/figma init`.
- Missing platform env vars in an ordinary shell are an execution-context limitation. Check the Make lifecycle environment; report blocked checks without adding dummy values, asking for platform secrets, removing Payload, or rewriting configuration.

## Secrets

For third-party integration setup explicitly requested by the user, collect credentials through the Make environment-variable card flow and read `process.env.*` only in server code. Saved values are write-only; never reveal, print, log, or request secrets in chat, code, comments, or docs. Change environment variables only when authorized for secret/integration setup.

Keep private values out of Payload documents, rendered props, static data, browser code, and public environment variables. Use `NEXT_PUBLIC_*` only for intentionally public configuration; warn if a sensitive key uses a public prefix. Platform-owned secrets must never be requested or replaced with placeholders.

## Payload implementation and data

1. Inspect the existing config, collections, and frontend routes before changes.
2. Add domain-specific schemas under `src/collections/` or `src/globals/` and register them in the existing config arrays. Preserve config shape and built-in Admins/Media.
3. Prefer relationships for independently managed concepts and upload relationships to `media` for images. Seed remote files through `externalURL`; do not add parallel image URL fields or hardcoded image data.
4. Follow the skills' lifecycle guidance for versions, drafts, `_status`, and domain statuses; do not apply editorial defaults to all app records. Add page/block management only when requested; keep the admin sidebar organized.
5. Query from server components/routes with `getPayload({ config })`. Use Payload-backed frontend queries and useful empty states; tolerate missing optional media/relationships.
6. Leave type generation to Payload HMR/build. Run `generate:importmap` only to recover a missing/stale map or generation error, or when HMR and `payload build` are unavailable.
7. Use an installed official plugin's canonical fields rather than recreating its capability. For SEO social images, configure its upload collection and consume its generated image field.

For document/global CRUD and seeding, follow `payload-content` and the environment's Payload data tooling. Confirm it reaches the current schema before promising seeds. Do not substitute raw database access, REST helpers, app/temporary migration endpoints, Local API scripts, or one-off seed scripts. If tooling is unavailable after listing/refreshing tools, report the limitation and retain Payload queries without static fallbacks. Data-only follow-ups must not change source unless schema/UI/behavior changes are also requested.

Before finishing Payload work, verify schema registration, automatic types/import maps, Payload-backed queries, appropriate seeding (or report unavailable tooling), unchanged managed routes, and attempt the fastest relevant typecheck/build.

## Access and data integrity

- Define explicit access for private, user-submitted, staff, and operational records. Public forms may have narrow anonymous create access; private submissions must not be publicly readable, listable, editable, or deletable by default.
- Server-validate and allowlist every user-submitted field; return structured UI errors. Protect server-owned workflow fields with field-level create/update access.
- Enforce relationship eligibility and durable invariants at collection boundaries, not only in Server Actions.
- User-facing Local API calls must use `overrideAccess: false` and pass the authenticated `user` when present.

## Authentication

Keep Make-file access, Payload Admin access, and published-app login separate. Existing `admins` are CMS editors (`admin.user`), not public app accounts. Do not modify Admin login unless explicitly requested; handle `/admin` access through the existing platform setup.

For requested public signup/login, profiles, or user-owned data, register an auth-enabled `Users` collection (`users`) for accounts and ownership. Never use Admins for public signup or grant app users Admin access.

Do not hand-roll passwords, sessions, or OAuth, or copy Payload Enterprise auth. Prefer the public `payload-auth` framework when compatible. If unavailable and OAuth is explicitly required, use a vetted server-side auth/OIDC framework bridged to Payload users. Keep provider secrets server-side; never reuse Figma CLI/control-plane/Admin OAuth for app login. Register `FIGMA_PREVIEW_OAUTH_REDIRECT_URI` verbatim and prefix preview OAuth state with `FIGMA_PREVIEW_OAUTH_STATE_PREFIX` per `payload-auth`.

## Existing-schema safety

Greenfield additive schemas/seeds may proceed. Existing-app optional fields, new collections, and new relationships usually need only a concise preview. Follow-ups count as existing-app changes even in the same chat.

**Pause for confirmation before** deletes, renames, field-type changes, required/unique constraints, relationship-cardinality changes, bulk document updates, or content deletes. Check existing records where possible for validation ranges and other changes that could invalidate/orphan data. Plan preservation/migration with `payload-data-modeling`.

Use `ask_user_question` with exactly `options: ["Yes", "No"]`, `multiSelect: false`. Explain affected fields/documents, data-loss/validation risks, affected routes/links/queries, and the migration/preservation plan; end the turn and wait before editing or mutating. Direct requests such as “delete this field” do not waive this safeguard. Do not silently change dependent code/data to conceal the risk. Code rollback does not roll back Payload data.

## Routes, caching, and production verification

Use `page.tsx` under `src/app/(frontend)/` for routes. Public detail records generally need unique indexed slugs. Use shared `findBySlug()` and call `notFound()` for missing records; do not duplicate lookups. For another routing field, use `findByField()` and update all dependent queries/routes. Await App Router route params.

For frontend work, keep **Verify production delivery** pending until all checks below pass:

- Preview every requested route and fix runtime/build errors. Server Components cannot contain event handlers; use CSS interactions or a Client Component.
- If a Client Component invokes a Server Action inside `useTransition`, return a serializable result, keep `revalidatePath` out of the action, and call `router.refresh()` after success.
- Keep fixed pages static. Choose one content lifecycle before implementing dynamic routes:
  - Build-time snapshot: build-time reads without on-write revalidation; warn that Admin edits require another **Publish**.
  - Fresh after Publish: add cached list/detail reads and collection hooks immediately after schema, before UI. On every write, invalidate lists and both previous/current route keys; invalidate affected pages after related media changes. Prove a unique published edit appears in a fresh production request. Revalidation intervals alone are insufficient.
- Run `figma make verify-deploy`, inspect the production route table, and visit every generated public route. `verify-bootstrap`, source review, builds, and HTTP 200s are not substitutes. For requested static/ISR pages, repair caching and rerun until the route table no longer marks them `ƒ (Dynamic)`.
- Pass Payload `media.url` to `next/image` and keep the custom loader. Do not add `images.remotePatterns` or a same-origin `/media/[id]` proxy (404s after Publish). Verify nonzero image dimensions in every requested view, including after upload replacement; when publishing, also verify published images.

## Development and deployment

In Make, the dev server is already running with hot reload and a preview panel. Do not start another; use `$PORT` (default 3000), never a hardcoded port.

Preserve the exact `FIGMA_PUBLIC_URL` host in `allowedDevOrigins` and `experimental.serverActions.allowedOrigins`. Investigate Admin `Invalid Server Actions request` origin/forwarded-host mismatches as preview-proxy configuration first; do not disable Server Actions or rewrite managed routes/internals.

Preserve Make lifecycle scripts and executable permissions when present: `.figma/make/install`, `dev`, `deploy`, and `deploy-preview`. Keep the preview `.next`/`nextjs` packaging contract and delegate packaging/upload to `figma make deploy-preview`; deploy through `figma make deploy`. Platform env vars are injected by the Make lifecycle, not supplied manually.
