import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses Arabic RTL metadata for the fuel ledger", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /lang="ar"/);
  assert.match(layout, /dir="rtl"/);
  assert.match(layout, /دفتر المحطة/);
});

test("keeps fuel summaries separate and omits net dispensed", async () => {
  const domain = await readFile(new URL("../app/ledger/domain.js", import.meta.url), "utf8");
  const pages = await Promise.all([
    "Dashboard.jsx",
    "DailyLedger.jsx",
    "MonthlySummary.jsx",
  ].map((name) => readFile(new URL(`../app/ledger/pages/${name}`, import.meta.url), "utf8")));

  assert.match(domain, /سولار/);
  assert.match(domain, /بنزين 92/);
  assert.doesNotMatch(`${domain}\n${pages.join("\n")}`, /صافي المنصرف/);
});
