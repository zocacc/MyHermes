# Use PostgreSQL for state and durable jobs

MyHermes uses PostgreSQL as its central source of truth and stores asynchronous jobs in the same database through pg-boss. This avoids introducing a second operational datastore while providing durable retries and scheduling; the trade-off is that database availability gates both state and background processing.
