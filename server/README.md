# Studio project-request delivery

Production Worker: `vetops-studio-inquiry`, configured by `wrangler.jsonc`.
It owns only `vetopsfinancial.com/api/studio-request*`; Cloudflare Pages still serves the website.

## Mail setup

- Fixed verified recipient: `studio@vetopsfinancial.com`.
- Sender: `requests@studio-mail.vetopsfinancial.com`.
- Email Routing is enabled only for `studio-mail.vetopsfinancial.com`. The apex domain's five Google MX records remain unchanged.
- Sending to this verified destination uses Cloudflare's free verified-recipient path. No Workers Paid subscription was purchased.
- Visitor email is used as Reply-To. The service never accepts a visitor-supplied recipient or sender.
- Turnstile is restricted to `vetopsfinancial.com`; its secret lives in the Worker secret `TURNSTILE_SECRET`, never in source or the public build.
- Rate-limit namespace `2026102201` is reserved for this service (3 requests per minute per IP). No other Workers existed in this account when it was assigned.
- Worker request logging is disabled; submitted briefs are delivered by email and are not written to a separate application database.

## Deploy and rollback

Run `npm test` and `npm run build`, then `npx wrangler deploy --config server/wrangler.jsonc` from the repository root using the website owner's account.
This service deploys separately from the Pages Git integration. Keep `TURNSTILE_SECRET` configured as a Cloudflare secret; a redeploy preserves it.

To pause automatic delivery, set `DELIVERY_ENABLED` to `false` and redeploy. The form will offer its existing email-draft fallback. Do not disable verification, change the fixed recipient, or modify the apex domain MX records to troubleshoot delivery.

`GET /api/studio-request/config` exposes only mode and the public site key with `Cache-Control: no-store`.
Successful POST responses mean the email provider accepted the message, not that an inbox receipt has independently been confirmed. Ambiguous failures instruct the visitor to contact the Studio before retrying.

## Launch verification — 2026-10-22

- 29 Python checks and 8 JavaScript checks passed; public build completed with 129 files and excluded server/private sources.
- Destination verified through Cloudflare's email sent to the existing Studio inbox.
- Connection test received in the Brian Google Workspace inbox via the Studio address.
- Live browser form submitted a clearly labeled internal test work order with reference `VOS-20261022-E9BFF9CFBF46` at `2026-10-22T12:45:05.770Z`.
- The live form displayed the matching receipt, and the email was independently opened in Gmail with the matching reference and full brief.
- Initial new-widget verification took time to become ready in Chrome; a second browser completed verification and sent successfully, and Chrome's send control subsequently became enabled too.
- The Gina M. Penrod example remains under `/studio-portfolio#websites`, linked to `https://ginapenrod.me/`.

Watermarks, 3D assets, tours, and private Blender originals are unchanged by this email release.
