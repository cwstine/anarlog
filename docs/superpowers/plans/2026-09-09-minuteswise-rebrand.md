# MinutesWise Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the final Corola branding layer with MinutesWise, preserve
existing local data and provider credentials, install an original
CollectWise-adjacent visual identity, and launch the renamed desktop app.

**Architecture:** Treat Tauri channel configuration as the source of truth for
the new product identity, while keeping Corola/Anarlog/Hyprnote values only in
explicit compatibility lookup tables. Use one checked-in 1024px source icon to
generate every packaged asset, and use brand-boundary tests to keep the active
desktop, CLI, and agent surfaces consistently named.

**Tech Stack:** Tauri 2, Rust 1.94, React/TypeScript, Lingui, Vitest, Insta,
Tauri icon tooling, built-in ImageGen.

**Spec:** `docs/superpowers/specs/2026-09-04-corola-local-only-design.md`, with
the final-brand section superseded by the MinutesWise direction approved in
chat on 2026-09-09.

## Global Constraints

- Product name: `MinutesWise`.
- Stable executable and deep-link scheme: `minuteswise`.
- Bundle identifiers: `com.minuteswise.desktop`, `com.minuteswise.dev`, and
  `com.minuteswise.staging`.
- Corola, Anarlog, and Hyprnote identifiers may remain only where tests prove
  they preserve existing data, stored credentials, or historical fixtures.
- Do not reintroduce login, billing, teams, sharing, sync, hosted product
  services, or an updater endpoint.
- The visual identity may share CollectWise's bold cobalt wordmark language,
  but its `MW`/minute-hand mark must be original and legible at 16px.
- Commit and push each verified checkpoint to `feature/corola-local-only` and
  keep pull request #1 in draft state.

---

### Task 1: Rename installed-app identity with compatibility fallbacks

**Files:**

- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/src/db.rs`
- Modify: `apps/desktop/src-tauri/src/legacy_credentials.rs`
- Modify: `apps/desktop/src-tauri/src/embedded_cli.rs`
- Modify: `apps/desktop/src-tauri/src/embedded_cli/tests.rs`
- Modify: `apps/desktop/src-tauri/src/agent_skills.rs`
- Modify: `apps/desktop/src-tauri/src/agents.rs`
- Modify: `apps/desktop/src-tauri/src/agents-content.md`
- Modify: `apps/desktop/src-tauri/src/main.rs`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/Info.plist`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.stable.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.staging.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.flatpak.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.app-store.json`
- Modify: `apps/desktop/scripts/dev-runner.mjs`
- Modify: `apps/desktop/src/shared/utils.ts`
- Modify: `apps/desktop/src/shared/utils.test.ts`
- Modify: `crates/storage/src/global.rs`
- Modify: `plugins/store2/src/commands.rs`
- Rename: `apps/desktop/flatpak/com.corola.desktop.yml` to
  `apps/desktop/flatpak/com.minuteswise.desktop.yml`
- Rename: `apps/desktop/flatpak/com.corola.desktop.desktop` to
  `apps/desktop/flatpak/com.minuteswise.desktop.desktop`
- Rename: `apps/desktop/flatpak/com.corola.desktop.metainfo.xml` to
  `apps/desktop/flatpak/com.minuteswise.desktop.metainfo.xml`
- Rename: `apps/desktop/flatpak/corola-cli` to
  `apps/desktop/flatpak/minuteswise-cli`

**Interfaces:**

- Consumes: existing legacy data folders and keychain service coordinates.
- Produces: MinutesWise channel names, bundle IDs, schemes, executable names,
  and compatibility mappings from all three previous brands.

- [x] **Step 1: Write failing identity and compatibility assertions**

  Change the config test in `src/lib.rs`, the scheme table in
  `src/shared/utils.test.ts`, the storage resolver tests in
  `crates/storage/src/global.rs`, and the embedded CLI tests to expect the
  exact MinutesWise values above while expecting populated Corola folders and
  Corola keychain services to remain readable.

- [x] **Step 2: Run tests to verify RED**

  Run focused Vitest and Cargo tests. Expected: failures name the old Corola
  product, scheme, bundle ID, storage folder, or CLI command.

- [x] **Step 3: Implement the identity and migration mapping**

  Replace active identifiers with MinutesWise. Resolve new stable installs to
  `minuteswise`, prefer a populated `minuteswise` folder, then fall back in
  order to populated `corola`, `anarlog`, and `hyprnote` folders. Map new
  MinutesWise keychain identifiers to the existing compatibility service and
  include Corola in legacy cleanup locations. Do not move or delete data.

- [x] **Step 4: Verify GREEN and commit**

  Run the focused tests, formatting, and package checks; commit as
  `refactor: rename desktop identity to MinutesWise`, then push.

### Task 2: Rename the CLI, agent skill, and active product copy

**Files:**

- Modify: `apps/cli/Cargo.toml`
- Modify: `apps/cli/src/{analytics.rs,cli.rs,commands/doctor.rs,db.rs,error.rs,error_reporting.rs,main.rs,mcp.rs}`
- Rename: `apps/cli/src/snapshots/corola_cli__cli__tests__cli_contract.snap`
  to `apps/cli/src/snapshots/minuteswise_cli__cli__tests__cli_contract.snap`
- Rename: `apps/cli/src/snapshots/corola_cli__mcp__tests__mcp_contract.snap`
  to `apps/cli/src/snapshots/minuteswise_cli__mcp__tests__mcp_contract.snap`
- Modify: active Corola-bearing files under `apps/desktop/src/**`
- Modify: active Corola-bearing files under `apps/desktop/src-tauri/src/**`
- Modify: `plugins/{deeplink2,git,importer,local-api,tray,windows}/src/**`
- Modify: `crates/{agent-access,db-migrate,local-model}/src/**`
- Modify: `docs/{agents/mcp.mdx,installation.mdx,reference/cli.mdx,reference/mcp.mdx}`
- Rename: `skills/corola/` to `skills/minuteswise/`
- Modify: generated catalogs under `apps/desktop/src/i18n/locales/**`
- Modify: `Cargo.lock`

**Interfaces:**

- Consumes: the MinutesWise identifiers from Task 1.
- Produces: the `minuteswise` CLI/MCP command, installed `minuteswise` agent
  skill, and MinutesWise-only active UI/native copy.

- [x] **Step 1: Strengthen the failing brand boundary**

  Rename the suite to `MinutesWise brand boundary`, add `Corola` to the banned
  former product names, and keep a narrow exclusion list only for explicit
  compatibility modules. Update CLI contract assertions to require
  `minuteswise`, `MINUTESWISE_BASE`, and `MINUTESWISE_DB_PATH`.

- [x] **Step 2: Run tests to verify RED**

  Run `brand-boundary.test.ts` and the CLI contract tests. Expected: failures
  point at remaining active Corola copy and CLI identity.

- [x] **Step 3: Replace active branding**

  Rename user-visible desktop/native strings, telemetry namespaces, local
  storage keys, CLI help, MCP server metadata, docs, and packaged agent skill.
  Retain old storage keys only as read-side aliases where needed. Regenerate
  Insta snapshots and Lingui catalogs from the renamed source strings.

- [x] **Step 4: Verify GREEN and commit**

  Run desktop tests/typecheck/lint, CLI tests, i18n stability checks, and
  formatting; commit as `refactor: rename product surfaces to MinutesWise`,
  then push.

### Task 3: Replace the mark and generated application assets

**Files:**

- Rename: `apps/desktop/src/shared/corola-mark.tsx` to
  `apps/desktop/src/shared/minuteswise-mark.tsx`
- Rename: `apps/desktop/src/shared/corola-mark.test.tsx` to
  `apps/desktop/src/shared/minuteswise-mark.test.tsx`
- Modify: `apps/desktop/src/shared/brand-loading-view.tsx`
- Modify: `apps/desktop/src/shared/brand-loading-view.test.tsx`
- Modify: `apps/desktop/src/brand-assets.test.ts`
- Rename: `apps/desktop/src-tauri/icons/src/corola.png` to
  `apps/desktop/src-tauri/icons/src/minuteswise.png`
- Rename: `apps/desktop/public/assets/corola-icon.png` to
  `apps/desktop/public/assets/minuteswise-icon.png`
- Replace: `apps/desktop/src-tauri/icons/{stable,dev,staging}/**`
- Replace: `apps/desktop/src-tauri/resources/{stable,dev,staging}/AppIcon.icns`
- Modify: `apps/desktop/src-tauri/assets/dmg-background-stable.png`
- Modify: `apps/desktop/src-tauri/assets/dmg-background-staging.png`
- Modify: `apps/desktop/src-tauri/scripts/compile-icons.sh`

**Interfaces:**

- Consumes: one 1024x1024 MinutesWise master image.
- Produces: a deterministic inline loading mark plus every bundled raster,
  ICNS, ICO, runtime, and installer asset.

- [x] **Step 1: Write failing mark and asset assertions**

  Require a `minuteswise-mark` SVG with a unique minute-hand/`MW` signature,
  exactly one `minuteswise.png` source image, a 512px public icon, matching
  stable/dev/staging hashes, and no Corola-named first-party runtime asset.

- [x] **Step 2: Run tests to verify RED**

  Run the mark, loading-view, and brand-asset tests. Expected: missing
  MinutesWise component and asset paths.

- [x] **Step 3: Create and install the original visual identity**

  Use CollectWise's public blue wordmark only as a style reference. Generate a
  square MinutesWise app icon with a centered original `MW`/minute-hand mark,
  deep cobalt on a clean light field, no copied glyph, no text, and no
  watermark. Inspect it at full size and thumbnail size, then mechanically
  generate all channel assets with `compile-icons.sh`. Implement the matching
  simplified SVG mark for loading states.

- [x] **Step 4: Verify GREEN and commit**

  Run component and asset tests, inspect the generated icon matrix, run
  formatting, commit as `feat: add MinutesWise brand assets`, then push.

### Task 4: Verify, launch, and update the draft pull request

**Files:**

- Modify only if verification exposes a rebrand defect.
- Update: draft pull request #1 description through GitHub CLI.

**Interfaces:**

- Consumes: Tasks 1-3.
- Produces: a running MinutesWise desktop build and documented verification
  evidence on the existing draft pull request.

- [ ] **Step 1: Audit the shipped boundary**

  Search active desktop/CLI/config/docs/skill paths for Corola. Classify every
  remaining hit as a compatibility alias or historical plan; remove any active
  branding leak.

- [ ] **Step 2: Run final verification**

  Run dprint formatting/check, desktop Vitest/typecheck/oxlint/i18n checks,
  affected Rust tests and Cargo check, configuration parsing, and asset
  dimension/hash checks.

- [ ] **Step 3: Launch MinutesWise**

  Stop any prior dev process, launch Tauri with the workspace's Node 22 and
  Rust 1.94 paths plus the whitespace-safe Cargo target directory, and verify
  Vite listens on port 1422 and the native MinutesWise process stays alive.

- [ ] **Step 4: Push and update PR #1**

  Push the final checkpoint and update the draft PR description with the new
  name, asset direction, compatibility aliases, and exact verification results.
