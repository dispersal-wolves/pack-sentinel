# Security policy

## Supported versions

Security fixes are applied to the latest minor release. Pack Sentinel is local-first software and binds to `127.0.0.1` unless configuration explicitly says otherwise.

## Reporting a vulnerability

Use GitHub private vulnerability reporting when it is available on the repository. Include the affected version, operating system, reproduction steps, and impact. Do not include real credentials, private keys, machine inventories, or production database files.

## Operating guidance

- Run collectors with the least privilege they require.
- Keep the database and configuration readable only by the service account.
- Configure an API token before binding beyond loopback.
- Place TLS and network access controls in front of any remote deployment.
- Review collector commands and paths before enabling them.
- Treat exported reports as sensitive operational data.

Pack Sentinel does not execute incident remediation. Findings remain evidence for an operator to review.
