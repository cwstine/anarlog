# Local-Only Feature Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove login, billing, collaborative teams, note sharing, Cloud API, account-backed integrations, attachment backup, and Cloud Sync from the desktop while preserving local data and local/direct-BYOK functionality.

**Architecture:** Remove cloud product surfaces from the outside in: navigation and onboarding first, then entitlement gates and hosted providers, collaborative note behavior, background cloud services, React auth composition, and native CloudSync loading. Keep legacy SQLite schema and internal compatibility identifiers inert so existing local data opens without a destructive migration.

**Tech Stack:** React 19, TypeScript, TanStack Router, Zustand, Vitest, Tauri 2, Rust 2024, SQLx/SQLite, pnpm 11 with Node.js 22+

**Spec:** `docs/superpowers/specs/2026-09-04-corola-local-only-design.md`

## Global Constraints

- Work only on `feature/corola-local-only` in the isolated Corola worktree.
- Use Node.js 22 or newer and pnpm 11.1.1 for JavaScript commands.
- Do not alter or copy the user's modification to `crates/transcribe-soniqo/build.rs` from the original checkout.
- Preserve local capture, notes, transcripts, recordings, editing, search, export, contacts, folders, templates, Apple Calendar, local CLI/MCP, local webhooks, on-device AI, and direct user-configured BYOK providers.
- Preserve Microsoft Teams meeting detection; remove only collaborative workspace/team management.
- Do not drop legacy workspace, share, sync, or ownership database columns/tables.
- Do not rebrand during this plan. Corola names and assets are a separate final plan after this plan is green.
- Follow red-green-refactor for every behavioral change: add or update a focused test, observe the expected failure, make the smallest production change, and rerun the focused test.

---

### Task 1: Remove account, team, sync, and plan UI from navigation and onboarding

**Files:**
- Modify: `apps/desktop/src/sidebar/settings.test.tsx`
- Modify: `apps/desktop/src/sidebar/settings.tsx`
- Modify: `apps/desktop/src/settings/index.test.tsx`
- Modify: `apps/desktop/src/settings/index.tsx`
- Modify: `apps/desktop/src/store/zustand/tabs/schema.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/basic.test.ts`
- Modify: `apps/desktop/src/onboarding/config.tsx`
- Create: `apps/desktop/src/onboarding/config.test.ts`
- Modify: `apps/desktop/src/onboarding/index.tsx`
- Modify: `apps/desktop/src/onboarding/calendar.tsx`
- Delete: `apps/desktop/src/onboarding/account/`
- Delete: `apps/desktop/src/settings/general/account.tsx`
- Modify: `apps/desktop/src/settings/general/index.ts`

**Interfaces:**
- Consumes: existing `SettingsTab`, `normalizeSettingsTab`, `OnboardingStep`, `getInitialStep`, `getNextStep`, and `getPrevStep` APIs.
- Produces: a settings/navigation model with no `account`, `team`, or `sync` tab and an onboarding sequence with no `login` step or account-backed calendar handoff.

- [x] **Step 1: Change settings tests to describe the local-only menu**

Replace the menu-label expectation in `sidebar/settings.test.tsx` with the retained labels and add explicit absence assertions:

```tsx
it("omits account, team, sync, and plan locks", () => {
  render(<SettingsNav />);

  expect(screen.queryByText("Account")).toBeNull();
  expect(screen.queryByText("Teams")).toBeNull();
  expect(screen.queryByText("Sync")).toBeNull();
  expect(screen.queryByLabelText("Requires Anarlog Pro")).toBeNull();
  expect(screen.getByText("Dictionary")).toBeTruthy();
  expect(screen.getByText("Automations")).toBeTruthy();
});
```

Update `settings/index.test.tsx` to render an obsolete account-tab snapshot and assert that it falls back to General rather than rendering Account:

```tsx
it("normalizes removed settings tabs to General", () => {
  render(
    <TabContentSettings
      tab={createSettingsTab({ active: true, state: { tab: "account" as never } })}
    />,
  );
  expect(screen.queryByText("Account settings")).toBeNull();
});
```

- [x] **Step 2: Run the focused settings tests and confirm RED**

Run:

```bash
corepack pnpm --filter @anlg/desktop test -- src/sidebar/settings.test.tsx src/settings/index.test.tsx
```

Expected: failures because Account, Teams, Sync, and plan-lock UI still render.

- [x] **Step 3: Remove obsolete settings tabs and plan navigation state**

In `sidebar/settings.tsx`, remove billing/workspace imports, `requiresPro`, Account/Teams/Sync items, and lock rendering. Retain Dictionary and Automations as ordinary entries. In `settings/index.tsx`, remove account/team/sync imports and switch cases. In `store/zustand/tabs/schema.ts`, remove these values from `SettingsTab` and normalize legacy strings to `"app"`:

```ts
case "account":
case "team":
case "sync":
  return "app";
```

Remove exports for the deleted Account settings component from `settings/general/index.ts`.

- [x] **Step 4: Add an onboarding sequence test and confirm RED**

Create `onboarding/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getInitialStep, getNextStep } from "./config";

describe("local-only onboarding sequence", () => {
  it("never enters an account login step", () => {
    const steps: string[] = [];
    let step: ReturnType<typeof getInitialStep> | null = getInitialStep();
    while (step) {
      steps.push(step);
      step = getNextStep(step);
    }
    expect(steps).not.toContain("login");
    expect(steps).toEqual([
      "permissions",
      "calendar",
      "imports",
      "folder-location",
      "final",
    ]);
  });
});
```

Run:

```bash
corepack pnpm --filter @anlg/desktop test -- src/onboarding/config.test.ts
```

Expected: failure because `login` remains in the sequence.

- [x] **Step 5: Remove account onboarding and account-backed calendar handoff**

Remove `login` from `OnboardingStep` and the ordered steps in `config.tsx`. Delete the account section and all `useAuth`, `didSkipLogin`, and `handleCalendarSignIn` logic from `onboarding/index.tsx`. Change the calendar section API so it offers only local Apple Calendar configuration or skip; remove the callback that starts application sign-in.

- [x] **Step 6: Rerun focused tests and typecheck**

Run:

```bash
corepack pnpm --filter @anlg/desktop test -- src/sidebar/settings.test.tsx src/settings/index.test.tsx src/onboarding/config.test.ts
corepack pnpm --filter @anlg/desktop typecheck
```

Expected: focused tests pass; typecheck has no errors introduced by Task 1.

- [x] **Step 7: Commit Task 1**

```bash
git add apps/desktop/src/sidebar/settings.tsx apps/desktop/src/sidebar/settings.test.tsx apps/desktop/src/settings/index.tsx apps/desktop/src/settings/index.test.tsx apps/desktop/src/settings/general/index.ts apps/desktop/src/store/zustand/tabs/schema.ts apps/desktop/src/store/zustand/tabs/basic.test.ts apps/desktop/src/onboarding/config.tsx apps/desktop/src/onboarding/config.test.ts apps/desktop/src/onboarding/index.tsx apps/desktop/src/onboarding/calendar.tsx apps/desktop/src/onboarding/account apps/desktop/src/settings/general/account.tsx
git commit -m "refactor: remove account team and sync product navigation"
```

### Task 2: Unlock local features and remove hosted Anarlog AI

**Files:**
- Create: `apps/desktop/src/audio-player/timeline.test.tsx`
- Modify: `apps/desktop/src/audio-player/provider.tsx`
- Modify: `apps/desktop/src/audio-player/timeline.tsx`
- Modify: `apps/desktop/src/settings/dictionary/index.tsx`
- Modify: `apps/desktop/src/settings/automations/index.tsx`
- Modify: `apps/desktop/src/templates/auto-form.tsx`
- Modify: `apps/desktop/src/settings/appearance/app-icon.tsx`
- Modify: `apps/desktop/src/settings/plan-gate.test.tsx`
- Delete: `apps/desktop/src/settings/plan-gate.tsx`
- Delete: `apps/desktop/src/settings/ai/shared/anarlog-cloud-button.tsx`
- Modify: `apps/desktop/src/settings/ai/shared/index.tsx`
- Modify: `apps/desktop/src/settings/ai/shared/eligibility.ts`
- Modify: `apps/desktop/src/settings/ai/llm/shared.tsx`
- Modify: `apps/desktop/src/settings/ai/llm/select.tsx`
- Modify: `apps/desktop/src/ai/hooks/useLLMConnection.ts`
- Modify: `apps/desktop/src/ai/hooks/useLLMConnection.test.ts`
- Modify: `apps/desktop/src/settings/ai/stt/shared.tsx`
- Modify: `apps/desktop/src/settings/ai/stt/select.tsx`
- Modify: `apps/desktop/src/settings/ai/stt/context.tsx`
- Modify: `apps/desktop/src/stt/capabilities.ts`
- Modify: `apps/desktop/src/stt/capabilities.test.ts`
- Modify: `apps/desktop/src/stt/useSTTConnection.ts`
- Modify: `apps/desktop/src/stt/useRunBatch.ts`
- Modify: `apps/desktop/src/settings/queries.ts`

**Interfaces:**
- Consumes: stored provider IDs and existing direct provider definitions.
- Produces: provider resolution that accepts local/direct-BYOK configuration without auth or plan state, and maps legacy `anarlog/cloud` selections to the unconfigured provider state.

- [x] **Step 1: Add failing tests for ungated local behavior and cloud-provider normalization**

Add a Timeline component test with `useAudioPlayer` mocked to return ordinary
local playback state and billing mocked as non-Pro for the initial RED run:

```tsx
it("shows playback-rate controls without a plan", () => {
  render(<Timeline />);
  expect(screen.getByRole("button", { name: "1x" })).toBeTruthy();
});
```

The provider mock supplies `playbackRate: 1`, a `setPlaybackRate` spy, idle
playback callbacks, and `useAudioTime: () => ({ current: 0, total: 60 })`.
Remove the billing mock after production no longer imports it.

Add provider normalization assertions to the existing capability tests:

```ts
it("treats the removed Anarlog cloud STT selection as unconfigured", () => {
  expect(isConfiguredSttModel("anarlog", "cloud")).toBe(false);
});
```

Update the exported provider-normalization test so both current and legacy
hosted IDs normalize to no provider:

```ts
expect(normalizeLLMProviderId("anarlog")).toBeUndefined();
expect(normalizeLLMProviderId("hyprnote")).toBeUndefined();
expect(normalizeLLMProviderId("openai")).toBe("openai");
```

- [x] **Step 2: Run provider/playback tests and confirm RED**

```bash
corepack pnpm --filter @anlg/desktop test -- src/audio-player/timeline.test.tsx src/stt/capabilities.test.ts src/ai/hooks/useLLMConnection.test.ts
```

Expected: failures from current plan enforcement and registered Anarlog providers.

- [x] **Step 3: Remove entitlement gates from retained local functionality**

Remove `useBillingAccess`, `PlanGate`, and upgrade callbacks from playback speed/timeline, Dictionary, local Automations, auto-template format, app-icon selection, and other retained local controls. Delete `settings/plan-gate.tsx` after `rg -l 'PlanGate|useNotifyPlanRequired' apps/desktop/src` returns no retained production consumer. Keep controls enabled with their existing validation and platform checks.

- [x] **Step 4: Remove hosted Anarlog LLM and STT providers**

Delete the Anarlog provider entries from `settings/ai/llm/shared.tsx` and `settings/ai/stt/shared.tsx`. Remove auth/billing imports, authenticated fetch construction, `unauthenticated`/`not_pro` status variants, and the `case "anarlog"` hosted model branch from `useLLMConnection.ts`. Make `normalizeLLMProviderId` return `undefined` for `anarlog` and `hyprnote`, and let the existing missing-provider state prompt the user to choose a retained provider.

In STT capability and execution code, distinguish on-device Soniqo/Apple/local-file providers from the removed Anarlog cloud provider. Change legacy `anarlog/cloud` to unconfigured during settings hydration in `settings/queries.ts`; do not change stored direct-provider API keys.

- [x] **Step 5: Rerun focused tests and typecheck**

```bash
corepack pnpm --filter @anlg/desktop test -- src/audio-player/timeline.test.tsx src/stt/capabilities.test.ts src/ai/hooks/useLLMConnection.test.ts src/settings/providers.test.ts
corepack pnpm --filter @anlg/desktop typecheck
```

Expected: tests pass and provider code has no auth/billing import.

- [x] **Step 6: Commit Task 2**

```bash
git add apps/desktop/src/audio-player apps/desktop/src/settings/dictionary apps/desktop/src/settings/automations apps/desktop/src/templates apps/desktop/src/settings/appearance apps/desktop/src/settings/plan-gate.tsx apps/desktop/src/settings/plan-gate.test.tsx apps/desktop/src/settings/ai apps/desktop/src/ai/hooks/useLLMConnection.ts apps/desktop/src/ai/hooks/useLLMConnection.test.ts apps/desktop/src/stt apps/desktop/src/settings/queries.ts
git commit -m "refactor: make local AI and desktop features account independent"
```

### Task 3: Remove collaborative teams and note sharing

**Files:**
- Modify: `apps/desktop/src/session/hooks/useDeleteSession.test.tsx`
- Modify: `apps/desktop/src/session/hooks/useDeleteSession.ts`
- Modify: `apps/desktop/src/session/components/outer-header/index.tsx`
- Modify: `apps/desktop/src/session/components/note-input/index.tsx`
- Modify: `apps/desktop/src/session/components/note-input/raw.tsx`
- Modify: `apps/desktop/src/session/components/note-input/enhanced/editor.tsx`
- Modify: `apps/desktop/src/sidebar/index.tsx`
- Modify: `apps/desktop/src/sidebar/index.test.tsx`
- Modify: `apps/desktop/src/sidebar/timeline/index.tsx`
- Modify: `apps/desktop/src/shared/main/tab-content.tsx`
- Modify: `apps/desktop/src/shared/main/layout-widths.ts`
- Modify: `apps/desktop/src/shared/desktop-tab-lifecycle.ts`
- Modify: `apps/desktop/src/shared/open-note-dialog.tsx`
- Modify: `apps/desktop/src/shared/hooks/useDeeplinkHandler.ts`
- Create: `apps/desktop/src/shared/owner-user.test.ts`
- Modify: `apps/desktop/src/shared/owner-user.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/schema.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/basic.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/navigation.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/restore.ts`
- Modify: `apps/desktop/src/store/zustand/tabs/pinned-persistence.ts`
- Delete: `apps/desktop/src/settings/team/`
- Delete: `apps/desktop/src/session-sharing/`
- Delete: `apps/desktop/src/shared-notes/`
- Delete: `apps/desktop/src/enterprise-capture/`
- Delete: `apps/desktop/src/sidebar/shared-notes.tsx`
- Delete: `apps/desktop/src/settings/general/default-share-access.tsx`

**Interfaces:**
- Consumes: local `softDeleteSession`, `finalizeSessionDeletion`, undo-delete store, local session tabs, and ordinary note editor state.
- Produces: local-only note deletion and tab/editor models with no shared-session variants.

- [x] **Step 1: Replace remote deletion tests with a local-only assertion and confirm RED**

In `useDeleteSession.test.tsx`, remove Supabase/share mocks and remote-revocation tests. Add:

```tsx
it("finalizes a local deletion without remote cleanup", async () => {
  const { result } = renderHook(() => useDeleteSession());
  act(() => result.current("session-1"));
  await waitFor(() => expect(mocks.addDeletion).toHaveBeenCalledOnce());

  const finalize = mocks.addDeletion.mock.calls[0]?.[1] as () => Promise<void>;
  await act(async () => finalize());

  expect(mocks.finalizeSessionDeletion).toHaveBeenCalledWith("session-1");
});
```

Run:

```bash
corepack pnpm --filter @anlg/desktop test -- src/session/hooks/useDeleteSession.test.tsx
```

Expected: the old implementation still imports and invokes remote cleanup.

- [x] **Step 2: Make deletion entirely local**

Remove Supabase, Cloud API, session-sharing, and shared-cache imports and helpers from `useDeleteSession.ts`. The main-window finalizer becomes:

```ts
const finalize = () =>
  commit
    .then(async (deletedData) => {
      if (!deletedData) return;
      await finalizeSessionDeletion(sessionId);
    })
    .catch(() => undefined);
```

Keep optimistic deletion, undo, meeting stop, ignored-event rollback, cross-window event delivery, and note-window closing unchanged.

- [x] **Step 3: Add a failing sidebar assertion for the removed shared-notes surface**

In `sidebar/index.test.tsx`, retain the existing local timeline mocks and add:

```tsx
it("does not render shared notes navigation", () => {
  render(<Sidebar />);
  expect(screen.queryByText("Shared with me")).toBeNull();
});
```

Run the test and confirm it fails while `SharedNotesNav` is mounted.

- [x] **Step 4: Remove sharing UI, shared tabs, and feature directories**

Remove the share button and share/editor activity hooks from session headers and editors. Remove Shared Notes navigation, cache badges, tab rendering, width cases, open-note merging, and shared-note deep-link handling. Remove `shared_sessions` and `shared_note_preview` from TypeScript tab unions and delete their behavior tests from `store/zustand/tabs/basic.test.ts`. Delete the team, session-sharing, and shared-notes directories and their tests.

- [x] **Step 5: Prove Microsoft Teams capture remains**

Run the pre-existing source-app and remote-meeting tests:

```bash
corepack pnpm --filter @anlg/desktop test -- src/session/source-apps.test.ts src/session/hooks/useRemoteMeeting.test.ts src/session/hooks/useDeleteSession.test.tsx src/store/zustand/tabs/basic.test.ts src/sidebar/index.test.tsx
corepack pnpm --filter @anlg/desktop typecheck
```

Expected: local deletion/tab tests pass and Microsoft Teams detection tests remain green.

- [x] **Step 6: Commit Task 3**

```bash
git add apps/desktop/src/session apps/desktop/src/sidebar apps/desktop/src/shared apps/desktop/src/store/zustand/tabs apps/desktop/src/settings/team apps/desktop/src/session-sharing apps/desktop/src/shared-notes apps/desktop/src/settings/general/default-share-access.tsx
git commit -m "refactor: remove team workspaces and note sharing"
```

### Task 4: Remove Cloud API, attachment backup, and account-backed integrations

**Files:**
- Create: `apps/desktop/src/main/lifecycle.test.tsx`
- Modify: `apps/desktop/src/main/lifecycle.tsx`
- Modify: `apps/desktop/src/shared/main-app-layout.test.tsx`
- Modify: `apps/desktop/src/shared/main-app-layout.tsx`
- Modify: `apps/desktop/src/settings/developers/index.tsx`
- Modify: `apps/desktop/src/settings/developers/index.test.tsx`
- Modify: `apps/desktop/src/calendar/components/sidebar.tsx`
- Modify: `apps/desktop/src/calendar/components/sidebar.test.tsx`
- Modify: `apps/desktop/src/calendar/components/calendar-view.tsx`
- Modify: `apps/desktop/src/imports/screen.tsx`
- Modify: `apps/desktop/src/imports/screen.test.tsx`
- Modify: `apps/desktop/src/automations/engine.ts`
- Modify: `apps/desktop/src/automations/engine.test.ts`
- Modify: `apps/desktop/src/settings/automations/starter-config.tsx`
- Modify: `apps/desktop/src/settings/todo/provider-content.tsx`
- Delete: `apps/desktop/src/settings/todo/github.tsx`
- Delete: `apps/desktop/src/calendar/components/oauth/`
- Delete: `apps/desktop/src/imports/connected-import.ts`
- Delete: `apps/desktop/src/imports/connected-import.test.ts`
- Delete: `apps/desktop/src/services/meeting-import-sync.tsx`
- Delete: `apps/desktop/src/services/meeting-import-sync.test.tsx`
- Delete: `apps/desktop/src/cloud-api/`
- Delete: `apps/desktop/src/attachment-sync/`
- Delete: `apps/desktop/src/settings/developers/cloud-api.tsx`

**Interfaces:**
- Consumes: local main lifecycle, Apple Calendar, file-based import, local webhook actions, and local developer tools.
- Produces: lifecycle and settings compositions with no account-backed network service mounted or selectable.

- [ ] **Step 1: Add failing lifecycle composition assertions**

Update `main/lifecycle.test.tsx` and `shared/main-app-layout.test.tsx` to assert only local services:

```tsx
it("mounts no account-backed background service", () => {
  render(<ClassicMainServices />);
  expect(screen.queryByTestId("attachment-transfer-lifecycle")).toBeNull();
  expect(screen.queryByTestId("cloud-api-backfill-lifecycle")).toBeNull();
  expect(screen.queryByTestId("owned-shared-note-publisher")).toBeNull();
});
```

```tsx
it("renders the local application content directly", () => {
  render(<MainAppLayout />);
  expect(screen.getByTestId("outlet")).toBeTruthy();
  expect(screen.queryByTestId("meeting-import-sync")).toBeNull();
});
```

Run both tests and confirm they fail against the current service composition.

- [ ] **Step 2: Remove cloud lifecycles and authenticated tool headers**

Remove attachment transfer, Cloud API backfill, shared-note services, and sync repair from `ClassicMainServices`. Remove `useAuth` and `getAuthHeaders` from `ToolRegistration`; call `buildChatTools` without authenticated headers, deleting the optional parameter from the local tool builder if no retained tool uses it. Remove `MeetingImportSync` and `EnterpriseCaptureSync` from `MainAppLayout`.

- [ ] **Step 3: Remove account-backed settings and retain local alternatives**

Remove Cloud API from Developer settings. Remove Google/Outlook OAuth calendar cards while retaining Apple Calendar. Remove connected imports while retaining file/directory import parsers and local detection. Remove Slack/Notion/Nango automation actions while retaining local webhook actions. Remove GitHub/Linear account-backed todo providers while retaining local Apple Reminders where supported.

- [ ] **Step 4: Delete cloud feature modules and rerun focused tests**

Delete the listed Cloud API, attachment-sync, OAuth, connected-import, and meeting-import-sync files only after their production imports are gone.

Run:

```bash
corepack pnpm --filter @anlg/desktop test -- src/main/lifecycle.test.tsx src/shared/main-app-layout.test.tsx src/settings/developers/index.test.tsx src/calendar/components/sidebar.test.tsx src/imports/screen.test.tsx src/automations/engine.test.ts
corepack pnpm --filter @anlg/desktop typecheck
```

Expected: focused tests and typecheck pass without the deleted modules.

- [ ] **Step 5: Commit Task 4**

```bash
git add apps/desktop/src/main apps/desktop/src/shared/main-app-layout.tsx apps/desktop/src/shared/main-app-layout.test.tsx apps/desktop/src/settings/developers apps/desktop/src/calendar apps/desktop/src/imports apps/desktop/src/automations apps/desktop/src/settings/automations apps/desktop/src/settings/todo apps/desktop/src/services/meeting-import-sync.tsx apps/desktop/src/services/meeting-import-sync.test.tsx apps/desktop/src/cloud-api apps/desktop/src/attachment-sync
git commit -m "refactor: remove account backed desktop services"
```

### Task 5: Remove React auth, billing, and sync infrastructure

**Files:**
- Modify: `apps/desktop/src/shared/main-app-layout.test.tsx`
- Modify: `apps/desktop/src/shared/main-app-layout.tsx`
- Modify: `apps/desktop/src/main/lifecycle.tsx`
- Modify: `apps/desktop/src/shared/hooks/useDeeplinkHandler.ts`
- Modify: `apps/desktop/src/sidebar/toast/index.tsx`
- Modify: `apps/desktop/src/lock/gate.tsx`
- Modify: `apps/desktop/src/lock/notes.ts`
- Modify: `apps/desktop/src/lock/store.ts`
- Modify: `apps/desktop/src/instruction/index.tsx`
- Modify: `apps/desktop/src/routes/app/instruction.tsx`
- Modify: `apps/desktop/src/devtools-bar/actions.tsx`
- Modify: `apps/desktop/src/devtools-bar/index.tsx`
- Modify: `apps/desktop/src/settings/schema.ts`
- Modify: `apps/desktop/src/settings/legacy-snapshots.test.ts`
- Modify: `apps/desktop/src/settings/queries.ts`
- Modify: `apps/desktop/src/env.ts`
- Modify: `apps/desktop/package.json`
- Modify: `pnpm-lock.yaml`
- Delete: `apps/desktop/src/auth/`
- Delete: `apps/desktop/src/billing/`
- Delete: `apps/desktop/src/settings/sync/`
- Delete: `apps/desktop/src/main/sync-status.tsx`
- Delete: `apps/desktop/src/main/sync-status.test.tsx`
- Delete: `apps/desktop/src/shared/billing.ts`
- Delete: `apps/desktop/src/shared/billing.test.ts`
- Delete: `apps/desktop/src/shared/trial-start.ts`
- Delete: `apps/desktop/src/settings/general/e2ee-setup.tsx`

**Interfaces:**
- Consumes: local root layout, local database identity, retained settings store, and local lock behavior.
- Produces: a desktop frontend with no auth/billing context and no Supabase or attachment-sync JavaScript dependency.

- [ ] **Step 1: Change root-layout tests to forbid providers and confirm RED**

Remove auth/billing test mocks from `shared/main-app-layout.test.tsx` and assert that the outlet renders directly:

```tsx
it("does not require auth or billing providers", () => {
  render(<MainAppLayout />);
  expect(screen.getByTestId("outlet")).toBeTruthy();
  expect(screen.queryByTestId("auth-provider")).toBeNull();
});
```

Run the test and confirm it fails while `AuthProvider` remains.

- [ ] **Step 2: Remove remaining auth consumers and providers**

Use `rg -l 'from "~/auth|from "\.\.?/auth|useAuth|useBillingAccess' apps/desktop/src --glob '!**/*.test.*'` as the exact remaining-work list. For each retained local component, use `useOwnerUserId` when existing rows determine ownership, use `DEFAULT_USER_ID` only for a new empty database, or remove account-only behavior. Remove auth-only toasts, deep links, instruction handoffs, developer actions, and billing dialogs. Render `MainAppContent` directly from `MainAppLayout`.

- [ ] **Step 3: Characterize legacy local ownership before removing auth**

Create `shared/owner-user.test.ts` with `useLiveQuery` mocked to execute the
provided `mapRows` callback:

```tsx
it("keeps using the owner recorded on existing local sessions", () => {
  mocks.rows = [{ user_id: "prior-supabase-user" }];
  const { result } = renderHook(() => useOwnerUserId());
  expect(result.current).toBe("prior-supabase-user");
});

it("falls back to the deterministic local owner for a new database", () => {
  mocks.rows = [];
  const { result } = renderHook(() => useOwnerUserId());
  expect(result.current).toBe(DEFAULT_USER_ID);
});
```

Run the test and confirm both characterization cases pass before auth files are
deleted. Preserve the owner-query behavior; do not rewrite old rows to a new
owner ID.

- [ ] **Step 4: Normalize obsolete settings without cloud work**

Remove `cloud_sync_enabled` and account/billing preferences from the active settings schema. Keep legacy snapshot parsing tolerant: old keys are ignored, hosted provider selections become empty, and direct BYOK keys remain. Add an assertion to `settings/legacy-snapshots.test.ts`:

```ts
expect(normalized.current_llm_provider).not.toBe("anarlog");
expect(normalized.current_stt_provider).not.toBe("anarlog");
expect(normalized.ai_providers).toEqual(legacy.ai_providers);
```

Run the test first and observe the legacy hosted selections survive, then implement normalization.

- [ ] **Step 5: Delete auth/billing/sync modules and remove package dependencies**

Delete the listed directories and E2EE sync setup after production imports are zero. Remove `@anlg/supabase`, `@supabase/supabase-js`, `@anlg/plugin-attachment-sync`, and `@anlg/pricing` from `apps/desktop/package.json` when `rg` shows no retained desktop import. Remove `.env.supabase` from desktop Tauri scripts. Regenerate `pnpm-lock.yaml` with:

```bash
corepack pnpm install --lockfile-only
```

- [ ] **Step 6: Run the auth-free frontend verification**

```bash
corepack pnpm --filter @anlg/desktop test -- src/shared/main-app-layout.test.tsx src/shared/owner-user.test.ts src/settings/legacy-snapshots.test.ts src/lock/gate.test.tsx src/onboarding/config.test.ts src/sidebar/settings.test.tsx
corepack pnpm --filter @anlg/desktop typecheck
```

Then require both searches to produce no output:

```bash
rg -n 'from "~/auth|useAuth|useBillingAccess|AuthProvider|BillingProvider' apps/desktop/src --glob '!**/*.test.*'
rg -n '@anlg/supabase|@supabase/supabase-js|@anlg/plugin-attachment-sync' apps/desktop/src apps/desktop/package.json
```

- [ ] **Step 7: Commit Task 5**

```bash
git add apps/desktop/src apps/desktop/package.json pnpm-lock.yaml
git commit -m "refactor: remove desktop auth billing and sync frontend"
```

### Task 6: Stop the native desktop from loading CloudSync or auth plugins

**Files:**
- Modify: `apps/desktop/src-tauri/src/db.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `plugins/db/src/lib.rs`
- Modify: `plugins/db/Cargo.toml`
- Modify: `crates/db-core/Cargo.toml`
- Modify: `crates/db-core/src/lib.rs`
- Modify: `crates/db-change/Cargo.toml`
- Modify: `crates/db-change/src/lib.rs`
- Modify: `crates/db-app/Cargo.toml`
- Modify: `crates/db-app/src/lib.rs`
- Modify: `crates/db-reactive/Cargo.toml`
- Modify: `Cargo.lock`

**Interfaces:**
- Consumes: normal `Db::open`/SQLite behavior and `tauri_plugin_db::init(db)`.
- Produces: a local-only feature path in which the desktop dependency tree does not compile, bundle, initialize, or load `anlg-cloudsync`, while non-desktop workspace consumers may retain the default CloudSync feature.

- [ ] **Step 1: Add a failing native composition test**

In the existing `apps/desktop/src-tauri/src/lib.rs` test module, replace the cloud lifecycle capability assertion with a local-only assertion:

```rust
#[test]
fn main_capability_excludes_cloudsync_and_auth_commands() {
    let capability = include_str!("../capabilities/main.json");
    assert!(!capability.contains("cloudsync"));
    assert!(!capability.contains("auth:"));
    assert!(!capability.contains("attachment-sync:"));
}
```

Run:

```bash
cargo test -p desktop main_capability_excludes_cloudsync_and_auth_commands
```

Expected: failure because native capabilities/plugins remain.

- [ ] **Step 2: Remove desktop CloudSync configuration and plugins**

Delete `cloudsync_runtime_config_from_env`, its parsing helpers/tests, and the CloudSync constants from `src-tauri/src/db.rs`. Change desktop initialization from `init_with_cloudsync(db, cloudsync_config)` to `tauri_plugin_db::init(db)`. Remove `tauri_plugin_auth` and `tauri_plugin_attachment_sync` registration and dependencies. Remove CloudSync, auth, and attachment-sync permissions from desktop capability JSON files.

- [ ] **Step 3: Feature-gate the native CloudSync implementation**

Add default-on `cloudsync` features to the shared database crates so existing non-Corola consumers retain current behavior:

```toml
[features]
default = ["cloudsync"]
cloudsync = ["dep:anlg-cloudsync"]

[dependencies]
anlg-cloudsync = { workspace = true, optional = true }
```

Gate CloudSync-only modules, error variants, fields, initialization paths, and exports with `#[cfg(feature = "cloudsync")]`. Provide the ordinary SQLite open path without extension hooks when the feature is absent. Propagate the feature through `db-change`, `db-app`, `db-reactive`, and `tauri-plugin-db`. Configure the desktop's dependency path with `default-features = false`; keep shared-crate defaults on so API/CLI behavior does not change.

- [ ] **Step 4: Verify the local-only Rust feature path**

```bash
cargo test -p desktop main_capability_excludes_cloudsync_and_auth_commands
cargo check -p desktop
cargo tree -p desktop -i cloudsync
```

Expected: tests/check pass and `cargo tree` reports that package `cloudsync` is not present in the desktop dependency graph.

Also verify the default shared path still compiles:

```bash
cargo check -p db-core --features cloudsync
cargo test -p db-core --features cloudsync
```

- [ ] **Step 5: Commit Task 6**

```bash
git add apps/desktop/src-tauri plugins/db crates/db-core crates/db-change crates/db-app crates/db-reactive Cargo.lock
git commit -m "refactor: remove CloudSync from the desktop runtime"
```

### Task 7: Verify the local-only dependency boundary

**Files:**
- Modify: `apps/desktop/src/env.ts`
- Create: `apps/desktop/src/env.test.ts`
- Modify: `apps/desktop/package.json`
- Modify: `docs/superpowers/plans/2026-09-04-local-only-feature-removal.md`

**Interfaces:**
- Consumes: the finished local-only desktop source tree and package manifest.
- Produces: observable environment tests plus repeatable frontend/native dependency-audit commands.

- [ ] **Step 1: Remove obsolete required environment definitions with an observable test**

Create `env.test.ts` and import the actual `env` object without defining account variables:

```ts
import { describe, expect, it } from "vitest";
import { env } from "./env";

describe("desktop environment", () => {
  it("starts without account service configuration", () => {
    expect("VITE_SUPABASE_URL" in env).toBe(false);
    expect("VITE_SUPABASE_ANON_KEY" in env).toBe(false);
    expect("VITE_PRO_PRODUCT_ID" in env).toBe(false);
  });
});
```

Run it and confirm RED because the fields still exist. Delete Supabase and
billing configuration from `env.ts`. Keep generic `VITE_APP_URL`/`VITE_API_URL`
only if a retained direct feature uses them; otherwise remove them too.

- [ ] **Step 2: Run explicit dependency audits**

Require these commands to produce no output/status matches:

```bash
rg -n 'from "~/auth|useAuth|useBillingAccess|AuthProvider|BillingProvider' apps/desktop/src --glob '!**/*.test.*'
rg -n '@anlg/supabase|@supabase/supabase-js|@anlg/plugin-attachment-sync' apps/desktop/src apps/desktop/package.json
test ! -d apps/desktop/src/auth
test ! -d apps/desktop/src/billing
test ! -d apps/desktop/src/attachment-sync
test ! -d apps/desktop/src/cloud-api
test ! -d apps/desktop/src/session-sharing
test ! -d apps/desktop/src/shared-notes
test ! -d apps/desktop/src/settings/sync
test ! -d apps/desktop/src/settings/team
```

If a search reports a retained production import, remove that concrete
consumer and rerun its nearest behavior test before repeating the audit.

- [ ] **Step 3: Run frontend verification**

```bash
corepack pnpm --filter @anlg/desktop test
corepack pnpm --filter @anlg/desktop typecheck
corepack pnpm lint
corepack pnpm fmt:check
```

Expected: all commands exit zero with no new warnings.

- [ ] **Step 4: Run native and repository-boundary verification**

```bash
cargo test -p desktop
cargo check -p desktop
cargo tree -p desktop -i cloudsync
rg -n 'supabase|cloudsync|CloudSync|session-sharing|shared-notes|CloudApi|BillingProvider|AuthProvider' apps/desktop/src apps/desktop/src-tauri apps/desktop/package.json
```

Expected: Rust commands pass; `cargo tree` reports no CloudSync dependency; the final search contains only documented legacy compatibility strings or test fixtures, with no runtime account/cloud import.

- [ ] **Step 5: Confirm local feature coverage**

```bash
corepack pnpm --filter @anlg/desktop test -- src/session/source-apps.test.ts src/session/queries.test.ts src/stt/capabilities.test.ts src/imports/parser.test.ts src/calendar/queries.test.ts src/settings/providers.test.ts
```

Expected: local note, meeting detection, STT, import, calendar, and provider tests pass.

- [ ] **Step 6: Record verification and commit the completed removal**

Mark each completed checkbox in this plan and append the exact command results under a `## Verification Results` heading. Then commit:

```bash
git add apps/desktop docs/superpowers/plans/2026-09-04-local-only-feature-removal.md
git commit -m "test: enforce the local-only desktop boundary"
```

## Follow-up plan

After every acceptance check above passes, create and execute
`docs/superpowers/plans/2026-09-04-corola-rebrand.md`. That plan owns product
names, bundle identifiers, deep-link schemes, original icon generation,
installer/native assets, removal of retained Anarlog URLs, and update signing
configuration. No rebrand file may be changed during the removal plan.
