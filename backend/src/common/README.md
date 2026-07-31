# Common HTTP controls

This directory contains shared guards and middleware for request IDs, logging,
admin bearer authentication, signed proxy metadata, and public throttling.

Public contact REST and GraphQL transports share one throttle namespace. Chat
uses a per-IP bucket plus a shared global completion ceiling. Production uses
Mongo-backed storage; in-memory storage is reserved for isolated local tests.
