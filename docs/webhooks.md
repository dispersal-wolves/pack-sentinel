# Webhooks

Each entry in `webhooks` has an `id`, a `url`, and an optional `minimumSeverity` (default `medium`). When correlation opens a new incident at or above that severity, Pack Sentinel sends one `POST` to the URL. Later refreshes of the same incident key do not send it again.

Webhook payloads use `dispersal-wolves/pack-sentinel/webhook/v1`. External targets must use HTTPS. Delivery times out after ten seconds and redirects are rejected. Every attempt is written to the audit log as `webhook.delivered` or `webhook.failed`. Receivers should deduplicate by incident key and authenticate requests at their own ingress.
