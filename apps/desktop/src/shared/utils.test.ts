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
    ["com.corola.desktop", "corola"],
    ["com.corola.staging", "corola-staging"],
    ["com.corola.dev", "corola-dev"],
    ["com.hyprnote.stable", "corola"],
    ["com.hyprnote.Hyprnote", "corola"],
    ["com.hyprnote.staging", "corola-staging"],
    ["com.hyprnote.dev", "corola-dev"],
    ["so.anarlog.Anarlog", "corola"],
    ["unknown", "corola"],
  ])("maps %s to %s", async (identifier, scheme) => {
    mocks.getIdentifier.mockResolvedValue(identifier);

    await expect(getScheme()).resolves.toBe(scheme);
  });
});
