# Collector contracts

Adapters accept the existing JSON documents emitted by Dispersal Wolves utilities. A custom collector can use the generic contract:

```json
{
  "schema": "example/tool/v1",
  "findings": [
    {
      "kind": "host.setting.changed",
      "title": "A setting changed",
      "summary": "Human-readable evidence",
      "severity": "medium"
    }
  ]
}
```

Valid severities are `info`, `low`, `medium`, `high`, and `critical`. Adapters attach the configured collector identifier and local host. Raw matches from `secret-sweep` are discarded before persistence.

Collectors should write one JSON document to standard output, diagnostic information to standard error, and a nonzero exit code on failure. Output larger than 8 MiB is rejected.
