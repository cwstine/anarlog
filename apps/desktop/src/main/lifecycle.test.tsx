import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useRouteContext: () => ({ aiTaskStore: null }),
}));

vi.mock("~/ai/hooks", () => ({
  useLanguageModel: () => null,
  useLLMConnection: () => ({ conn: null }),
}));

vi.mock("~/calendar/queries", () => ({ searchCalendarEvents: vi.fn() }));
vi.mock("~/chat/components/use-session-tab", () => ({
  useSessionTab: () => ({
    getSessionId: vi.fn(),
    getEnhancedNoteId: vi.fn(),
  }),
}));
vi.mock("~/chat/tools", () => ({ buildChatTools: () => ({}) }));
vi.mock("~/contacts/queries", () => ({ searchContacts: vi.fn() }));
vi.mock("~/contexts/tool", () => ({ useRegisterTools: vi.fn() }));
vi.mock("~/search/contexts/engine", () => ({
  useSearchEngine: () => ({ search: vi.fn() }),
}));
vi.mock("~/services/enhancer", () => ({ initEnhancerService: vi.fn() }));
vi.mock("~/shared/config", () => ({ useConfigValue: () => "" }));
vi.mock("~/shared/desktop-tab-lifecycle", () => ({
  useDesktopTabLifecycle: vi.fn(),
}));
vi.mock("~/sidebar/note-filter", () => ({
  folderIdForNewNote: () => null,
  useSidebarNotes: { getState: () => ({}) },
}));
vi.mock("~/store/zustand/tabs", () => ({
  useTabs: Object.assign(() => vi.fn(), {
    getState: () => ({ openNew: vi.fn() }),
  }),
}));
vi.mock("~/stt/live-capture-recovery", () => ({
  LiveCaptureRecovery: () => <div data-testid="live-capture-recovery" />,
}));
vi.mock("~/stt/scheduled-auto-start", () => ({
  ScheduledMeetingAutoStart: () => <div data-testid="scheduled-auto-start" />,
}));
vi.mock("~/stt/window-control", () => ({
  MainListenerControlBridge: () => <div data-testid="listener-control" />,
}));

import { ClassicMainServices } from "./lifecycle";

describe("ClassicMainServices", () => {
  it("mounts no account-backed background service", () => {
    render(<ClassicMainServices />);

    expect(screen.queryByTestId("attachment-transfer-lifecycle")).toBeNull();
    expect(screen.queryByTestId("cloud-api-backfill-lifecycle")).toBeNull();
    expect(screen.getByTestId("live-capture-recovery")).toBeTruthy();
    expect(screen.getByTestId("scheduled-auto-start")).toBeTruthy();
    expect(screen.getByTestId("listener-control")).toBeTruthy();
  });
});
