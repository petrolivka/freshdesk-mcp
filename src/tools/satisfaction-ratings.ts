import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";
import { fetchAllPages } from "../services/pagination.js";

export function registerSatisfactionRatingTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_satisfaction_ratings",
    {
      title: "List Satisfaction Ratings",
      description: `List all customer satisfaction ratings across the helpdesk.

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all ratings (default: false)

Returns: Array of satisfaction rating objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all ratings"),
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
        const client = getClient();
        if (!params.fetch_all) {
          const result = await client.get("/surveys/satisfaction_ratings", {
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/surveys/satisfaction_ratings");
        return {
          content: [{ type: "text", text: JSON.stringify(all, null, 2) }],
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
    "freshdesk_get_ticket_satisfaction_ratings",
    {
      title: "Get Ticket Satisfaction Ratings",
      description: `Retrieve satisfaction ratings for a specific ticket.

Args:
  - ticket_id (number): Ticket ID

Returns: Array of satisfaction rating objects for the ticket.`,
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
          `/tickets/${params.ticket_id}/satisfaction_ratings`
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
    "freshdesk_list_sla_policies",
    {
      title: "List SLA Policies",
      description: `List all SLA policies configured in the helpdesk.

Returns: Array of SLA policy objects with escalation and target details.`,
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
        const result = await getClient().get("/sla_policies");
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
