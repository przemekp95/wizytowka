# Localized pages

The Next.js 16 App Router serves the public page at `/en` and `/pl`. Each locale
has its own canonical URL and the same `hreflang` set (`en`, `pl`, and
`x-default`). The request proxy forwards the route locale so the root document
emits the matching `<html lang>` value.

Translations live in `src/i18n/messages`. Unsupported locale routes return a
404 rather than silently publishing another canonical page.
