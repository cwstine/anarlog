import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const openNew = vi.hoisted(() => vi.fn());

vi.mock("~/store/zustand/tabs", () => ({
  useTabs: (selector: (state: { openNew: typeof openNew }) => unknown) =>
    selector({ openNew }),
}));

import { ConfigError } from "./config-error";

describe("ConfigError", () => {
  afterEach(() => {
    cleanup();
    openNew.mockReset();
  });

  it("offers local or BYOK AI setup from the empty summary state", () => {
    render(<ConfigError />);

    expect(screen.getByRole("alert")).not.toBeNull();
    expect(screen.getByText("Set up AI summaries")).not.toBeNull();
    expect(
      screen.getByText(
        "Add an LLM API key or choose an on-device model to generate a summary from this transcript.",
      ),
    ).not.toBeNull();

    expect(screen.queryByText("Get Pro")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Configure AI" }));
    expect(openNew).toHaveBeenNthCalledWith(1, {
      type: "settings",
      state: { tab: "intelligence" },
    });
  });
});
