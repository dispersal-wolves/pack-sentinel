# Troubleshooting

- **No findings:** run `collect` and inspect each collector result.
- **Invalid JSON:** invoke the configured command and remove non-JSON text from standard output.
- **Timeout:** increase the collector timeout only after confirming the command is bounded.
- **Dashboard unavailable:** confirm the bind address, port, and token policy with `doctor`.
- **Repeated incidents:** inspect signal fingerprints and the configured deduplication window.
