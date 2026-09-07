import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { CorolaMark } from "./corola-mark";

it("renders the Corola blossom mark", () => {
  render(<CorolaMark className="brand-mark" />);

  const mark = screen.getByTestId("corola-mark");
  expect(mark.getAttribute("viewBox")).toBe("0 0 128 128");
  expect(mark.getAttribute("class")).toBe("brand-mark");
  expect(mark.querySelectorAll("[data-corola-petal]")).toHaveLength(5);
});
