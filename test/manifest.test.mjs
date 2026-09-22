// ABOUTME: Checks that manifest.json stays in sync with package.json and the tools the server registers.
// ABOUTME: Extension gallery metadata drifts silently, so this pins it to the source of truth.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ANALYTICS_DASHBOARD_DESCRIPTION,
  ANALYTICS_DASHBOARD_TOOL,
  DOCUMENTATION_DESCRIPTION,
  DOCUMENTATION_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  SESSION_RECORDINGS_TOOL,
} from "../dist/constants.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const manifest = readJson("../manifest.json");
const pkg = readJson("../package.json");

test("manifest version matches package version", () => {
  assert.equal(manifest.version, pkg.version);
});

test("manifest lists exactly the tools the server registers", () => {
  const expected = {
    [SESSION_RECORDINGS_TOOL]: SESSION_RECORDINGS_DESCRIPTION,
    [DOCUMENTATION_TOOL]: DOCUMENTATION_DESCRIPTION,
    [ANALYTICS_DASHBOARD_TOOL]: ANALYTICS_DASHBOARD_DESCRIPTION,
  };
  const actual = Object.fromEntries(manifest.tools.map((tool) => [tool.name, tool.description]));
  assert.deepEqual(actual, expected);
});

test("manifest node runtime matches package engines", () => {
  assert.equal(manifest.compatibility.runtimes.node, pkg.engines.node);
});
