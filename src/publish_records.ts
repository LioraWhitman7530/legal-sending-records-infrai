import { InfraiClient } from "./infrai_client.ts";
import { recordsForDomain } from "./records.ts";

type DomainResult = { zone_id: string };
type VerifyResult = { verification: { status: string } };

export async function publishDomain(domain: string, client = new InfraiClient()): Promise<object> {
  const zone = await client.request<DomainResult>("/v1/dns/domain/get", "GET", undefined, { domain });
  const records = recordsForDomain(domain);
  for (const record of records) await client.request("/v1/dns/record/upsert", "PUT", { zone_id: zone.zone_id, ...record });
  const verification = await client.request<VerifyResult>("/v1/email/domain/verify", "POST", { domain });
  const rotation = await client.request("/v1/email/domain/rotate_dkim/" + encodeURIComponent(domain), "POST");
  return { domain, zone_id: zone.zone_id, record_count: records.length, verification_status: verification.verification.status, dkim_rotation: rotation };
}

if (process.argv[1]?.endsWith("publish_records.ts")) {
  const domain = process.argv[2];
  if (!domain) throw new Error("usage: npm run publish -- legal.example");
  publishDomain(domain).then((result) => console.log(JSON.stringify(result, null, 2)));
}
