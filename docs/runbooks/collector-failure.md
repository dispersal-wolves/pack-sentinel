# Collector failure

1. Run `doctor` with the active configuration.
2. Execute the failing collector command directly under the service account.
3. Confirm that standard output contains one JSON document and the process exits within its timeout.
4. Check path permissions and runtime availability.
5. Re-enable scheduling only after a manual `collect` succeeds.
