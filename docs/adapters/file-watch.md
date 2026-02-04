# File Watch adapter

The adapter consumes the `changes` array produced by `file-watch check --format json`. Added and changed paths become medium-severity signals. Removed baseline paths become high-severity signals.

Use a dedicated baseline per monitored root and keep baseline files read-only to the collector account.
