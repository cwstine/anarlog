# Setup

## Local CLI

Open **Corola → Settings → Developers** and select **Install**. Direct-download builds install:

- macOS and Linux (DEB / AppImage): `~/.local/bin/corola`
- Windows: `%LOCALAPPDATA%\Corola\bin\corola.exe`

The Mac App Store build does not bundle CLI installation. Build from source instead.

To build from source instead:

```bash
# Run from the Corola repository root.
cargo install --locked --path apps/cli
corola --version
```

Run the Corola desktop app once so its local database exists. The CLI works while the app is closed after that.

On Flatpak, the host command is `corola-cli`. On DEB, AppImage, macOS, Windows, and Settings-installed builds, the command is `corola`.

Homebrew, standalone release binaries, and Windows package-manager distribution are not yet available.

Use `--db-path FILE` or `COROLA_DB_PATH` only when the database is outside Corola's default application-data location.

## Optional local MCP

Start the local stdio server yourself:

```bash
corola mcp
```

A generic client configuration is:

```json
{
  "mcpServers": {
    "corola": {
      "command": "corola",
      "args": ["mcp"]
    }
  }
}
```

Restart the client after changing its MCP configuration.
