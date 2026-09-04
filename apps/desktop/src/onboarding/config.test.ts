import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ platform: "macos" }));

vi.mock("@tauri-apps/plugin-os", () => ({
  platform: () => mocks.platform,
}));

import { getInitialStep, getNextStep, getPrevStep } from "./config";

describe("local onboarding sequence", () => {
  beforeEach(() => {
    mocks.platform = "macos";
  });

  it("does not include an account step on macOS", () => {
    expect(getInitialStep()).toBe("permissions");
    expect(getNextStep("permissions")).toBe("calendar");
    expect(getPrevStep("calendar")).toBe("permissions");
  });

  it("starts with the calendar on other platforms", () => {
    mocks.platform = "windows";

    expect(getInitialStep()).toBe("calendar");
  });
});
