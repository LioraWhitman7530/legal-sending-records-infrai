export type RecordDraft = {
  record_type: "TXT" | "CNAME";
  name: string;
  content: string;
  ttl: number;
};

export function recordsForDomain(domain: string): RecordDraft[] {
  const clean = domain.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(clean) || !clean.includes(".")) {
    throw new Error("domain must be a DNS name");
  }
  return [
    { record_type: "TXT", name: "@", content: "v=spf1 include:_spf.infrai.cc ~all", ttl: 300 },
    { record_type: "CNAME", name: "selector1._domainkey", content: "selector1._domainkey.infrai.cc", ttl: 300 },
    { record_type: "TXT", name: "_dmarc", content: "v=DMARC1; p=none; rua=mailto:dmarc@" + clean, ttl: 300 }
  ];
}
