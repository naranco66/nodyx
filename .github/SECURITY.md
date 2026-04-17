# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

We only provide security fixes for the latest major release.

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report them privately:

1. **Email:** Send details to **security@nodyx.org**
2. **GitHub:** Use [GitHub's private vulnerability reporting](https://github.com/Pokled/Nodyx/security/advisories/new)

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### What to expect

- **Acknowledgment** within 48 hours
- **Assessment** within 7 days
- **Fix timeline** communicated once assessed
- **Credit** in the release notes (unless you prefer anonymity)

## Security Features

Nodyx takes security seriously:

- **E2E Encrypted DMs** — ECDH P-256 key exchange + AES-256-GCM encryption. Private keys never leave the browser.
- **Two-Factor Authentication** — TOTP (Google Authenticator, Aegis, Bitwarden) + Nodyx Signet (ECDSA P-256 passwordless PWA).
- **Session management** — JWT + Redis with configurable TTL, forced logout capability.
- **Rate limiting** — Per-endpoint rate limits on all API routes.
- **Input validation** — Zod schemas on all API inputs.
- **SQL injection protection** — Parameterized queries only, no string concatenation.
- **XSS protection** — Content Security Policy headers via Caddy, sanitized HTML rendering.
- **AGPL-3.0** — Full source code always available for inspection.

## Responsible Disclosure

We believe in coordinated disclosure. If you report a vulnerability responsibly, we commit to:

- Not pursuing legal action against you
- Working with you to understand and fix the issue
- Crediting you publicly (with your permission)

Thank you for helping keep Nodyx and its communities safe.
