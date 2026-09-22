// ABOUTME: Tests the session recordings input schema against the documented examples and edge cases.
// ABOUTME: Guards the contract between instructions.ts, types.ts, and the MCP tool registration.
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

import { SYSTEM_INSTRUCTIONS_PROMPT } from "../dist/instructions.js";
import { ListRequest } from "../dist/types.js";

const listRequestSchema = z.object(ListRequest);

const validDate = { start: "2024-01-01T00:00:00.000Z", end: "2024-01-31T23:59:59.999Z" };

// Pull every JSON example from the session recordings section of the instructions.
const instructionExamples = () => {
  const section = SYSTEM_INSTRUCTIONS_PROMPT.split("**Example Usage:**")[1].split("###")[0];
  return [...section.matchAll(/^- .*?: (\{.*\})$/gm)].map((match) => JSON.parse(match[1]));
};

test("instructions document at least five session recording examples", () => {
  assert.ok(instructionExamples().length >= 5);
});

for (const [index, example] of instructionExamples().entries()) {
  test(`session recording example ${index + 1} passes schema validation`, () => {
    const result = listRequestSchema.safeParse(example);
    assert.ok(result.success, JSON.stringify(result.error?.issues));
  });
}

test("date filter accepts UTC timestamps with and without milliseconds", () => {
  for (const start of ["2024-01-01T00:00:00Z", "2024-01-01T00:00:00.000Z"]) {
    const result = listRequestSchema.safeParse({ filters: { date: { start, end: validDate.end } } });
    assert.ok(result.success, `rejected ${start}`);
  }
});

test("date filter rejects strings that are not UTC ISO 8601 timestamps", () => {
  for (const start of ["yesterday", "2024-01-01", "2024-01-01T00:00:00+02:00"]) {
    const result = listRequestSchema.safeParse({ filters: { date: { start, end: validDate.end } } });
    assert.equal(result.success, false, `accepted ${start}`);
  }
});

test("date filter rejects a start date after the end date", () => {
  const result = listRequestSchema.safeParse({ filters: { date: { start: validDate.end, end: validDate.start } } });
  assert.equal(result.success, false);
});

test("count defaults to 100 and accepts the documented bounds", () => {
  assert.equal(listRequestSchema.parse({ filters: { date: validDate } }).count, 100);
  for (const count of [1, 250]) {
    assert.ok(listRequestSchema.safeParse({ filters: { date: validDate }, count }).success, `rejected ${count}`);
  }
});

test("count rejects values outside 1-250 and non-integers", () => {
  for (const count of [0, -1, 2.5, 251]) {
    const result = listRequestSchema.safeParse({ filters: { date: validDate }, count });
    assert.equal(result.success, false, `accepted ${count}`);
  }
});

test("range filters accept an open bound", () => {
  const result = listRequestSchema.safeParse({ filters: { date: validDate, scrollDepth: { min: null, max: 50 } } });
  assert.ok(result.success, JSON.stringify(result.error?.issues));
});

test("filter descriptions that tell the caller to set null match schemas that accept null", () => {
  for (const [name, schema] of Object.entries(ListRequest.filters.shape)) {
    if (/set to null/i.test(schema.description ?? "")) {
      assert.ok(schema.safeParse(null).success, `${name} says "set to null" but rejects null`);
    }
  }
});
