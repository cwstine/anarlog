# CLI commands

Use `--json` for agent-readable output.

Linux Flatpak installs this command as `minuteswise-cli`; use that name instead of `minuteswise` in the examples when that is the command on PATH.

```bash
minuteswise --json doctor
minuteswise --json meetings list --query "planning" --limit 20 --offset 0
minuteswise --json meetings get MEETING_ID
minuteswise --json meetings note MEETING_ID --kind note
minuteswise --json meetings note MEETING_ID --kind summary
minuteswise --json meetings history MEETING_ID --limit 20 --offset 0
minuteswise --json proposals list --meeting MEETING_ID
minuteswise --json proposals create --meeting MEETING_ID --kind summary --content "Replacement markdown"
minuteswise --json proposals show PROPOSAL_ID
minuteswise --json proposals decline PROPOSAL_ID
```

`proposals create` stages a pending edit. Do not claim the meeting changed. A human applies or declines it in the MinutesWise desktop app.

Meeting commands always read the local database. There is no login or hosted
data-source flag.

`doctor` exits with status 1 when its response contains `ready: false`.

Read transcripts in bounded word pages:

```bash
minuteswise --json meetings transcript MEETING_ID --limit 200 --offset 0
```

JSON success responses contain `schema_version`, `command`, `data`, and optional `pagination`. Continue from `pagination.next_offset` only when more context is necessary.

Export is intended for an explicit user request to save or transfer a complete meeting:

```bash
minuteswise meetings export MEETING_ID --format markdown --output meeting.md
minuteswise meetings export MEETING_ID --format json --output meeting.json
```

Export refuses to replace an existing file. Pass `--force` only after the user explicitly approves overwriting that exact path.

Global database overrides:

```bash
minuteswise --db-path /path/to/app.db --json meetings list
minuteswise --base /path/to/minuteswise-data --json meetings list
```
