# Prisma client

This module exposes the generated Prisma client for the MongoDB-backed contact
workflow. The schema is in `backend/prisma/schema.prisma`.

Generate the client with `corepack pnpm -F backend exec prisma generate`.
This project does not use SQL migrations for that schema.
