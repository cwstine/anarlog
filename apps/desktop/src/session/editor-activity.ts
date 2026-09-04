import type { EditorView } from "prosemirror-view";

import { flushDatabaseWrites } from "~/db/write-queue";

const mountedSessionEditors = new Map<string, Map<EditorView, () => void>>();

export function registerSessionEditor(
  sessionId: string,
  view: EditorView,
  flushPendingChanges: () => void,
) {
  const editors = mountedSessionEditors.get(sessionId) ?? new Map();
  editors.set(view, flushPendingChanges);
  mountedSessionEditors.set(sessionId, editors);
}

export function unregisterSessionEditor(sessionId: string, view: EditorView) {
  const editors = mountedSessionEditors.get(sessionId);
  if (!editors) return;
  editors.delete(view);
  if (editors.size === 0) mountedSessionEditors.delete(sessionId);
}

export async function flushSessionEditorChanges(
  sessionId: string,
): Promise<void> {
  const editors = mountedSessionEditors.get(sessionId);
  if (editors) {
    for (const flushPendingChanges of editors.values()) {
      flushPendingChanges();
    }
  }
  await flushDatabaseWrites([`session:${sessionId}`]);
}
