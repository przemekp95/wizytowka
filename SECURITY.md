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

For the supported Vercel + Render topology, the minimum production baseline is:

- automatic TLS redirect, HSTS, and platform DDoS protection on Vercel;
- an IP-keyed Vercel WAF rate-limit rule covering only same-origin
  `POST /api/contact` and `POST /api/chat`;
- `TRUST_PROXY=true` on the single-proxy Render web-service topology;
- shared Mongo-backed application throttling (`THROTTLE_STORAGE=mongo`);
- a high-entropy `INTERNAL_PROXY_SHARED_SECRET` shared only by Vercel and
  Render, with Vercel reading the platform-controlled
  `x-vercel-forwarded-for` header;
- direct backend requests treated as public and untrusted despite CORS, with
  validation, body limits, authentication where applicable, and application
  throttling enforced server-side.

Apollo CSRF prevention stays enabled. The public REST endpoints are stateless
and same-origin from the browser-facing application; CORS is not considered an
authorization control. SMTP, Resend, webhook, and outbox behavior remains
behind ports/adapters in the layered hybrid architecture.
