import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerFieldTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_ticket_fields",
    {
      title: "List Freshdesk Ticket Fields",
      description: `List all ticket fields including custom fields.

Returns available fields with their types, choices, and configuration. Useful for discovering custom fields when creating or updating tickets.

Returns: Array of ticket field objects.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const result = await getClient().get("/ticket_fields");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_list_contact_fields",
    {
      title: "List Freshdesk Contact Fields",
      description: `List all contact fields including custom fields.

Returns available fields with their types, choices, and configuration. Useful for discovering custom fields when creating or updating contacts.

Returns: Array of contact field objects.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const result = await getClient().get("/contact_fields");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "freshdesk_list_company_fields",
    {
      title: "List Freshdesk Company Fields",
      description: `List all company fields including custom fields.

Returns available fields with their types, choices, and configuration. Useful for discovering custom fields when creating or updating companies.

Returns: Array of company field objects.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const result = await getClient().get("/company_fields");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleApiError(error) }],
        };
      }
    }
  );
}
