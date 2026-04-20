import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";
import { fetchAllPages, fetchAllSearchPages } from "../services/pagination.js";

export function registerTicketTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_create_ticket",
    {
      title: "Create Freshdesk Ticket",
      description: `Create a new support ticket in Freshdesk.

Requires at least one requester identifier (email, phone, or requester_id) plus subject and description.

Args:
  - email (string, optional): Requester email
  - phone (string, optional): Requester phone
  - requester_id (number, optional): Requester contact ID
  - subject (string): Ticket subject
  - description (string): Ticket description (HTML supported)
  - priority (1-4): 1=Low, 2=Medium, 3=High, 4=Urgent
  - status (2-5): 2=Open, 3=Pending, 4=Resolved, 5=Closed
  - source (number, optional): Channel source
  - type (string, optional): Ticket type
  - group_id (number, optional): Assign to group
  - responder_id (number, optional): Assign to agent
  - tags (string[], optional): Tags
  - cc_emails (string[], optional): CC email addresses
  - custom_fields (object, optional): Custom field values

Returns: Created ticket object with ID and all fields.`,
      inputSchema: {
        email: z.string().email().optional().describe("Requester email"),
        phone: z.string().optional().describe("Requester phone"),
        requester_id: z.number().int().optional().describe("Requester contact ID"),
        subject: z.string().min(1).describe("Ticket subject"),
        description: z.string().min(1).describe("Ticket description (HTML)"),
        priority: z.coerce.number().int().min(1).max(4).default(1).describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
        status: z.coerce.number().int().min(2).max(5).default(2).describe("Status: 2=Open, 3=Pending, 4=Resolved, 5=Closed"),
        source: z.coerce.number().int().optional().describe("Source channel"),
        type: z.string().optional().describe("Ticket type"),
        group_id: z.number().int().optional().describe("Group ID"),
        responder_id: z.number().int().optional().describe("Agent ID"),
        tags: z.array(z.string()).optional().describe("Tags"),
        cc_emails: z.array(z.string().email()).optional().describe("CC emails"),
        custom_fields: z.record(z.unknown()).optional().describe("Custom fields"),
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
        const result = await getClient().post("/tickets", params);
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
    "freshdesk_get_ticket",
    {
      title: "Get Freshdesk Ticket",
      description: `Retrieve a specific ticket by ID.

Args:
  - ticket_id (number): The ticket ID
  - include (string, optional): Include additional data. Options: "conversations", "requester", "company", "stats", or comma-separated combination.

Returns: Ticket object with all fields.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        include: z
          .string()
          .optional()
          .describe(
            'Include related data: "conversations", "requester", "company", "stats"'
          ),
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
        const query: Record<string, unknown> = {};
        if (params.include) query.include = params.include;
        const result = await getClient().get(
          `/tickets/${params.ticket_id}`,
          query
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
    "freshdesk_list_tickets",
    {
      title: "List Freshdesk Tickets",
      description: `List tickets with optional filters. Returns paginated results (max 30 per page).

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all matching tickets (default: false). Freshdesk caps results at 300 pages.
  - filter (string, optional): Predefined filter - "new_and_my_open", "watching", "spam", "deleted"
  - requester_id (number, optional): Filter by requester
  - email (string, optional): Filter by requester email
  - company_id (number, optional): Filter by company
  - updated_since (string, optional): ISO 8601 date - tickets updated after this time
  - order_by (string, optional): "created_at", "due_by", "updated_at", "status" (default: "created_at")
  - order_type (string, optional): "asc" or "desc" (default: "desc")
  - include (string, optional): Include "requester", "company", "stats", or "description"

Returns: Array of ticket objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all matching tickets"),
        filter: z.string().optional().describe("Predefined filter"),
        requester_id: z.number().int().optional().describe("Filter by requester ID"),
        email: z.string().email().optional().describe("Filter by requester email"),
        company_id: z.number().int().optional().describe("Filter by company ID"),
        updated_since: z.string().optional().describe("ISO 8601 date - tickets updated after this"),
        order_by: z.enum(["created_at", "due_by", "updated_at", "status"]).default("created_at").describe("Sort field"),
        order_type: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
        include: z.string().optional().describe("Include additional data"),
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
        const baseQuery: Record<string, unknown> = {
          order_by: params.order_by,
          order_type: params.order_type,
        };
        if (params.filter) baseQuery.filter = params.filter;
        if (params.requester_id) baseQuery.requester_id = params.requester_id;
        if (params.email) baseQuery.email = params.email;
        if (params.company_id) baseQuery.company_id = params.company_id;
        if (params.updated_since) baseQuery.updated_since = params.updated_since;
        if (params.include) baseQuery.include = params.include;

        if (!params.fetch_all) {
          const result = await client.get("/tickets", {
            ...baseQuery,
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }

        const all = await fetchAllPages(client, "/tickets", baseQuery);
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
    "freshdesk_update_ticket",
    {
      title: "Update Freshdesk Ticket",
      description: `Update an existing ticket. Only provide fields you want to change.

Args:
  - ticket_id (number): Ticket ID to update
  - subject (string, optional): New subject
  - description (string, optional): New description
  - priority (1-4, optional): New priority
  - status (2-5, optional): New status
  - source (number, optional): New source
  - type (string, optional): New type
  - group_id (number, optional): Reassign to group
  - responder_id (number, optional): Reassign to agent
  - tags (string[], optional): Replace tags
  - custom_fields (object, optional): Update custom fields

Returns: Updated ticket object.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID"),
        subject: z.string().optional().describe("New subject"),
        description: z.string().optional().describe("New description"),
        priority: z.coerce.number().int().min(1).max(4).optional().describe("Priority"),
        status: z.coerce.number().int().min(2).max(5).optional().describe("Status"),
        source: z.coerce.number().int().optional().describe("Source"),
        type: z.string().optional().describe("Type"),
        group_id: z.number().int().optional().describe("Group ID"),
        responder_id: z.number().int().optional().describe("Agent ID"),
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
        const { ticket_id, ...updateData } = params;
        const result = await getClient().put(`/tickets/${ticket_id}`, updateData);
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
    "freshdesk_delete_ticket",
    {
      title: "Delete Freshdesk Ticket",
      description: `Delete a ticket by ID (moves to trash).

Args:
  - ticket_id (number): Ticket ID to delete

Returns: Confirmation message.`,
      inputSchema: {
        ticket_id: z.number().int().describe("Ticket ID to delete"),
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
        await getClient().delete(`/tickets/${params.ticket_id}`);
        return {
          content: [
            {
              type: "text",
              text: `Ticket ${params.ticket_id} deleted successfully.`,
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
    "freshdesk_search_tickets",
    {
      title: "Search Freshdesk Tickets",
      description: `Search tickets using Freshdesk query language.

Query syntax examples:
  - "priority:3 AND status:2" - High priority open tickets
  - "agent_id:123" - Tickets assigned to specific agent
  - "group_id:456" - Tickets in specific group
  - "tag:'billing'" - Tickets with tag
  - "created_at:>'2024-01-01'" - Tickets created after date
  - "type:'Question'" - Tickets of type Question
  - "requester_id:789" - Tickets from specific requester
  - "company_id:101" - Tickets from specific company

Supports: priority, status, agent_id, group_id, requester_id, company_id, type, tag, due_by, created_at, updated_at, and custom fields.

Args:
  - query (string): Search query in Freshdesk query language
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - fetch_all (boolean, optional): If true, auto-paginate across all pages (default: false). Freshdesk search API is capped at 10 pages / 300 results.

Returns: Object with results array (max 30 per page) and total count.`,
      inputSchema: {
        query: z.string().min(1).describe("Search query in Freshdesk query language"),
        page: z.number().int().min(1).default(1).describe("Page number"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate up to Freshdesk's 10-page / 300-result search cap"),
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
        const baseQuery = { query: `"${params.query}"` };
        if (!params.fetch_all) {
          const result = await client.get("/search/tickets", {
            ...baseQuery,
            page: params.page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const aggregated = await fetchAllSearchPages(
          client,
          "/search/tickets",
          baseQuery
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(aggregated, null, 2) },
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
