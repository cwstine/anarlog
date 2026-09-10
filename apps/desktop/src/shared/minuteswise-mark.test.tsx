import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { MinutesWiseMark } from "./minuteswise-mark";

it("renders the MinutesWise MW clock mark", () => {
  render(<MinutesWiseMark className="brand-mark" />);

  const mark = screen.getByTestId("minuteswise-mark");
  expect(mark.getAttribute("viewBox")).toBe("0 0 128 128");
  expect(mark.getAttribute("class")).toBe("brand-mark");
  expect(mark.querySelector("[data-minuteswise-dial]")).toBeTruthy();
  expect(mark.querySelector("[data-minuteswise-monogram]")).toBeTruthy();
  expect(mark.querySelector("[data-minuteswise-minute-hand]")).toBeTruthy();
  expect(mark.querySelectorAll("ellipse")).toHaveLength(0);
});
