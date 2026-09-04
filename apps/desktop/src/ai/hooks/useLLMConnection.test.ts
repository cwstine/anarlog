import { describe, expect, it } from "vitest";

import { normalizeLLMProviderId } from "./useLLMConnection";

describe("normalizeLLMProviderId", () => {
  it("removes current and legacy hosted provider ids", () => {
    expect(normalizeLLMProviderId("anarlog")).toBeUndefined();
    expect(normalizeLLMProviderId("hyprnote")).toBeUndefined();
  });

  it("preserves current provider ids", () => {
    expect(normalizeLLMProviderId("openai")).toBe("openai");
  });
});
