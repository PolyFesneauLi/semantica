import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { NAV_ITEMS, RAIL_BRAND_LABEL } from "../src/navItems";

const here = dirname(fileURLToPath(import.meta.url));
const explorerReadme = readFileSync(join(here, "..", "README.md"), "utf8");
const rootReadme = readFileSync(join(here, "..", "..", "README.md"), "utf8");

function knowledgeExplorerSection(markdown: string): string {
  const start = markdown.indexOf("## Knowledge Explorer");
  assert.ok(start >= 0, "root README must contain ## Knowledge Explorer");
  const next = markdown.indexOf("\n## ", start + 1);
  return next >= 0 ? markdown.slice(start, next) : markdown.slice(start);
}

test("explorer README documents every rail label in order", () => {
  const labels = [RAIL_BRAND_LABEL, ...NAV_ITEMS.map((item) => item.label)];
  let cursor = 0;
  for (const label of labels) {
    const heading = `### ${label}`;
    const at = explorerReadme.indexOf(heading, cursor);
    assert.ok(at >= 0, `explorer README missing heading ${heading}`);
    cursor = at + heading.length;
  }
});

test("root README Knowledge Explorer table uses rail labels", () => {
  const section = knowledgeExplorerSection(rootReadme);
  for (const item of NAV_ITEMS) {
    assert.match(section, new RegExp(`\\*\\*${item.label}\\*\\*`));
  }
  assert.match(section, /\*\*SKE\*\*/);
  assert.doesNotMatch(section, /\|\s*\*\*Timeline\*\*\s*\|/);
  assert.doesNotMatch(section, /\|\s*\*\*Registry\*\*\s*\|/);
  assert.doesNotMatch(section, /\|\s*\*\*Entity Resolution\*\*\s*\|/);
  assert.doesNotMatch(section, /\|\s*\*\*Knowledge Graph\*\*\s*\|/);
});

test("explorer README documents Enrich import .json/.csv and SPARQL verbs", () => {
  assert.match(explorerReadme, /\.json/);
  assert.match(explorerReadme, /\.csv/);
  assert.match(explorerReadme, /≤50 MB|50 MB/);
  assert.match(
    explorerReadme,
    /SELECT.*ASK.*CONSTRUCT.*DESCRIBE|`SELECT`.*`ASK`.*`CONSTRUCT`.*`DESCRIBE`/,
  );
  assert.match(explorerReadme, /sample preview/i);
  assert.match(explorerReadme, /only when `agent_memory`/i);
});

test("NAV_ITEMS order matches catalog contract", () => {
  assert.deepEqual(
    NAV_ITEMS.map((item) => item.id),
    ["explore", "analyze", "decisions", "enrich", "manage", "ontology-hub"],
  );
  assert.equal(RAIL_BRAND_LABEL, "SKE");
});
