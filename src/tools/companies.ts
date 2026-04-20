import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";
import { fetchAllPages, fetchAllSearchPages } from "../services/pagination.js";

export function registerCompanyTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_create_company",
    {
      title: "Create Freshdesk Company",
      description: `Create a new company in Freshdesk.

Args:
  - name (string): Company name (unique)
  - description (string, optional): Description
  - domains (string[], optional): Associated email domains
  - health_score (string, optional): Health score
  - account_tier (string, optional): Account tier
  - renewal_date (string, optional): Renewal date (ISO 8601)
  - industry (string, optional): Industry
  - custom_fields (object, optional): Custom fields

Returns: Created company object.`,
      inputSchema: {
        name: z.string().min(1).describe("Company name (unique)"),
        description: z.string().optional().describe("Description"),
        domains: z.array(z.string()).optional().describe("Email domains"),
        health_score: z.string().optional().describe("Health score"),
        account_tier: z.string().optional().describe("Account tier"),
        renewal_date: z.string().optional().describe("Renewal date (ISO 8601)"),
        industry: z.string().optional().describe("Industry"),
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
        const result = await getClient().post("/companies", params);
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
    "freshdesk_get_company",
    {
      title: "Get Freshdesk Company",
      description: `Retrieve a company by ID.

Args:
  - company_id (number): Company ID

Returns: Company object.`,
      inputSchema: {
        company_id: z.number().int().describe("Company ID"),
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
        const result = await getClient().get(`/companies/${params.company_id}`);
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
    "freshdesk_list_companies",
    {
      title: "List Freshdesk Companies",
      description: `List all companies with pagination.

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all companies (default: false)

Returns: Array of company objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all companies"),
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
          const result = await client.get("/companies", {
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/companies");
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
    "freshdesk_update_company",
    {
      title: "Update Freshdesk Company",
      description: `Update an existing company. Only provide fields to change.

Args:
  - company_id (number): Company ID
  - name (string, optional): New name
  - description (string, optional): Description
  - domains (string[], optional): Email domains
  - health_score (string, optional): Health score
  - account_tier (string, optional): Account tier
  - renewal_date (string, optional): Renewal date
  - industry (string, optional): Industry
  - custom_fields (object, optional): Custom fields

Returns: Updated company object.`,
      inputSchema: {
        company_id: z.number().int().describe("Company ID"),
        name: z.string().optional().describe("Name"),
        description: z.string().optional().describe("Description"),
        domains: z.array(z.string()).optional().describe("Domains"),
        health_score: z.string().optional().describe("Health score"),
        account_tier: z.string().optional().describe("Account tier"),
        renewal_date: z.string().optional().describe("Renewal date"),
        industry: z.string().optional().describe("Industry"),
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
        const { company_id, ...updateData } = params;
        const result = await getClient().put(`/companies/${company_id}`, updateData);
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
    "freshdesk_delete_company",
    {
      title: "Delete Freshdesk Company",
      description: `Delete a company by ID.

Args:
  - company_id (number): Company ID

Returns: Confirmation message.`,
      inputSchema: {
        company_id: z.number().int().describe("Company ID"),
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
        await getClient().delete(`/companies/${params.company_id}`);
        return {
          content: [
            { type: "text", text: `Company ${params.company_id} deleted successfully.` },
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
    "freshdesk_search_companies",
    {
      title: "Search Freshdesk Companies",
      description: `Search companies using Freshdesk query language.

Query syntax examples:
  - "name:'Acme Corp'"
  - "domain:'acme.com'"
  - "created_at:>'2024-01-01'"

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
          const result = await client.get("/search/companies", {
            ...baseQuery,
            page: params.page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const aggregated = await fetchAllSearchPages(
          client,
          "/search/companies",
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
