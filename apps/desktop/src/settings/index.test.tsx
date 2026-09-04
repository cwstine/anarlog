import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/settings/hydration-boundary", () => ({
  SettingsHydrationBoundary: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("./general", () => ({
  SettingsApp: () => <div>General settings</div>,
  SettingsMeetings: () => null,
  SettingsNotifications: () => null,
  SettingsPermissions: () => null,
}));

vi.mock("./todo", () => ({ SettingsTodo: () => null }));
vi.mock("~/settings/ai/llm", () => ({ LLM: () => null }));
vi.mock("~/settings/ai/stt", () => ({ STT: () => null }));
vi.mock("~/settings/appearance", () => ({ SettingsAppearance: () => null }));
vi.mock("~/settings/developers", () => ({ SettingsDevelopers: () => null }));
vi.mock("~/settings/dictionary", () => ({ SettingsDictionary: () => null }));
vi.mock("~/settings/imports", () => ({ SettingsImports: () => null }));
vi.mock("~/settings/privacy", () => ({ SettingsPrivacy: () => null }));
vi.mock("~/shared/main", () => ({
  StandardContentWrapper: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { TabContentSettings } from "./index";

import { createSettingsTab } from "~/store/zustand/tabs/test-utils";

describe("TabContentSettings", () => {
  afterEach(cleanup);

  it("lets settings pages scroll and shrink instead of clipping", () => {
    render(
      <TabContentSettings
        tab={createSettingsTab({
          active: true,
          state: { tab: "app" },
        })}
      />,
    );

    const shell = document.querySelector("[data-settings-content]");
    expect(shell?.className).toContain("min-h-0");
    expect(shell?.className).toContain("min-w-0");

    const scroller = shell?.querySelector(".overflow-y-auto");
    expect(scroller?.className).toContain("min-h-0");
    expect(scroller?.className).toContain("min-w-0");
    expect(scroller?.className).toContain("overflow-x-hidden");
  });

  it("falls back from obsolete hosted settings pages to General", () => {
    for (const tab of ["account", "sync", "team"] as const) {
      const { unmount } = render(
        <TabContentSettings
          tab={createSettingsTab({
            active: true,
            state: { tab: tab as never },
          })}
        />,
      );

      expect(screen.getByText("General settings")).toBeTruthy();
      unmount();
    }
  });
});
