import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerTimeEntryTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_create_time_entry",
    {
      title: "Create Freshdesk Time Entry",
      description: `Create a time entry for a ticket to track work hours.

Args:
  - ticket_id (number): Ticket ID to log time against
  - time_spent (string): Time spent in hh:mm format (e.g. "01:30" for 1 hour 30 minutes)
  - billable (boolean, optional): Whether the entry is billable (default: true)
  - note (string, optional): Description of work performed
  - agent_id (number, optional): Agent who performed the work (defaults to current agent)

Returns: Created time entry object with ID.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        time_spent: z.string().describe("Time spent in hh:mm format"),
        billable: z.boolean().default(true).describe("Whether the entry is billable"),
        note: z.string().optional().describe("Description of work performed"),
        agent_id: z.number().int().optional().describe("Agent ID"),
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
        const { ticket_id, ...body } = params;
        const result = await getClient().post(
          `/tickets/${ticket_id}/time_entries`,
          body
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
    "freshdesk_list_time_entries",
    {
      title: "List Freshdesk Time Entries",
      description: `List all time entries. Can filter by ticket, company, or agent.

Args:
  - page (number, optional): Page number (default: 1)
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - ticket_id (number, optional): Filter by ticket ID
  - company_id (number, optional): Filter by company ID
  - agent_id (number, optional): Filter by agent ID
  - executed_after (string, optional): ISO 8601 date - entries executed after this time
  - executed_before (string, optional): ISO 8601 date - entries executed before this time
  - billable (boolean, optional): Filter by billable status

Returns: Array of time entry objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        ticket_id: z.number().int().optional().describe("Filter by ticket ID"),
        company_id: z.number().int().optional().describe("Filter by company ID"),
        agent_id: z.number().int().optional().describe("Filter by agent ID"),
        executed_after: z.string().optional().describe("ISO 8601 date - entries after this time"),
        executed_before: z.string().optional().describe("ISO 8601 date - entries before this time"),
        billable: z.boolean().optional().describe("Filter by billable status"),
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
        const query: Record<string, unknown> = {
          page: params.page,
          per_page: params.per_page,
        };
        if (params.ticket_id) query.ticket_id = params.ticket_id;
        if (params.company_id) query.company_id = params.company_id;
        if (params.agent_id) query.agent_id = params.agent_id;
        if (params.executed_after) query.executed_after = params.executed_after;
        if (params.executed_before) query.executed_before = params.executed_before;
        if (params.billable !== undefined) query.billable = params.billable;

        const result = await getClient().get("/time_entries", query);
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
    "freshdesk_update_time_entry",
    {
      title: "Update Freshdesk Time Entry",
      description: `Update an existing time entry.

Args:
  - time_entry_id (number): Time entry ID
  - time_spent (string, optional): Time spent in hh:mm format
  - billable (boolean, optional): Whether the entry is billable
  - note (string, optional): Description of work performed

Returns: Updated time entry object.`,
      inputSchema: {
        time_entry_id: z.number().int().describe("Time entry ID"),
        time_spent: z.string().optional().describe("Time spent in hh:mm format"),
        billable: z.boolean().optional().describe("Whether the entry is billable"),
        note: z.string().optional().describe("Description of work performed"),
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
        const { time_entry_id, ...updateData } = params;
        const result = await getClient().put(
          `/time_entries/${time_entry_id}`,
          updateData
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
    "freshdesk_delete_time_entry",
    {
      title: "Delete Freshdesk Time Entry",
      description: `Delete a time entry by ID.

Args:
  - time_entry_id (number): Time entry ID to delete

Returns: Confirmation message.`,
      inputSchema: {
        time_entry_id: z.number().int().describe("Time entry ID to delete"),
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
        await getClient().delete(`/time_entries/${params.time_entry_id}`);
        return {
          content: [
            {
              type: "text",
              text: `Time entry ${params.time_entry_id} deleted successfully.`,
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

  server.registerTool(
    "freshdesk_toggle_timer",
    {
      title: "Toggle Freshdesk Timer",
      description: `Start or stop a timer on a time entry. Toggles between running and stopped states.

Args:
  - time_entry_id (number): Time entry ID to toggle

Returns: Updated time entry object with timer status.`,
      inputSchema: {
        time_entry_id: z.number().int().describe("Time entry ID"),
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
        const result = await getClient().put(
          `/time_entries/${params.time_entry_id}/toggle_timer`,
          {}
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
}
