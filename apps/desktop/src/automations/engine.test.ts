import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exportMeetingMarkdown: vi.fn(),
  values: {} as Record<string, unknown>,
  setSettingValue: vi.fn(),
}));

vi.mock("@anlg/plugin-local-api", () => ({
  commands: { exportMeetingMarkdown: mocks.exportMeetingMarkdown },
}));

vi.mock("~/settings/queries", () => ({
  getStoredSettingValues: () => Promise.resolve({ values: mocks.values }),
  setSettingValue: mocks.setSettingValue,
}));

import {
  runMeetingCompletedAutomations,
  runNoteEnhancedAutomations,
} from "./engine";

describe("local automations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.values = {};
    mocks.exportMeetingMarkdown.mockResolvedValue({
      status: "ok",
      data: "/exports/meeting.md",
    });
    mocks.setSettingValue.mockImplementation((key: string, value: string) => {
      mocks.values[key] = value;
      return Promise.resolve();
    });
  });

  it("exports completed meetings to the configured local folder", async () => {
    mocks.values = {
      automation_markdown_export_enabled: true,
      automation_markdown_export_directory: "/exports",
    };

    await runMeetingCompletedAutomations("session-1");

    expect(mocks.exportMeetingMarkdown).toHaveBeenCalledWith(
      "session-1",
      "/exports",
    );
    expect(mocks.setSettingValue).toHaveBeenCalledWith(
      "automation_markdown_export_last_run",
      expect.stringContaining('"status":"success"'),
    );
  });

  it("does not export when the local destination is disabled", async () => {
    await runMeetingCompletedAutomations("session-1");

    expect(mocks.exportMeetingMarkdown).not.toHaveBeenCalled();
  });

  it("runs a local Markdown workflow after a summary is ready", async () => {
    mocks.values = {
      automation_workflows: JSON.stringify([
        {
          id: "workflow-1",
          title: "Archive summary",
          enabled: true,
          trigger: "note_enhanced",
          steps: [
            {
              id: "step-1",
              type: "markdown_export",
              directory: "/notes",
            },
          ],
          lastRun: null,
          processedSessionIds: [],
          chatGroupId: null,
        },
      ]),
    };

    await runNoteEnhancedAutomations("session-1");

    expect(mocks.exportMeetingMarkdown).toHaveBeenCalledWith(
      "session-1",
      "/notes",
    );
    const saved = JSON.parse(
      String(
        mocks.setSettingValue.mock.calls.find(
          ([key]) => key === "automation_workflows",
        )?.[1],
      ),
    );
    expect(saved[0]).toMatchObject({
      id: "workflow-1",
      lastRun: { status: "success", detail: "/exports/meeting.md" },
      processedSessionIds: ["session-1"],
    });
  });

  it("drops removed remote workflow steps instead of executing them", async () => {
    mocks.values = {
      automation_workflows: JSON.stringify([
        {
          id: "legacy-workflow",
          enabled: true,
          trigger: "note_enhanced",
          steps: [
            {
              id: "remote-step",
              type: "slack_recap",
              target: { id: "channel-1", name: "general" },
            },
          ],
        },
      ]),
    };

    await runNoteEnhancedAutomations("session-1");

    expect(mocks.exportMeetingMarkdown).not.toHaveBeenCalled();
    expect(mocks.setSettingValue).not.toHaveBeenCalled();
  });
});
