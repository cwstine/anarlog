import { afterEach, describe, expect, it } from "vitest";

import {
  decodeNotesView,
  encodeNotesView,
  folderIdForNewNote,
  resetSidebarNotes,
  useSidebarNotes,
} from "./note-filter";

describe("sidebar note filter", () => {
  afterEach(() => {
    resetSidebarNotes();
  });

  it("encodes and decodes the local timeline and folders", () => {
    expect(encodeNotesView("mine", null)).toBe("mine");
    expect(encodeNotesView("mine", "")).toBe("folder:");
    expect(encodeNotesView("mine", "CS 101")).toBe("folder:CS 101");

    expect(decodeNotesView("mine")).toEqual({
      noteFilter: "mine",
      folderFilter: null,
    });
    expect(decodeNotesView("shared")).toEqual({
      noteFilter: "mine",
      folderFilter: null,
    });
    expect(decodeNotesView("folder:")).toEqual({
      noteFilter: "mine",
      folderFilter: "",
    });
    expect(decodeNotesView("folder:CS 101")).toEqual({
      noteFilter: "mine",
      folderFilter: "CS 101",
    });
  });

  it("inherits a folder only while that folder is the active mine view", () => {
    expect(folderIdForNewNote("mine", null)).toBeUndefined();
    expect(folderIdForNewNote("mine", "")).toBe("");
    expect(folderIdForNewNote("mine", "CS 101")).toBe("CS 101");
  });

  it("keeps grouping and sort independent of the active folder", () => {
    useSidebarNotes.getState().setGroupBy("folder");
    useSidebarNotes.getState().setSortOrder("oldest");
    useSidebarNotes.getState().setView("mine", "CS 101");

    expect(useSidebarNotes.getState()).toMatchObject({
      noteFilter: "mine",
      folderFilter: "CS 101",
      groupBy: "folder",
      sortOrder: "oldest",
    });
  });
});
