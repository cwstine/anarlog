import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flushDatabaseWrites: vi.fn<() => Promise<void>>(),
}));

vi.mock("~/db/write-queue", () => ({
  flushDatabaseWrites: mocks.flushDatabaseWrites,
}));

import {
  flushSessionEditorChanges,
  registerSessionEditor,
  unregisterSessionEditor,
} from "./editor-activity";

describe("session editor activity", () => {
  beforeEach(() => {
    mocks.flushDatabaseWrites.mockReset();
    mocks.flushDatabaseWrites.mockResolvedValue();
  });

  it("flushes every mounted editor before draining database writes", async () => {
    const firstView = {} as never;
    const secondView = {} as never;
    const firstFlush = vi.fn();
    const secondFlush = vi.fn();
    registerSessionEditor("session-1", firstView, firstFlush);
    registerSessionEditor("session-1", secondView, secondFlush);
    mocks.flushDatabaseWrites.mockImplementationOnce(async () => {
      expect(firstFlush).toHaveBeenCalledOnce();
      expect(secondFlush).toHaveBeenCalledOnce();
    });

    await flushSessionEditorChanges("session-1");

    expect(mocks.flushDatabaseWrites).toHaveBeenCalledWith([
      "session:session-1",
    ]);
    unregisterSessionEditor("session-1", firstView);
    unregisterSessionEditor("session-1", secondView);
  });

  it("stops flushing an editor after it unmounts", async () => {
    const view = {} as never;
    const flush = vi.fn();
    registerSessionEditor("session-2", view, flush);
    unregisterSessionEditor("session-2", view);

    await flushSessionEditorChanges("session-2");

    expect(flush).not.toHaveBeenCalled();
    expect(mocks.flushDatabaseWrites).toHaveBeenCalledWith([
      "session:session-2",
    ]);
  });
});
