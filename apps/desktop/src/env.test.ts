import { describe, expect, it } from "vitest";

import { env } from "./env";

describe("desktop environment", () => {
  it("starts without account service configuration", () => {
    expect("VITE_SUPABASE_URL" in env).toBe(false);
    expect("VITE_SUPABASE_ANON_KEY" in env).toBe(false);
    expect("VITE_PRO_PRODUCT_ID" in env).toBe(false);
    expect("VITE_APP_URL" in env).toBe(false);
    expect("VITE_API_URL" in env).toBe(false);
  });
});
