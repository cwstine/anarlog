import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/shared/hooks/useNativeContextMenu", () => ({
  useNativeContextMenu: () => vi.fn(),
}));

vi.mock("./provider", () => ({
  useAudioPlayer: () => ({
    registerContainer: vi.fn(),
    state: "stopped",
    pause: vi.fn(),
    resume: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    deleteRecording: vi.fn(),
    isDeletingRecording: false,
  }),
  useAudioTime: () => ({ current: 0, total: 60 }),
}));

vi.mock("./timeline-shell", () => ({
  TimelineMeta: ({ children }: { children: ReactNode }) => <>{children}</>,
  TimelineShell: ({ meta }: { meta: ReactNode }) => <div>{meta}</div>,
}));

import { Timeline } from "./timeline";

describe("Timeline", () => {
  afterEach(cleanup);

  it("shows playback-rate controls without a plan", () => {
    render(<Timeline />);

    expect(screen.getByRole("button", { name: "1x" })).toBeTruthy();
  });
});
