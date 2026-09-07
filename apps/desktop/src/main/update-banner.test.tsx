import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDesktopUpdateControl } from "./update-banner";

describe("useDesktopUpdateControl", () => {
  it("stays disabled until Corola owns an update service and signing key", () => {
    const { result } = renderHook(() => useDesktopUpdateControl());

    expect(result.current).toMatchObject({
      status: null,
      version: null,
      progress: null,
      downloadStarting: false,
      installing: false,
    });
  });
});
