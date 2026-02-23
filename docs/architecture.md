# Architecture

Pack Sentinel has five boundaries:

1. **Collectors** run external programs without a shell. Output is capped, timed, and parsed as untrusted JSON.
2. **Adapters** translate tool-specific documents into the versioned signal model.
3. **The engine** fingerprints, deduplicates, stores, and correlates signals with bounded concurrency.
4. **The store** owns migrations, event history, incident state, retention, and the audit trail.
5. **Interfaces** expose the same state through the CLI, HTTP API, dashboard, and exports.

Correlation rules are deterministic predicates over a bounded time window. Every incident records its rule and contributing signal identifiers. The architecture intentionally avoids opaque scoring and autonomous response.
