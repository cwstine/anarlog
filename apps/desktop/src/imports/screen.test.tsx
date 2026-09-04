import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detectImportSources: vi.fn(),
  importMeetingFiles: vi.fn(),
  readTextFiles: vi.fn(),
  selectFiles: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: mocks.selectFiles,
}));

vi.mock("@anlg/plugin-importer", () => ({
  commands: { readTextFiles: mocks.readTextFiles },
}));

vi.mock("./detection", () => ({
  detectImportSources: mocks.detectImportSources,
}));

vi.mock("./queries", () => ({
  EMPTY_MEETING_IMPORT_HISTORY: [],
  importMeetingFiles: mocks.importMeetingFiles,
  useMeetingImportHistory: () => ({ data: [] }),
}));

vi.mock("./termination-pause", () => ({
  pauseCompetingApplicationTermination: vi.fn(),
}));

import { MEETING_IMPORT_PROVIDERS } from "./providers";
import { MeetingImportScreen } from "./screen";

function renderImports(
  props: {
    compact?: boolean;
    onNoSourcesDetected?: () => void;
    secondaryAction?: ReactNode;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingImportScreen {...props} />
    </QueryClientProvider>,
  );
}

function mockDetected(ids: string[]) {
  mocks.detectImportSources.mockResolvedValue(
    MEETING_IMPORT_PROVIDERS.filter((provider) =>
      ids.includes(provider.id),
    ).map((provider) => ({
      ...provider,
      installedAppId: `app.${provider.id}`,
      iconUrl: `data:image/png;base64,${provider.id}`,
    })),
  );
}

describe("MeetingImportScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectFiles.mockResolvedValue(null);
    mocks.readTextFiles.mockResolvedValue({ status: "ok", data: [] });
    mocks.importMeetingFiles.mockResolvedValue({
      imported: 0,
      matched: 0,
      conflicts: 0,
      errors: 0,
    });
  });

  afterEach(cleanup);

  it("offers only local file import for every detected app", async () => {
    mockDetected(["granola", "slack-huddles", "zoom"]);

    renderImports();

    expect(await screen.findByText("Granola")).toBeTruthy();
    expect(screen.getByText("Slack Huddles")).toBeTruthy();
    expect(screen.getByText("Zoom")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Choose files" }),
    ).toHaveLength(3);
    expect(screen.queryByText("Connect & import")).toBeNull();
    expect(screen.queryByText("Sync now")).toBeNull();
    expect(screen.queryByText("Sign in to connect")).toBeNull();
  });

  it("imports selected files without an account", async () => {
    mockDetected(["granola"]);
    mocks.selectFiles.mockResolvedValue(["/tmp/export.json"]);
    mocks.readTextFiles.mockResolvedValue({
      status: "ok",
      data: [{ path: "/tmp/export.json", content: "{}" }],
    });

    renderImports();
    fireEvent.click(
      await screen.findByRole("button", { name: "Choose files" }),
    );

    await waitFor(() => {
      expect(mocks.importMeetingFiles).toHaveBeenCalledWith("granola", [
        { path: "/tmp/export.json", content: "{}" },
      ]);
    });
  });

  it("uses official Meet and Zoom marks", async () => {
    mocks.detectImportSources.mockResolvedValue([
      {
        ...MEETING_IMPORT_PROVIDERS.find(
          (provider) => provider.id === "google-meet",
        )!,
        installedAppId: "google-meet",
      },
      {
        ...MEETING_IMPORT_PROVIDERS.find((provider) => provider.id === "zoom")!,
        installedAppId: "us.zoom.xos",
      },
    ]);

    const { container } = renderImports();

    expect(await screen.findByText("Google Meet")).toBeTruthy();
    expect(
      container.querySelector('img[src="/assets/google-meet.svg"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('img[src="/assets/zoom-icon.svg"]'),
    ).toBeTruthy();
  });

  it("renders the detected list in the compact onboarding layout", async () => {
    mockDetected(["granola", "slack-huddles"]);

    const { container } = renderImports({ compact: true });

    expect(await screen.findByText("Granola")).toBeTruthy();
    expect(screen.getByText("Slack Huddles")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Choose files" }),
    ).toHaveLength(2);
    expect(container.querySelector(".max-h-80")).toBeTruthy();
  });

  it("renders the secondary action before anything is imported", async () => {
    mockDetected(["granola"]);

    renderImports({
      compact: true,
      secondaryAction: <button type="button">Skip for now</button>,
    });

    expect(
      await screen.findByRole("button", { name: "Skip for now" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("shows the empty state and reports an empty detection", async () => {
    const onNoSourcesDetected = vi.fn();
    mockDetected([]);

    renderImports({ onNoSourcesDetected });

    expect(await screen.findByText("No apps found.")).toBeTruthy();
    await waitFor(() => expect(onNoSourcesDetected).toHaveBeenCalledOnce());
  });

  it("does not report an empty result while detection is pending", async () => {
    const onNoSourcesDetected = vi.fn();
    mocks.detectImportSources.mockReturnValue(new Promise(() => {}));

    renderImports({ onNoSourcesDetected });

    expect(
      await screen.findByText("Checking installed meeting assistants…"),
    ).toBeTruthy();
    expect(onNoSourcesDetected).not.toHaveBeenCalled();
  });

  it("does not report an empty result when detection fails", async () => {
    const onNoSourcesDetected = vi.fn();
    mocks.detectImportSources.mockRejectedValue(new Error("Detection failed"));

    renderImports({ onNoSourcesDetected });

    expect(await screen.findByText("Detection failed")).toBeTruthy();
    expect(onNoSourcesDetected).not.toHaveBeenCalled();
  });
});
