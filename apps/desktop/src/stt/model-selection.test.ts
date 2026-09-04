import { describe, expect, it } from "vitest";

import { normalizeStoredSttSelection } from "./model-selection";

describe("normalizeStoredSttSelection", () => {
  it("migrates legacy on-device selections to their local providers", () => {
    expect(
      normalizeStoredSttSelection("anarlog", "soniqo-parakeet-streaming"),
    ).toEqual({
      provider: "soniqo",
      model: "soniqo-parakeet-streaming",
    });
    expect(normalizeStoredSttSelection("anarlog", "apple-speech")).toEqual({
      provider: "apple_speech",
      model: "apple-speech",
    });
  });

  it("clears the removed managed cloud selection", () => {
    expect(normalizeStoredSttSelection("anarlog", "cloud")).toEqual({
      provider: "",
      model: "",
    });
  });

  it("preserves direct providers", () => {
    expect(normalizeStoredSttSelection("openai", "gpt-transcribe")).toEqual({
      provider: "openai",
      model: "gpt-transcribe",
    });
  });
});
