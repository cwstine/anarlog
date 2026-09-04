import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  windowLabel: "main",
}));

vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <div data-testid="outlet" />,
  useNavigate: () => vi.fn(),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({}),
}));

vi.mock("@anlg/plugin-windows", () => ({
  events: {},
  getCurrentWebviewWindowLabel: () => mocks.windowLabel,
}));

vi.mock("./useNewNote", () => ({
  openNewNoteAndListen: vi.fn(),
  openSessionAndListen: vi.fn(),
  useNewNote: () => vi.fn(),
}));

vi.mock("~/session/queries", () => ({
  getOrCreateSessionForEventId: vi.fn(),
}));

vi.mock("~/shared/hooks/useMountEffect", () => ({
  useMountEffect: vi.fn(),
}));

vi.mock("~/sidebar/toast/undo-delete-toast", () => ({
  UndoDeleteToast: () => null,
}));

vi.mock("~/store/zustand/tabs", () => ({
  isTabInputSupported: vi.fn(),
  useTabs: () => vi.fn(),
}));

import MainAppLayout from "./main-app-layout";

describe("MainAppLayout", () => {
  beforeEach(() => {
    mocks.windowLabel = "main";
  });

  afterEach(cleanup);

  it("does not require auth or billing providers", () => {
    render(<MainAppLayout />);

    expect(screen.getByTestId("outlet")).toBeTruthy();
    expect(screen.queryByTestId("auth-provider")).toBeNull();
    expect(screen.queryByTestId("meeting-import-sync")).toBeNull();
  });

  it("renders the same local content in secondary windows", () => {
    mocks.windowLabel = "note";

    render(<MainAppLayout />);

    expect(screen.getByTestId("outlet")).toBeTruthy();
  });
});
