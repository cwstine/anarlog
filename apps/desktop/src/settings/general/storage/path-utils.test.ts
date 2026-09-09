import { describe, expect, it } from "vitest";

import { detectCloudStorageService } from "./path-utils";

describe("detectCloudStorageService", () => {
  it("detects iCloud Drive paths", () => {
    expect(
      detectCloudStorageService(
        "/Users/john/Library/Mobile Documents/com~apple~CloudDocs/MinutesWise",
      ),
    ).toBe("iCloud Drive");
  });

  it("detects Obsidian vaults stored in iCloud Drive", () => {
    expect(
      detectCloudStorageService(
        "/Users/john/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault",
      ),
    ).toBe("iCloud Drive");
  });

  it("detects file-provider mounts under Library/CloudStorage", () => {
    expect(
      detectCloudStorageService(
        "/Users/john/Library/CloudStorage/Dropbox/MinutesWise",
      ),
    ).toBe("Dropbox");
    expect(
      detectCloudStorageService(
        "/Users/john/Library/CloudStorage/OneDrive-Personal/MinutesWise",
      ),
    ).toBe("OneDrive");
    expect(
      detectCloudStorageService(
        "/Users/john/Library/CloudStorage/GoogleDrive-john@example.com/My Drive/MinutesWise",
      ),
    ).toBe("Google Drive");
  });

  it("falls back to the mount name for unknown providers", () => {
    expect(
      detectCloudStorageService(
        "/Users/john/Library/CloudStorage/pCloud-john@example.com/MinutesWise",
      ),
    ).toBe("pCloud");
  });

  it("detects legacy sync folders in the home directory", () => {
    expect(detectCloudStorageService("/Users/john/Dropbox/MinutesWise")).toBe(
      "Dropbox",
    );
    expect(
      detectCloudStorageService("/Users/john/Google Drive/MinutesWise"),
    ).toBe("Google Drive");
  });

  it("detects Windows sync folders", () => {
    expect(
      detectCloudStorageService(
        "C:\\Users\\john\\OneDrive - Acme\\MinutesWise",
      ),
    ).toBe("OneDrive");
    expect(
      detectCloudStorageService("C:\\Users\\john\\iCloudDrive\\MinutesWise"),
    ).toBe("iCloud Drive");
  });

  it("returns null for local paths", () => {
    expect(
      detectCloudStorageService(
        "/Users/john/Library/Application Support/anarlog",
      ),
    ).toBeNull();
    expect(
      detectCloudStorageService("/Users/john/Documents/MinutesWise"),
    ).toBeNull();
  });
});
