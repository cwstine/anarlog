# Corola Rebrand Implementation Plan

> **Execution:** Complete this plan only after the local-only removal plan is
> green. Commit and push each verified checkpoint to
> `feature/corola-local-only`; keep pull request #1 in draft state.

**Goal:** Rebrand the retained local desktop application from Anarlog/Hyprnote
to Corola without reviving any removed account, billing, team, sharing, sync,
or hosted-service dependency.

**Architecture:** Treat the Tauri configuration as the canonical installed-app
identity, use one original Corola source mark for all generated application
artwork, and replace only active/user-visible product branding. Preserve inert
legacy database, provider, package-scope, and storage identifiers when changing
them could break upgrades. Disable the updater until Corola owns an endpoint
and signing key.

**Tech stack:** Tauri 2, Rust, React/TypeScript, Lingui, Vitest, ImageGen,
Tauri icon tooling, macOS `sips`/`iconutil`/`actool`.

---

## Task 1: Lock the installed-app identity to Corola

**Files:**

- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.stable.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.staging.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.flatpak.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.app-store.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.stable-macos.json`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/Info.plist`
- Modify: `apps/desktop/src-tauri/src/commands.rs`
- Modify: `apps/desktop/src-tauri/src/embedded_cli.rs`
- Modify: `apps/desktop/src-tauri/src/embedded_cli/tests.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`

1. Add failing assertions for the Corola product names, binaries, bundle IDs,
   schemes, disabled updater, and absence of Anarlog update endpoints/keys.
2. Set stable identity to `Corola`, `corola`, `com.corola.desktop`, and
   `corola`; use `.dev`/`.staging` and channel-specific names for non-stable
   builds.
3. Rename active CLI/product paths and messages to Corola while retaining only
   explicitly documented legacy lookup compatibility.
4. Run the focused native tests and commit/push the checkpoint.

## Task 2: Replace retained user-visible branding and outbound URLs

**Files:**

- Modify: retained files under `apps/desktop/src/**`
- Modify: `apps/desktop/src-tauri/src/**`
- Modify: `apps/desktop/src-tauri/plugins/tray/src/**`
- Modify: `apps/desktop/src-tauri/src/agents-content.md`
- Modify: `skills/anarlog/**` or replace with a Corola equivalent
- Modify: associated focused tests

1. Add a failing brand-boundary test over active desktop source/config files.
2. Change visible app, assistant, permissions, lock, onboarding, notification,
   disclosure, template, developer-tool, menu, and startup copy to Corola.
3. Remove Anarlog docs/demo/community/support/changelog network destinations
   when no Corola-owned destination exists; retain direct provider docs.
4. Rename active telemetry namespaces to Corola, leaving the legacy Sentry-off
   environment variable as an upgrade-compatible alias if needed.
5. Extract/compile Lingui catalogs so generated locale output reflects current
   source rather than removed product surfaces.
6. Run focused frontend/native tests and commit/push the checkpoint.

## Task 3: Replace the application mark and icon customization surface

**Files:**

- Replace: `apps/desktop/src/shared/anarlog-mark.tsx`
- Modify: `apps/desktop/src/shared/brand-loading-view.tsx`
- Modify: `apps/desktop/src/shared/theme/icon.ts`
- Modify: `apps/desktop/src/shared/theme/provider.tsx`
- Modify: `apps/desktop/src/settings/appearance/app-icon.tsx`
- Modify: associated tests
- Remove: obsolete alternative Anarlog preview/resource assets

1. Add failing component/icon-resolution tests for a single Corola identity.
2. Replace the legacy mark with an original Corola flower/C monogram.
3. Simplify Dock icon selection to the Corola default and remove obsolete
   branded variants from settings and the bundle.
4. Run the focused UI tests and commit/push the checkpoint.

## Task 4: Generate and install original Corola artwork

**Files:**

- Add: `apps/desktop/src-tauri/icons/src/corola.png`
- Replace: generated assets under `apps/desktop/src-tauri/icons/{stable,dev,staging}/`
- Replace: `apps/desktop/src-tauri/resources/{stable,dev,staging}/AppIcon.icns`
- Add/Replace: `apps/desktop/public/assets/corola-icon.png`
- Modify: `apps/desktop/src-tauri/assets/dmg-background-*.png`
- Modify: `apps/desktop/src-tauri/scripts/compile-icons.sh`

1. Generate one original 1024px Corola source icon with ImageGen: a clean,
   centered coral-blossom/C silhouette, warm coral palette, strong small-size
   legibility, no text, no watermark, and no third-party trade dress.
2. Inspect the source visually, then generate required PNG, ICNS, ICO, Windows
   tile, web, native-resource, and installer variants mechanically from it.
3. Add asset-boundary checks for required files, dimensions, and stale
   Anarlog-named first-party artwork.
4. Run asset/config tests and commit/push the checkpoint.

## Task 5: Verify the final Corola boundary

1. Audit active desktop source/config/bundle inputs for stale visible
   Anarlog/Hyprnote/Char names and `anarlog.so` destinations. Classify any
   remaining occurrence as tested legacy compatibility, historical fixture, or
   unrelated third-party content.
2. Verify desktop TypeScript, focused Vitest suites, formatting/lint, native
   Rust tests, dependency tree, and a clean offline desktop build check.
3. Confirm login, billing, teams, sharing, sync, old updater configuration, and
   old first-party artwork are absent from the shipped desktop boundary.
4. Update the draft PR description with the new commits, verification evidence,
   intentional compatibility identifiers, and remaining unrelated baseline
   failures. Keep the PR draft and push the final checkpoint.
