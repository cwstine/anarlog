import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/imports/screen", () => ({
  MeetingImportScreen: () => <div>Import list</div>,
}));

import { SettingsImports } from ".";

describe("SettingsImports", () => {
  afterEach(cleanup);

  it("renders imports without a product-hosted documentation link", () => {
    render(<SettingsImports />);

    expect(screen.getByRole("heading", { name: "Imports" })).toBeTruthy();
    expect(screen.getByText("Import list")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Documentation" })).toBeNull();
  });
});
