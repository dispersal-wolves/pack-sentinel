# Database recovery

Stop Pack Sentinel and copy the database, WAL, and shared-memory files before repair. Validate the copy with SQLite integrity checks. Restore the newest verified backup if integrity cannot be established. Start the service and run `doctor` before resuming collectors.
