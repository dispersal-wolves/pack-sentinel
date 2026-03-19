# Configuration

Configuration is a JSON document. Start from `config/example.json`.

| Field | Default | Meaning |
| --- | --- | --- |
| `database` | `.pack-sentinel/pack-sentinel.db` | SQLite database path |
| `bind` | `127.0.0.1` | HTTP bind address |
| `port` | `7331` | HTTP port |
| `apiToken` | unset | Bearer token; required beyond loopback |
| `retentionDays` | `30` | Age at which unreferenced signals can be pruned |
| `dedupeWindowSeconds` | `300` | Time during which matching fingerprints are ignored |
| `maxConcurrentCollectors` | `2` | Maximum active child processes |

Each collector defines an identifier, executable, argument array, adapter, interval, timeout, and optional working directory or environment additions. Commands are never interpreted by a shell.

Environment values in configuration may contain secrets. Keep the file outside source control and limit its filesystem permissions.
