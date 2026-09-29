import assert from "node:assert/strict";
import test from "node:test";

import { formatLinkScore } from "../src/workspaces/GraphWorkspace/formatLinkScore";

test("link scores in 0–1 display as percents", () => {
  assert.equal(formatLinkScore(0.44), "44.0%");
  assert.equal(formatLinkScore(1), "100.0%");
});

test("raw ranking scores above 1 are not multiplied by 100", () => {
  assert.equal(formatLinkScore(44), "44.0");
  assert.equal(formatLinkScore(2200), "2200.0");
});
