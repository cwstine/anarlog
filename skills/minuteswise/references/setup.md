# Setup

## Local CLI

Open **MinutesWise → Settings → Developers** and select **Install**. Direct-download builds install:

- macOS and Linux (DEB / AppImage): `~/.local/bin/minuteswise`
- Windows: `%LOCALAPPDATA%\MinutesWise\bin\minuteswise.exe`

The Mac App Store build does not bundle CLI installation. Build from source instead.

To build from source instead:

```bash
# Run from the MinutesWise repository root.
cargo install --locked --path apps/cli
minuteswise --version
```

Run the MinutesWise desktop app once so its local database exists. The CLI works while the app is closed after that.

On Flatpak, the host command is `minuteswise-cli`. On DEB, AppImage, macOS, Windows, and Settings-installed builds, the command is `minuteswise`.

Homebrew, standalone release binaries, and Windows package-manager distribution are not yet available.

Use `--db-path FILE` or `MINUTESWISE_DB_PATH` only when the database is outside MinutesWise's default application-data location.

## Optional local MCP

Start the local stdio server yourself:

```bash
minuteswise mcp
```

A generic client configuration is:

```json
{
  "mcpServers": {
    "minuteswise": {
      "command": "minuteswise",
      "args": ["mcp"]
    }
  }
}
```

Restart the client after changing its MCP configuration.
