import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerTicketWatcherTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_ticket_watchers",
    {
      title: "List Ticket Watchers",
      description: `List all watchers (agents following) a ticket.

Args:
  - ticket_id (number): Ticket ID

Returns: Array of watcher objects.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await getClient().get(
          `/tickets/${params.ticket_id}/watchers`
        );
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
    "freshdesk_add_ticket_watcher",
    {
      title: "Add Ticket Watcher",
      description: `Add an agent as a watcher on a ticket.

Args:
  - ticket_id (number): Ticket ID
  - user_id (number): Agent ID to add as watcher

Returns: Confirmation of watcher addition.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        user_id: z.number().int().describe("Agent ID to add as watcher"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await getClient().post(
          `/tickets/${params.ticket_id}/watchers`,
          { user_id: params.user_id }
        );
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
    "freshdesk_remove_ticket_watcher",
    {
      title: "Remove Ticket Watcher",
      description: `Remove a watcher from a ticket.

Args:
  - ticket_id (number): Ticket ID
  - watcher_id (number): Watcher ID to remove

Returns: Confirmation message.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        watcher_id: z.number().int().describe("Watcher ID to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await getClient().delete(
          `/tickets/${params.ticket_id}/watchers/${params.watcher_id}`
        );
        return {
          content: [
            {
              type: "text",
              text: `Watcher ${params.watcher_id} removed from ticket ${params.ticket_id} successfully.`,
            },
          ],
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
