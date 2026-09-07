import { describe, expect, it } from "vitest";

import {
  normalizeAppIconPreference,
  resolveAppIconName,
  resolveDockIconName,
} from "./icon";

describe("app icon preference", () => {
  it("normalizes every stored preference to the single Corola icon", () => {
    expect(normalizeAppIconPreference(undefined)).toBe("default");
    expect(normalizeAppIconPreference("unknown")).toBe("default");
    expect(normalizeAppIconPreference("dev")).toBe("default");
    expect(normalizeAppIconPreference("journal")).toBe("default");
    expect(normalizeAppIconPreference("walnut")).toBe("default");
  });

  it("resolves the default icon from the app channel", () => {
    expect(resolveAppIconName("default", "com.corola.desktop")).toBe("stable");
    expect(resolveAppIconName("default", "com.corola.staging")).toBe("staging");
    expect(resolveAppIconName("default", "com.corola.dev")).toBe("dev");
  });

  it("uses one channel icon in every color theme", () => {
    expect(
      resolveDockIconName("default", "system", false, "com.corola.dev"),
    ).toBe("dev");
    expect(
      resolveDockIconName("default", "system", true, "com.corola.dev"),
    ).toBe("dev");
    expect(
      resolveDockIconName("default", "dark", false, "com.corola.desktop"),
    ).toBe("stable");
  });
});
