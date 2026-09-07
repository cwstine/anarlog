import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(process.cwd(), "../..");
const TAURI_ROOT = join(REPO_ROOT, "apps/desktop/src-tauri");

function pngDimensions(relativePath: string) {
  const bytes = readFileSync(join(REPO_ROOT, relativePath));
  expect(bytes.subarray(1, 4).toString("ascii"), relativePath).toBe("PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function sha256(relativePath: string) {
  return createHash("sha256")
    .update(readFileSync(join(REPO_ROOT, relativePath)))
    .digest("hex");
}

describe("Corola brand assets", () => {
  it("uses one square master image for every packaged app channel", () => {
    expect(
      pngDimensions("apps/desktop/src-tauri/icons/src/corola.png"),
    ).toEqual({ width: 1024, height: 1024 });

    const channelHashes = ["stable", "dev", "staging"].map((channel) => {
      const root = `apps/desktop/src-tauri/icons/${channel}`;
      for (const file of [
        "32x32.png",
        "128x128.png",
        "128x128@2x.png",
        "icon.icns",
        "icon.ico",
        "icon.png",
      ]) {
        const path = `${root}/${file}`;
        expect(existsSync(join(REPO_ROOT, path)), path).toBe(true);
        expect(statSync(join(REPO_ROOT, path)).size, path).toBeGreaterThan(0);
      }
      return sha256(`${root}/icon.png`);
    });

    expect(new Set(channelHashes).size).toBe(1);
  });

  it("keeps only Corola source and runtime icon assets", () => {
    const sourceNames = readdirSync(join(TAURI_ROOT, "icons/src"));
    expect(sourceNames).toEqual(["corola.png"]);

    expect(pngDimensions("apps/desktop/public/assets/corola-icon.png")).toEqual(
      { width: 512, height: 512 },
    );
    expect(sha256("apps/desktop/public/assets/corola-icon.png")).toBe(
      sha256("apps/desktop/src-tauri/icons/stable/icon.png"),
    );
    expect(
      existsSync(
        join(REPO_ROOT, "apps/desktop/public/assets/anarlog-icon.png"),
      ),
    ).toBe(false);
    expect(
      existsSync(join(REPO_ROOT, "apps/desktop/public/assets/logo.svg")),
    ).toBe(false);
    expect(
      existsSync(
        join(REPO_ROOT, "apps/desktop/public/assets/onboarding-video.mp4"),
      ),
    ).toBe(false);

    const onboardingSource = readFileSync(
      join(REPO_ROOT, "apps/desktop/src/onboarding/index.tsx"),
      "utf8",
    );
    expect(onboardingSource).toContain("/assets/corola-icon.png");
    expect(onboardingSource).not.toContain("onboarding-video");

    const runtimeChannels = readdirSync(join(TAURI_ROOT, "resources"), {
      withFileTypes: true,
    })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(TAURI_ROOT, "resources", entry.name, "AppIcon.icns")),
      )
      .map((entry) => entry.name)
      .sort();
    expect(runtimeChannels).toEqual(["dev", "stable", "staging"]);
  });

  it("ships Corola DMG backgrounds at the configured resolution", () => {
    for (const channel of ["stable", "staging"]) {
      expect(
        pngDimensions(
          `apps/desktop/src-tauri/assets/dmg-background-${channel}.png`,
        ),
      ).toEqual({ width: 1320, height: 800 });
    }
  });
});
