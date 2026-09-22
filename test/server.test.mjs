// ABOUTME: Starts the built server over stdio and exercises the MCP handshake, tool listing, and tool calls.
// ABOUTME: Catches entry-point build failures and registration problems that unit tests cannot see.
import assert from "node:assert/strict";
import { test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";

// Start dist/cli.js with the same Node binary that runs the tests and no API token.
const startServer = async () => {
  const env = { ...getDefaultEnvironment() };
  delete env.CLARITY_API_TOKEN;

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../dist/cli.js", import.meta.url).pathname],
    env,
    stderr: "pipe",
  });
  const stderrChunks = [];
  transport.stderr.on("data", (chunk) => stderrChunks.push(chunk));

  const client = new Client({ name: "clarity-mcp-server-tests", version: "0.0.0" });
  await client.connect(transport);
  return { client, stderr: () => Buffer.concat(stderrChunks).toString() };
};

test("server starts and lists the three Clarity tools", async () => {
  const { client } = await startServer();
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      ["list-session-recordings", "query-analytics-dashboard", "query-documentation-resources"],
    );
  } finally {
    await client.close();
  }
});

test("server reports a missing token as a tool error without calling the network", async () => {
  const { client, stderr } = await startServer();
  try {
    const result = await client.callTool({
      name: "query-documentation-resources",
      arguments: { query: "How do I install Clarity?" },
    });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /No Clarity API token provided/);
    assert.match(stderr(), /No Clarity API token configured/);
  } finally {
    await client.close();
  }
});

test("server rejects an invalid session recording date with a validation error", async () => {
  const { client } = await startServer();
  try {
    const result = await client.callTool({
      name: "list-session-recordings",
      arguments: { filters: { date: { start: "yesterday", end: "2024-01-31T23:59:59.999Z" } } },
    });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Input validation error/);
    assert.doesNotMatch(result.content[0].text, /Invalid time value/);
  } finally {
    await client.close();
  }
});
