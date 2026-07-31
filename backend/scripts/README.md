# Utility Scripts

Utility scripts and automation tools for the backend application.

Repository-owned portfolio synchronization and seeding commands.

```
pnpm -F backend portfolio:pull
pnpm -F backend portfolio:push
pnpm -F backend portfolio:push:prune
pnpm -F backend portfolio:seed
```

## Portfolio Source Of Truth

Portfolio records are tracked in `backend/scripts/portfolio.data.json`.

- `portfolio:pull` reads the current MongoDB `portfolio_items` collection into the file.
- `portfolio:push` upserts the file contents back to MongoDB using `slug` as the stable key.
- `portfolio:push:prune` also removes remote records that are no longer present in the file.
- `portfolio:seed` clears the current target database and inserts the file contents in order.

All commands prefer `MONGODB_URI` and `MONGODB_DB`, but they also accept
`MONGODB_URL` and `MONGO_URL` for the connection string. If `MONGODB_DB` is
not set, the scripts fall back to the database name embedded in the Mongo URI.

`portfolio:push`, `portfolio:push:prune`, and `portfolio:seed` change the target
database. Confirm the connection string and take an appropriate backup before
running them; ordinary checks and builds never invoke these commands.
