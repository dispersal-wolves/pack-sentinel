<p align="center">
  <img src="docs/banner.svg" alt="Pack Sentinel — local security operations" width="100%">
</p>

# Pack Sentinel

Pack Sentinel brings the findings from Dispersal Wolves utilities into one local timeline. It schedules checks, normalizes their output, records changes, correlates related signals, and keeps every conclusion traceable to its source evidence.

It is designed for one machine or a small private network. The service binds to loopback by default, stores its history in SQLite, and never applies remediation on its own.

## What it includes

- Adapters for `container-check`, `file-watch`, `firewall-kit`, `honeyfile`, `host-check`, `log-howl`, `open-ports`, `secret-sweep`, and `ssh-guard`
- Scheduled and manual collection with bounded concurrency and timeouts
- Stable signal fingerprints, deduplication, baselines, and deterministic correlation
- Incident acknowledgement, resolution, suppression, and audit history
- An embedded local dashboard and versioned HTTP API
- JSON, JSONL, CSV, and SARIF exports
- SQLite migrations, retention controls, and WAL journaling
- Safe configuration defaults and redaction at trust boundaries

## Requirements

- Node.js 24 or newer
- The Dispersal Wolves utilities you choose to configure

No package installation is required. Pack Sentinel uses the runtime modules included with Node.js.

## Run the demo

```bash
npm test
node --experimental-strip-types src/main.ts collect --config config/demo.json
node --experimental-strip-types src/main.ts serve --config config/demo.json
```

Open `http://127.0.0.1:7331`.

## Configure collectors

Copy `config/example.json` and update each command to point at the corresponding utility on your machine. Collectors must emit JSON to standard output. Their standard error is retained only when a run fails, and command strings are never passed through a shell.

```bash
cp config/example.json pack-sentinel.json
node --experimental-strip-types src/main.ts doctor --config pack-sentinel.json
node --experimental-strip-types src/main.ts collect --config pack-sentinel.json
```

See [configuration](docs/configuration.md), [collector contracts](docs/collector-contracts.md), and the [API reference](docs/api.md) for the full interface.

## Commands

```text
serve       run the scheduler, API, and dashboard
collect     execute every enabled collector once
incidents   print current incidents as JSON
export      export signals and incidents
adapters    list supported collector adapters
prune       apply the configured retention policy
doctor      validate configuration and storage
```

## Security model

Pack Sentinel treats collector output and API input as untrusted. It limits child-process output, enforces timeouts, avoids shell execution, redacts common secret fields, and requires a bearer token whenever the server binds beyond loopback. Read [SECURITY.md](SECURITY.md) and the [threat model](docs/threat-model.md) before exposing it to another machine.

## Status

The current release is `0.1.0`. Its public contracts are versioned, and migrations are forward-only. Back up the SQLite file before upgrading across major versions.

## License

MIT
