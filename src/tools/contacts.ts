import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";
import { fetchAllPages, fetchAllSearchPages } from "../services/pagination.js";

export function registerContactTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_create_contact",
    {
      title: "Create Freshdesk Contact",
      description: `Create a new contact in Freshdesk. Requires at least one unique identifier (email, phone, mobile, or twitter_id).

Args:
  - name (string): Contact name
  - email (string, optional): Email address (unique)
  - phone (string, optional): Phone number
  - mobile (string, optional): Mobile number
  - address (string, optional): Address
  - description (string, optional): Description
  - job_title (string, optional): Job title
  - company_id (number, optional): Associated company ID
  - tags (string[], optional): Tags
  - custom_fields (object, optional): Custom fields

Returns: Created contact object.`,
      inputSchema: {
        name: z.string().min(1).describe("Contact name"),
        email: z.string().email().optional().describe("Email (unique)"),
        phone: z.string().optional().describe("Phone number"),
        mobile: z.string().optional().describe("Mobile number"),
        address: z.string().optional().describe("Address"),
        description: z.string().optional().describe("Description"),
        job_title: z.string().optional().describe("Job title"),
        company_id: z.number().int().optional().describe("Company ID"),
        tags: z.array(z.string()).optional().describe("Tags"),
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
        const result = await getClient().post("/contacts", params);
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
    "freshdesk_get_contact",
    {
      title: "Get Freshdesk Contact",
      description: `Retrieve a contact by ID.

Args:
  - contact_id (number): Contact ID

Returns: Contact object with all fields.`,
      inputSchema: {
        contact_id: z.number().int().describe("Contact ID"),
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
        const result = await getClient().get(`/contacts/${params.contact_id}`);
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
    "freshdesk_list_contacts",
    {
      title: "List Freshdesk Contacts",
      description: `List contacts with optional filters (paginated).

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all matching contacts (default: false)
  - email (string, optional): Filter by email
  - phone (string, optional): Filter by phone
  - mobile (string, optional): Filter by mobile
  - company_id (number, optional): Filter by company
  - updated_since (string, optional): ISO 8601 date

Returns: Array of contact objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all matching contacts"),
        email: z.string().optional().describe("Filter by email"),
        phone: z.string().optional().describe("Filter by phone"),
        mobile: z.string().optional().describe("Filter by mobile"),
        company_id: z.number().int().optional().describe("Filter by company"),
        updated_since: z.string().optional().describe("ISO 8601 date"),
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
        const baseQuery: Record<string, unknown> = {};
        if (params.email) baseQuery.email = params.email;
        if (params.phone) baseQuery.phone = params.phone;
        if (params.mobile) baseQuery.mobile = params.mobile;
        if (params.company_id) baseQuery.company_id = params.company_id;
        if (params.updated_since) baseQuery.updated_since = params.updated_since;

        if (!params.fetch_all) {
          const result = await client.get("/contacts", {
            ...baseQuery,
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/contacts", baseQuery);
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
    "freshdesk_update_contact",
    {
      title: "Update Freshdesk Contact",
      description: `Update an existing contact. Only provide fields you want to change.

Args:
  - contact_id (number): Contact ID
  - name (string, optional): Name
  - email (string, optional): Email
  - phone (string, optional): Phone
  - mobile (string, optional): Mobile
  - address (string, optional): Address
  - description (string, optional): Description
  - job_title (string, optional): Job title
  - company_id (number, optional): Company ID
  - tags (string[], optional): Tags
  - custom_fields (object, optional): Custom fields

Returns: Updated contact object.`,
      inputSchema: {
        contact_id: z.number().int().describe("Contact ID"),
        name: z.string().optional().describe("Name"),
        email: z.string().email().optional().describe("Email"),
        phone: z.string().optional().describe("Phone"),
        mobile: z.string().optional().describe("Mobile"),
        address: z.string().optional().describe("Address"),
        description: z.string().optional().describe("Description"),
        job_title: z.string().optional().describe("Job title"),
        company_id: z.number().int().optional().describe("Company ID"),
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
        const { contact_id, ...updateData } = params;
        const result = await getClient().put(`/contacts/${contact_id}`, updateData);
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
    "freshdesk_delete_contact",
    {
      title: "Delete Freshdesk Contact",
      description: `Soft-delete a contact (moves to trash).

Args:
  - contact_id (number): Contact ID

Returns: Confirmation message.`,
      inputSchema: {
        contact_id: z.number().int().describe("Contact ID"),
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
        await getClient().delete(`/contacts/${params.contact_id}`);
        return {
          content: [
            { type: "text", text: `Contact ${params.contact_id} deleted successfully.` },
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
    "freshdesk_search_contacts",
    {
      title: "Search Freshdesk Contacts",
      description: `Search contacts using Freshdesk query language.

Query syntax examples:
  - "email:'john@example.com'"
  - "company_id:123"
  - "phone:'555-0100'"
  - "created_at:>'2024-01-01'"
  - "updated_at:<'2024-06-01'"

Args:
  - query (string): Search query
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - fetch_all (boolean, optional): If true, auto-paginate up to Freshdesk's 10-page / 300-result search cap (default: false)

Returns: Object with results array (max 30 per page) and total count.`,
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
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
          const result = await client.get("/search/contacts", {
            ...baseQuery,
            page: params.page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const aggregated = await fetchAllSearchPages(
          client,
          "/search/contacts",
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
