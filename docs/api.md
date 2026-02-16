# HTTP API

The API prefix is `/api/v1`. JSON responses use `Cache-Control: no-store`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Database health and record counts |
| `GET` | `/api/v1/state` | Active and scheduled collectors |
| `GET` | `/api/v1/signals?limit=100` | Recent normalized signals |
| `GET` | `/api/v1/incidents?status=open` | Incident timeline |
| `POST` | `/api/v1/collect` | Run enabled collectors |
| `POST` | `/api/v1/incidents/:id/acknowledge` | Acknowledge an incident |
| `POST` | `/api/v1/incidents/:id/resolve` | Resolve an incident |
| `POST` | `/api/v1/incidents/:id/suppress` | Suppress an incident |

When `apiToken` is configured, send `Authorization: Bearer <token>`. Binding beyond loopback is rejected without a token.
