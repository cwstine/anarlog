# CLI commands

Use `--json` for agent-readable output.

Linux Flatpak installs this command as `corola-cli`; use that name instead of `corola` in the examples when that is the command on PATH.

```bash
corola --json doctor
corola --json meetings list --query "planning" --limit 20 --offset 0
corola --json meetings get MEETING_ID
corola --json meetings note MEETING_ID --kind note
corola --json meetings note MEETING_ID --kind summary
corola --json meetings history MEETING_ID --limit 20 --offset 0
corola --json proposals list --meeting MEETING_ID
corola --json proposals create --meeting MEETING_ID --kind summary --content "Replacement markdown"
corola --json proposals show PROPOSAL_ID
corola --json proposals decline PROPOSAL_ID
```

`proposals create` stages a pending edit. Do not claim the meeting changed. A human applies or declines it in the Corola desktop app.

Meeting commands always read the local database. There is no login or hosted
data-source flag.

`doctor` exits with status 1 when its response contains `ready: false`.

Read transcripts in bounded word pages:

```bash
corola --json meetings transcript MEETING_ID --limit 200 --offset 0
```

JSON success responses contain `schema_version`, `command`, `data`, and optional `pagination`. Continue from `pagination.next_offset` only when more context is necessary.

Export is intended for an explicit user request to save or transfer a complete meeting:

```bash
corola meetings export MEETING_ID --format markdown --output meeting.md
corola meetings export MEETING_ID --format json --output meeting.json
```

Export refuses to replace an existing file. Pass `--force` only after the user explicitly approves overwriting that exact path.

Global database overrides:

```bash
corola --db-path /path/to/app.db --json meetings list
corola --base /path/to/corola-data --json meetings list
```
