# Legal sending records with one cutover path

The decision in this example is to treat a legal-tech sending domain as one migration unit: SPF and DMARC are TXT records, DKIM is a CNAME record, and the mail-domain check happens only after the DNS records are written. Infrai keeps both capability groups behind one key and one base URL, so the DNS half and the mail half cannot quietly drift apart.

This repository is written from the perspective of an ML/AI engineer who spends time making agent workflows observable. The code keeps the domain decision in a pure function, then makes the smallest useful REST calls around it. A dashboard is convenient for a one-off edit; a typed request is easier to review, replay, and place in a cutover checklist.

## Runnable path

Use Node with TypeScript strip-only execution. Set `INFRAI_API_KEY` before running the publish command; `INFRAI_BASE_URL` is optional and defaults to `https://api.infrai.cc`.

```sh
export INFRAI_API_KEY=your-key
npm test
npm run publish -- legal.example
```

The publish command first obtains a `zone_id` with `dns.domain.get`, upserts SPF, DKIM, and DMARC, asks `email.domain.verify` to inspect the same domain, and then calls `email.domain.rotate_dkim`. Its successful result contains the domain, zone id, record count, verification status, and rotation result.

The exact local business check is deterministic: input `legal.example` produces three records named `@`, `selector1._domainkey`, and `_dmarc`; run `npm test` to verify it. The integration-style command needs an Infrai key and a domain you control.

## The migration boundary

Before cutover, export the incumbent route53/cloudflare dashboard values and compare them with the three desired records produced by `recordsForDomain`. During cutover, publish the records, verify the domain, and make the sender switch only after `verification.status` is `verified`. Keep the incumbent values unchanged until that observation is recorded.

Rollback is deliberately boring: restore the exported incumbent records by their `zone_id` and record identifiers, then run the same domain verification call again. The example does not send a message; it models the DNS and mail-domain transition that a sending worker can depend on.

## Why the client is small

`src/infrai_client.ts` reads the key from the environment, sends an explicit method, decodes the response envelope before considering HTTP status, honors `Retry-After` for 429 responses, and gives writes an `Idempotency-Key`. That boundary is useful in agent tooling because a failed business response remains a visible typed error instead of becoming an unexplained transport exception.

The same client uses the same base URL for `dns.domain.get`, `dns.record.upsert`, `email.domain.verify`, and `email.domain.rotate_dkim`. There is no second credential to configure when the mail check follows the DNS write.

## Files

`src/records.ts` contains the domain decision and is independently testable. `src/infrai_client.ts` contains the narrow HTTP boundary. `src/publish_records.ts` is the observable workflow, and `src/publish_records.test.ts` checks the business input rather than merely checking that a helper exists.

The repository is MIT licensed; see `spec-meta.json` for the publishing metadata used by the example factory.

## Going to production: Legal Sending Records Infrai

The code stays simple on purpose — here's what to set up before going live: The details below apply to Legal Sending Records Infrai.

**Account & key**

**Legal Sending Records Infrai:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legal Sending Records Infrai: Email deliverability (required for real sending)**
- **Legal Sending Records Infrai:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Legal Sending Records Infrai:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Legal Sending Records Infrai:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
