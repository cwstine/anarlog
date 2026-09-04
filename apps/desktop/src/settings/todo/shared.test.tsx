import { describe, expect, it } from "vitest";

import { TODO_PROVIDERS } from "./shared";

describe("todo providers", () => {
  it("contains only the local Apple Reminders provider", () => {
    expect(TODO_PROVIDERS.map((provider) => provider.id)).toEqual([
      "apple-reminders",
    ]);
    expect(TODO_PROVIDERS[0]).not.toHaveProperty("nangoIntegrationId");
  });
});
