// ABOUTME: Entry point that builds the MCP server, registers the three Clarity tools, and serves stdio.
// ABOUTME: Tool handlers delegate to tools.ts. Input validation comes from the schemas in types.ts.
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

import pkg from "../package.json" with { type: "json" };

import {
  ANALYTICS_DASHBOARD_DESCRIPTION,
  ANALYTICS_DASHBOARD_TOOL,
  CLARITY_API_TOKEN,
  DOCUMENTATION_DESCRIPTION,
  DOCUMENTATION_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";
import { SYSTEM_INSTRUCTIONS_PROMPT } from "./instructions.js";
import {
  listSessionRecordingsAsync,
  queryAnalyticsDashboardAsync,
  queryDocumentationAsync
} from "./tools.js";
import { ListRequest, SearchRequest } from "./types.js";

const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

const createServer = () => {
  const server = new McpServer(
    { name: pkg.name, version: pkg.version },
    { instructions: SYSTEM_INSTRUCTIONS_PROMPT, capabilities: { resources: {}, tools: {} } },
  );

  server.registerTool(
    ANALYTICS_DASHBOARD_TOOL,
    { title: "Query Analytics Dashboard", description: ANALYTICS_DASHBOARD_DESCRIPTION, inputSchema: z.object(SearchRequest), annotations: readOnly },
    async ({ query }) => queryAnalyticsDashboardAsync(query, Intl.DateTimeFormat().resolvedOptions().timeZone),
  );

  server.registerTool(
    SESSION_RECORDINGS_TOOL,
    { title: "List Session Recordings", description: SESSION_RECORDINGS_DESCRIPTION, inputSchema: z.object(ListRequest), annotations: readOnly },
    async ({ filters, sortBy, count }) =>
      listSessionRecordingsAsync(new Date(filters.date.start), new Date(filters.date.end), filters, sortBy, count),
  );

  server.registerTool(
    DOCUMENTATION_TOOL,
    { title: "Query Documentation Resources", description: DOCUMENTATION_DESCRIPTION, inputSchema: z.object(SearchRequest), annotations: readOnly },
    async ({ query }) => queryDocumentationAsync(query),
  );

  return server;
};

if (CLARITY_API_TOKEN) {
  console.error("Clarity API token configured via environment/command-line");
} else {
  console.error("No Clarity API token configured. Set CLARITY_API_TOKEN or pass --clarity_api_token.");
}

serveStdio(createServer);
console.error("Microsoft Clarity Data Export MCP Server running on stdio...");
