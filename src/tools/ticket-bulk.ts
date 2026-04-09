import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerTicketBulkTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_bulk_update_tickets",
    {
      title: "Bulk Update Freshdesk Tickets",
      description: `Update multiple tickets at once. Provide ticket IDs and the fields to update.

Args:
  - ids (number[]): Array of ticket IDs to update
  - priority (1-4, optional): New priority for all tickets
  - status (2-5, optional): New status for all tickets
  - group_id (number, optional): Reassign all tickets to group
  - responder_id (number, optional): Reassign all tickets to agent
  - type (string, optional): New ticket type
  - tags (string[], optional): Replace tags on all tickets
  - custom_fields (object, optional): Update custom fields

Returns: Confirmation with job ID for tracking bulk operation.`,
      inputSchema: {
        ids: z.array(z.number().int()).min(1).describe("Array of ticket IDs to update"),
        priority: z.coerce.number().int().min(1).max(4).optional().describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
        status: z.coerce.number().int().min(2).max(5).optional().describe("Status: 2=Open, 3=Pending, 4=Resolved, 5=Closed"),
        group_id: z.number().int().optional().describe("Group ID"),
        responder_id: z.number().int().optional().describe("Agent ID"),
        type: z.string().optional().describe("Ticket type"),
        tags: z.array(z.string()).optional().describe("Tags"),
        custom_fields: z.record(z.unknown()).optional().describe("Custom fields"),
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
        const { ids, ...properties } = params;
        const result = await getClient().put("/tickets/bulk_update", {
          ids,
          properties,
        });
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
    "freshdesk_merge_tickets",
    {
      title: "Merge Freshdesk Tickets",
      description: `Merge multiple tickets into a single target ticket. Source tickets will be closed and their conversations moved to the target.

Args:
  - target_ticket_id (number): The ticket ID to merge into (primary ticket)
  - source_ticket_ids (number[]): Array of ticket IDs to merge from

Returns: Confirmation message.`,
      inputSchema: {
        target_ticket_id: z.number().int().describe("Target ticket ID to merge into"),
        source_ticket_ids: z.array(z.number().int()).min(1).describe("Source ticket IDs to merge from"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const result = await getClient().post("/tickets/merge", {
          primary_ticket_id: params.target_ticket_id,
          ticket_ids: params.source_ticket_ids,
        });
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
