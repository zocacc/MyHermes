# Use a modular monolith

MyHermes starts as one deployable service with explicit internal boundaries for Telegram, Captures, Items, interpretation, jobs, and persistence. This keeps local and cloud operation simple while preserving seams that can become separate processes only when operational evidence justifies that cost.
