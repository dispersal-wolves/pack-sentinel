# Webhooks

Webhook payloads use `dispersal-wolves/pack-sentinel/webhook/v1`. External targets must use HTTPS. Delivery times out after ten seconds and redirects are rejected. Receivers should deduplicate by incident key and authenticate requests at their own ingress.
