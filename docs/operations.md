# Operations

## Database

Stop the service before copying the SQLite database for an offline backup. When the service is running, use SQLite's backup facilities so the database and WAL remain consistent.

## Retention

The daily retention task deletes old signals that are not referenced by open or acknowledged incidents. Manual pruning is available through the `prune` command.

## Binding remotely

Set a long random `apiToken`, bind to a private interface, and put a TLS reverse proxy in front of Pack Sentinel. Network-level access control remains recommended because the embedded server is intended for small trusted deployments.

## Recovery

Collector failures are recorded and do not stop other collectors. If a migration fails, startup stops and the transaction is rolled back. Restore the last backup before retrying a failed major upgrade.
