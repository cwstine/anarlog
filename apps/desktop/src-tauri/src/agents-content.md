# Corola Desktop

This file is auto-generated on app startup.

## Meeting data

Use Corola's typed, read-only interfaces for meeting data. Do not use `find`,
`grep`, `rg`, filesystem crawling, or direct SQLite queries to find or read
meetings.

Prefer the Corola MCP tools when they are available:

- `list_meetings` to resolve a meeting ID
- `get_meeting` for notes, summaries, participants, and action items
- `get_meeting_transcript` for bounded transcript pages
- `get_recurring_meeting_history` for meetings in the same recurring series

If MCP is unavailable, use the Corola CLI with `--json`:

```sh
corola --json meetings list --query "planning"
corola --json meetings get MEETING_ID
corola --json meetings transcript MEETING_ID --limit 200 --offset 0
corola --json meetings history MEETING_ID
```

The CLI discovers Corola's database from the platform application-data
directory. Use `--db-path ABSOLUTE_APP_DB` only when the user explicitly
provides a non-default database path; do not crawl the filesystem to find one.
Never guess a meeting ID. Keep transcript requests bounded and continue from
`pagination.next_offset` only when more context is needed.

Install the bundled CLI and agent skill from **Corola → Settings → Developers**.
