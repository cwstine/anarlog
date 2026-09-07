import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(process.cwd(), "../..");
const SOURCE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".md",
  ".rs",
  ".ts",
  ".tsx",
]);
const EXCLUDED_PATHS = new Set([
  "apps/desktop/src/shared/utils.ts",
  "apps/desktop/src-tauri/src/embedded_cli.rs",
  "apps/desktop/src-tauri/src/legacy_credentials.rs",
  "plugins/tray/src/menu_items/tray_version.rs",
]);

function collectSourceFiles(relativePath: string): string[] {
  const absolutePath = join(REPO_ROOT, relativePath);
  const entries = readdirSync(absolutePath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const child = join(relativePath, entry.name);
    if (
      entry.name === "i18n" ||
      entry.name === "tests.rs" ||
      entry.name.includes(".test.") ||
      EXCLUDED_PATHS.has(child)
    ) {
      return [];
    }
    if (entry.isDirectory()) return collectSourceFiles(child);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [child] : [];
  });
}

describe("Corola brand boundary", () => {
  const productSources = [
    ...collectSourceFiles("apps/desktop/src"),
    ...collectSourceFiles("apps/desktop/src-tauri/src"),
    ...collectSourceFiles("apps/cli/src"),
    ...collectSourceFiles("plugins/tray/src"),
    ...collectSourceFiles("plugins/deeplink2/src"),
    ...collectSourceFiles("plugins/importer/src"),
    ...collectSourceFiles("plugins/windows/src"),
    ...collectSourceFiles("plugins/local-api/src"),
    ...collectSourceFiles("plugins/git/src"),
    "docs/agents/mcp.mdx",
    "docs/installation.mdx",
    "docs/reference/cli.mdx",
    "docs/reference/mcp.mdx",
  ];

  it("does not expose the previous product names", () => {
    for (const relativePath of productSources) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/\b(?:Anarlog|Hyprnote|Char)\b/);
    }
  });

  it("does not link to the previous product infrastructure", () => {
    for (const relativePath of productSources) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(
        /https?:\/\/(?:[^/]+\.)?anarlog\.so|github\.com\/fastrepl\/anarlog/,
      );
    }
  });

  it("does not depend on removed account product packages", () => {
    for (const relativePath of productSources) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(
        /packages\/(?:auth|billing|pricing|sharing|sync|teams)(?:\/|\b)/,
      );
      expect(source, relativePath).not.toMatch(/\b(?:your|team) workspace\b/i);
    }
  });
});
