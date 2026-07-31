# Security Policy

## Supported code

Security fixes target the current `main` branch. Historical snapshots and
locally modified deployments are not maintained as separate supported release
lines.

## Reporting a vulnerability

Please use GitHub's private vulnerability-reporting flow:

https://github.com/przemekp95/wizytowka/security/advisories/new

Do not include credentials, production personal data, or working exploit data
in a public issue. Include the affected endpoint or component, reproduction
conditions, impact, and the smallest safe proof needed to confirm the report.

If private reporting is unavailable, open a public issue containing only a
request for a private contact channel; do not disclose vulnerability details.

## Operational boundary

The repository's Compose configuration is a local integration reference.
Production operators must provide managed TLS, private databases, secret
management, request-size and rate limits, backups, and monitoring appropriate
to their hosting environment.
