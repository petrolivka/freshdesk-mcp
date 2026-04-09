#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTicketTools } from "./tools/tickets.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerConversationTools } from "./tools/conversations.js";
import { registerAgentTools } from "./tools/agents.js";
import { registerTimeEntryTools } from "./tools/time-entries.js";
import { registerFieldTools } from "./tools/fields.js";
import { registerCannedResponseTools } from "./tools/canned-responses.js";
import { registerProductTools } from "./tools/products.js";

const server = new McpServer({
  name: "freshdesk-mcp-server",
  version: "1.0.0",
});

registerTicketTools(server);
registerContactTools(server);
registerCompanyTools(server);
registerConversationTools(server);
registerAgentTools(server);
registerTimeEntryTools(server);
registerFieldTools(server);
registerCannedResponseTools(server);
registerProductTools(server);

async function main(): Promise<void> {
  const domain = process.env.FRESHDESK_DOMAIN;
  const apiKey = process.env.FRESHDESK_API_KEY;

  if (!domain || !apiKey) {
    console.error(
      "ERROR: FRESHDESK_DOMAIN and FRESHDESK_API_KEY environment variables are required."
    );
    console.error("  FRESHDESK_DOMAIN: Your Freshdesk subdomain (e.g. 'mycompany')");
    console.error("  FRESHDESK_API_KEY: Your Freshdesk API key from Profile Settings");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Freshdesk MCP server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
