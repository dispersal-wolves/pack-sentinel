# Threat model

## Assets

- Local security findings and machine inventory
- Collector configuration and credentials
- Incident history and operator decisions
- Availability of the monitored host

## Trust boundaries

Collector output, filesystem paths, webhook endpoints, API requests, and imported configuration are untrusted. The local operator and operating-system account are trusted to select collector executables.

## Controls

- Child processes run without a shell.
- Collector runtime and output size are bounded.
- Non-loopback HTTP binding requires authentication.
- API tokens use constant-time comparison.
- Common secret-bearing fields are redacted.
- SQLite uses parameterized statements and WAL journaling.
- Webhooks require HTTPS except on loopback.
- The service does not perform automatic remediation.

## Out of scope

Pack Sentinel is not an endpoint protection platform, remote vulnerability scanner, sandbox, or privilege boundary. A compromised service account can read everything that account can access.
