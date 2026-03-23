# Utility Scripts

Utility scripts and automation tools for the backend application.

## Description

This directory contains utility scripts for database operations, data seeding, maintenance tasks, and other automation tools used in development and deployment.

## Getting Started

### Dependencies

- Node.js runtime
- Database access
- Script-specific dependencies
- Development tools

### Installing

- Scripts are included in the project
- Install dependencies: `npm install` or `pnpm install`
- No additional installation required

### Executing program

- Run scripts with Node.js: `node script-name.js`
- Use npm scripts: `npm run script-name`
- Execute with ts-node for TypeScript: `npx ts-node script-name.ts`

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

## Help

For script issues, check script permissions, ensure dependencies are installed, and verify script parameters and environment variables.

## Authors

TBD

## Version History

- 0.1
  - Initial Release

## License

This project is licensed under the [NAME HERE] License - see the LICENSE.md file for details

## Acknowledgments

- Node.js scripting
- Automation patterns
- Development workflow tools
