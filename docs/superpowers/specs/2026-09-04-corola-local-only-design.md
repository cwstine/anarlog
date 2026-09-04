# Corola Local-Only Desktop Design

**Date:** 2026-09-04

**Status:** Approved in chat on 2026-09-04

## Summary

Convert the existing desktop application into Corola, a local-first desktop
application with no login, billing, team workspace, note sharing, or cloud sync
product surface. The shipped desktop must start and perform its core work
without Supabase or an Anarlog web/API deployment.

The implementation removes these features from the desktop dependency graph
rather than hiding them behind a runtime flag. Local capture, local storage,
editing, search, export, on-device transcription, local AI, and direct
user-configured AI providers remain available. Product rebranding happens only
after the removal work passes its tests.

## Goals

- Remove login, account management, Supabase authentication, browser auth
  handoff, and stored-session use from the desktop.
- Remove billing, trials, subscriptions, pricing prompts, and entitlement
  checks from the desktop.
- Remove organization/team workspaces, membership, roles, invitations, and
  workspace sharing policies.
- Remove note sharing, shared-note previews, shared comments, share delivery,
  and associated remote cleanup or cache lifecycles.
- Remove Cloud Sync, attachment backup, sync credentials, E2EE sync setup,
  sync status, and SQLite Cloud loading from the desktop runtime.
- Remove account-dependent Anarlog services that cannot operate after auth is
  removed: Anarlog-hosted LLM/STT, Cloud API/remote MCP, and Anarlog-mediated
  connected integrations/imports.
- Preserve existing local notes and recordings, including data created before
  the user upgraded from the account-enabled application.
- Preserve Microsoft Teams as a detectable meeting application. "Teams" in
  this design means Anarlog's collaborative workspace product, not Microsoft
  Teams meeting capture.
- Rebrand the resulting product to Corola only after all removal work is green.

## Non-goals

- Do not delete the repository's separate web, API, Supabase, mobile, or
  enterprise applications. They may remain in the monorepo, but the Corola
  desktop must not import, launch, or require them.
- Do not remove generic direct integrations that need no Corola account, such
  as user-supplied API endpoints, local webhooks, or local Apple Calendar
  access.
- Do not make Corola completely network-isolated. A user may deliberately
  configure a BYOK provider whose API is remote.
- Do not rename every internal Rust crate, JavaScript package scope, historical
  migration, or legacy storage key. Compatibility identifiers may retain old
  names when they are not user-visible and cause no outbound dependency.
- Do not destructively drop legacy cloud/workspace/share tables from existing
  SQLite databases in this project. They remain inert compatibility data.
- Do not redesign the note-taking, recording, transcription, or AI experience.

## Product invariants

1. Corola launches without `VITE_APP_URL`, `VITE_API_URL`,
   `VITE_SUPABASE_URL`, or `VITE_SUPABASE_ANON_KEY`.
2. Launching Corola does not initialize auth, billing, sharing, Cloud API,
   attachment backup, or cloud-sync lifecycles.
3. Core local actions never redirect to sign-in, checkout, account, or an
   Anarlog website.
4. No visible feature is gated on a subscription or plan.
5. Anarlog-hosted AI choices do not appear. Local and direct BYOK choices do.
6. Existing local sessions, notes, transcripts, attachments, recordings,
   contacts, folders, templates, and settings remain readable.
7. Removing a local note never performs remote share or Cloud API cleanup.
8. The desktop binary does not load the bundled SQLite Cloud extension.
9. Product branding is unchanged during removal phases and changes to Corola
   only in the final phase.

## Architecture

### 1. Local application identity

The application will use one deterministic local owner identity instead of an
authenticated Supabase user. Existing logged-out behavior already establishes
a local identity pattern; that pattern becomes the only runtime identity.

Queries that currently branch on an authenticated user will use the local
identity directly. Before switching ownership-dependent queries, a tested
compatibility operation will make locally stored content visible under the
local identity without deleting content. Where changing ownership would lose
historical metadata, queries will instead treat all locally stored, non-shared
content as locally owned.

No fake auth object or permanently signed-in stub will be introduced. Such a
stub would preserve the coupling and make future account assumptions difficult
to detect.

### 2. Desktop composition

Remove auth and billing providers from the root route/layout composition. Any
component that consumes them must be handled in one of three ways:

- Delete it if its purpose is account, billing, workspace, sharing, sync, or a
  dependent hosted service.
- Replace its plan check with ordinary availability if the underlying feature
  is entirely local or direct-BYOK.
- Replace authenticated identity access with the deterministic local identity
  when the underlying data is local.

The main desktop lifecycle will no longer mount attachment transfer,
cloud-sync keychain repair, Cloud API backfill, shared-note cache, owned-share
publishing, or shared-note preview auth services. Tool registration will not
request auth headers. Local tools continue to operate against the local
database.

### 3. Account, billing, and entitlement removal

Remove desktop routes, onboarding steps, settings panels, sidebar actions,
toasts, dialogs, and commands for:

- sign in/sign out and account profile;
- plan status, trials, checkout, subscription management, and upgrade prompts;
- team/workspace selection, creation, membership, invitations, roles, seats,
  and sharing policies.

Local functionality currently marked Pro becomes normally available after its
remote dependency is considered:

- A local or direct-BYOK feature loses the plan gate.
- A feature that calls an Anarlog account service is removed.

The pricing and Supabase billing packages may remain for other monorepo
applications, but the desktop package will no longer depend on them when no
remaining desktop import requires them.

### 4. Sharing and collaborative data removal

Remove the desktop `session-sharing` and `shared-notes` product surfaces,
including share creation, access settings, invitations, comments, remote
previews, delivery management, shared attachment cache, reconciliation, and
background publishing.

Session deletion becomes a local operation. It will no longer look up a managed
share, revoke a link, delete a Cloud API snapshot, or warn about remote cleanup.
Deep links that exist only for shared notes will be removed from routing.

Legacy share/workspace database tables and migrations remain untouched so an
existing database can open without a destructive schema fork. No lifecycle or
query will synchronize those tables.

### 5. Cloud sync removal

Remove from the desktop runtime:

- sync settings and sync status UI;
- sync enable/disable preferences;
- auth-to-sync token exchange;
- recovery key and device approval flows;
- CloudSync environment variables and native initialization;
- cloud-sync activity indicators;
- attachment backup/restore lifecycles;
- the desktop application's dependency on the `cloudsync` crate and its
  bundled native SQLite extension.

The standalone `crates/cloudsync` package may remain in the monorepo if another
application or retained test fixture needs it, but the Corola desktop binary
must not link or load it.

Existing local SQLite databases continue to use normal SQLite. Legacy sync
metadata remains inert. Stored auth/sync credentials owned by the application
will be cleared through a narrowly scoped, best-effort compatibility cleanup;
failure to remove obsolete credentials must not prevent launch.

### 6. Dependent hosted feature removal

The following depend on the removed account and are also removed from Corola:

- the `anarlog` hosted LLM provider;
- the `anarlog/cloud` transcription provider;
- Cloud API snapshot upload and remote MCP/API key management;
- Nango-backed connected accounts and imports that require the Anarlog API;
- hosted integration setup that redirects through the Anarlog web app.

Retain:

- Apple Intelligence, Ollama, LM Studio, Unsloth, and other local providers;
- direct BYOK providers configured by the user;
- custom OpenAI-compatible base URLs;
- local Apple Calendar access;
- local CLI/MCP behavior that reads the on-device database;
- local webhooks and automations that do not call an Anarlog account service.

Provider migrations must handle a previously selected Anarlog cloud provider.
On first launch after upgrade, Corola will select an available local provider
or present the ordinary provider setup state. It will not attempt the old cloud
request and will not discard the user's stored BYOK credentials.

### 7. Data compatibility

The removal is an application behavior change, not a destructive database
migration. Compatibility tests will start from representative legacy settings
and database records that include:

- a prior authenticated owner ID;
- selected Anarlog cloud STT or LLM providers;
- enabled cloud-sync settings;
- workspace/share metadata;
- existing local note, transcript, recording, and attachment paths.

After migration, local content must be visible and editable, cloud services
must remain stopped, and local/BYOK provider settings must remain intact.
Workspace/share metadata can remain inaccessible and inert.

### 8. Corola rebrand (final phase only)

After all feature-removal and compatibility tests pass, rebrand the desktop:

- Product name: `Corola`
- Stable binary name: `corola`
- Stable bundle identifier: `com.corola.desktop`
- Development bundle identifier: `com.corola.dev`
- Staging bundle identifier: `com.corola.staging`
- Deep-link scheme: `corola`

Replace user-visible Anarlog/Hyprnote/Char names in the retained desktop UI,
notifications, accessibility copy, onboarding, disclosure text, AI assistant
copy, native menus, and installer presentation. Remove obsolete account,
sharing, billing, and sync copy rather than translating it to the new brand.

Create an original Corola logo and application icon, then generate the required
PNG, ICNS, ICO, Windows tile, macOS resource, installer-background, and web
asset variants from one approved source image. Provider and meeting-platform
logos remain their respective third-party brands.

Disable the Anarlog stable update endpoint and replace its embedded signing
configuration with no active updater until a Corola-owned update service and
key exist. Remove retained help/demo/social URLs that point to Anarlog when no
neutral destination exists.

Historical database migration names, internal package scopes such as `@anlg`,
and legacy storage lookup keys may remain to protect upgrades. New user-visible
storage labels and newly created keys use Corola naming.

## Error handling

- A missing local/BYOK AI configuration produces the existing provider setup
  state, never a login or upgrade prompt.
- Legacy cloud settings are normalized locally and never trigger a network
  request.
- Best-effort removal of obsolete auth/sync credentials logs a local diagnostic
  on failure and allows startup to continue.
- Existing files with missing paths use the current local missing-file behavior;
  cloud restore is not offered.
- Unknown old deep links fail through the normal not-found path without opening
  an Anarlog URL.

## Testing strategy

### Dependency and composition tests

- Add tests for a root desktop composition that renders without auth or billing
  providers.
- Assert that main lifecycle composition contains only retained local services.
- Add a static dependency-boundary test that rejects imports from removed
  desktop feature directories and rejects Supabase/auth/billing/cloudsync usage
  from desktop entry points.

### Behavior tests

- Verify onboarding reaches the local application without account screens.
- Verify settings contain no account, plan, workspace, share, or sync entries.
- Verify local note creation, editing, deletion, search, and export need no auth
  headers and perform no remote cleanup.
- Verify local and direct-BYOK AI choices remain available without entitlements.
- Verify hosted Anarlog STT/LLM choices are absent.
- Verify Microsoft Teams meetings are still detected.

### Upgrade compatibility tests

- Load legacy account, provider, and cloud-sync settings and confirm they
  normalize to local-only behavior.
- Load legacy locally stored content owned by a prior user ID and confirm it is
  visible and editable.
- Confirm legacy share/workspace metadata neither crashes startup nor schedules
  network work.

### Native and packaging checks

- Confirm the desktop Rust dependency graph no longer includes the cloudsync
  extension.
- Run TypeScript type checking, focused Vitest suites, Rust checks/tests, lint,
  and formatting checks applicable to changed packages.
- After the final phase, build the desktop bundle and inspect rendered icons,
  installer artwork, product name, executable name, bundle IDs, schemes, and
  update configuration.
- Search retained desktop/runtime files for user-visible old-brand references
  and Anarlog account/API URLs. Allow only documented compatibility identifiers.

## Implementation sequence

1. Establish dependency-boundary and local-identity compatibility tests.
2. Remove account, onboarding auth, billing, trials, and entitlement gates.
3. Remove workspace/team-management surfaces.
4. Remove note sharing and collaborative lifecycles; simplify local deletion.
5. Remove Cloud API and account-backed integrations.
6. Remove attachment transfer, cloud-sync UI/state/auth, and native SQLite Cloud
   initialization/linkage.
7. Normalize legacy settings and verify local data compatibility.
8. Run the complete local functionality and packaging verification suite.
9. Rebrand the passing application and assets to Corola.
10. Run final package builds, visual asset inspection, and old-brand/outbound
    dependency audits.

## Acceptance criteria

- A clean Corola desktop installation starts directly into local onboarding or
  the local note interface with no login option.
- No account, billing, trial, team workspace, sharing, Cloud API, or cloud-sync
  UI is reachable.
- No associated background service runs and no associated endpoint is called.
- The built desktop has no Supabase requirement and does not load SQLite Cloud.
- Local notes and recordings created by an earlier version remain accessible.
- Core local capture, transcription, editing, search, export, and local/BYOK AI
  tests pass.
- Microsoft Teams meeting detection still works.
- The final app is visibly Corola and ships with Corola identifiers and original
  Corola assets.
- The rebrand is committed only after the feature-removal implementation is
  verified.
