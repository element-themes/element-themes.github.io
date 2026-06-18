import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const websiteId = process.env.UMAMI_WEBSITE_ID;
const apiKey = process.env.UMAMI_API_KEY;
const bearerToken = process.env.UMAMI_BEARER_TOKEN;
const apiUrl = (process.env.UMAMI_API_URL || "https://api.umami.is/v1").replace(/\/$/, "");

if (!websiteId || (!apiKey && !bearerToken)) {
  console.log("Popularity update skipped: configure UMAMI_WEBSITE_ID and an Umami API credential");
  process.exit(0);
}

const query = new URLSearchParams({
  startAt: "0",
  endAt: String(Date.now()),
  event: "copy-theme-url",
  propertyName: "theme",
});
const headers: Record<string, string> = { Accept: "application/json" };
if (apiKey) headers["x-umami-api-key"] = apiKey;
if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

const response = await fetch(`${apiUrl}/websites/${websiteId}/event-data/values?${query}`, { headers });
if (!response.ok) throw new Error(`Umami API returned ${response.status}: ${await response.text()}`);
const values = await response.json() as Array<{ value: string; total: number }>;
const counts = Object.fromEntries(values
  .filter((item) => typeof item.value === "string" && Number.isFinite(item.total))
  .map((item) => [item.value, item.total] as const)
  .sort(([a], [b]) => a.localeCompare(b)));

const output = { updatedAt: new Date().toISOString(), counts };
await writeFile(join(new URL("../", import.meta.url).pathname, "src/data/popularity.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Updated popularity counts for ${Object.keys(counts).length} themes`);
