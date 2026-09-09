import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getIdentifier: vi.fn(),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getIdentifier: mocks.getIdentifier,
}));

import { getScheme } from "./utils";

describe("getScheme", () => {
  beforeEach(() => {
    mocks.getIdentifier.mockReset();
  });

  it.each([
    ["com.minuteswise.desktop", "minuteswise"],
    ["com.minuteswise.staging", "minuteswise-staging"],
    ["com.minuteswise.dev", "minuteswise-dev"],
    ["com.corola.desktop", "minuteswise"],
    ["com.corola.staging", "minuteswise-staging"],
    ["com.corola.dev", "minuteswise-dev"],
    ["com.hyprnote.stable", "minuteswise"],
    ["com.hyprnote.Hyprnote", "minuteswise"],
    ["com.hyprnote.staging", "minuteswise-staging"],
    ["com.hyprnote.dev", "minuteswise-dev"],
    ["so.anarlog.Corola", "minuteswise"],
    ["unknown", "minuteswise"],
  ])("maps %s to %s", async (identifier, scheme) => {
    mocks.getIdentifier.mockResolvedValue(identifier);

    await expect(getScheme()).resolves.toBe(scheme);
  });
});
