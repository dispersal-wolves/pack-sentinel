# Data model

A signal is an immutable observation from one collector. Its fingerprint supports bounded deduplication. An incident is a mutable operator-facing record produced by a named correlation rule. Incidents reference signal identifiers and retain acknowledgement or resolution state across later correlation passes.
