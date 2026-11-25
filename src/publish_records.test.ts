import assert from "node:assert/strict";
import { recordsForDomain } from "./records.ts";

const records = recordsForDomain("Legal.Example");
assert.deepEqual(records.map(({ record_type, name }) => ({ record_type, name })), [
  { record_type: "TXT", name: "@" },
  { record_type: "CNAME", name: "selector1._domainkey" },
  { record_type: "TXT", name: "_dmarc" }
]);
assert.match(records[2].content, /v=DMARC1; p=none/);
console.log("recordsForDomain selects SPF, DKIM, and DMARC for a legal sending domain");
