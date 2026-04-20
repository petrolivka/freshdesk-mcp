import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";
import { fetchAllPages } from "../services/pagination.js";

export function registerAgentTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_agents",
    {
      title: "List Freshdesk Agents",
      description: `List all agents in the helpdesk (paginated).

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all matching agents (default: false)
  - email (string, optional): Filter by email
  - mobile (string, optional): Filter by mobile
  - phone (string, optional): Filter by phone

Returns: Array of agent objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all matching agents"),
        email: z.string().optional().describe("Filter by email"),
        mobile: z.string().optional().describe("Filter by mobile"),
        phone: z.string().optional().describe("Filter by phone"),
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
        if (params.mobile) baseQuery.mobile = params.mobile;
        if (params.phone) baseQuery.phone = params.phone;

        if (!params.fetch_all) {
          const result = await client.get("/agents", {
            ...baseQuery,
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/agents", baseQuery);
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
    "freshdesk_get_agent",
    {
      title: "Get Freshdesk Agent",
      description: `Retrieve a specific agent by ID.

Args:
  - agent_id (number): Agent ID

Returns: Agent object with all fields.`,
      inputSchema: {
        agent_id: z.number().int().describe("Agent ID"),
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
        const result = await getClient().get(`/agents/${params.agent_id}`);
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
    "freshdesk_get_current_agent",
    {
      title: "Get Current Freshdesk Agent",
      description: `Retrieve the currently authenticated agent's details.

Returns: Current agent object.`,
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
        const result = await getClient().get("/agents/me");
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
    "freshdesk_list_groups",
    {
      title: "List Freshdesk Groups",
      description: `List all agent groups (paginated).

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all groups (default: false)

Returns: Array of group objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all groups"),
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
          const result = await client.get("/groups", {
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/groups");
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
    "freshdesk_get_group",
    {
      title: "Get Freshdesk Group",
      description: `Retrieve a specific group by ID.

Args:
  - group_id (number): Group ID

Returns: Group object.`,
      inputSchema: {
        group_id: z.number().int().describe("Group ID"),
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
        const result = await getClient().get(`/groups/${params.group_id}`);
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
    "freshdesk_list_roles",
    {
      title: "List Freshdesk Roles",
      description: `List all roles in the helpdesk (paginated).

Args:
  - page (number, optional): Page number (default: 1). Ignored when fetch_all is true.
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - fetch_all (boolean, optional): If true, auto-paginate and return all roles (default: false)

Returns: Array of role objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
        fetch_all: z.boolean().default(false).describe("Auto-paginate to fetch all roles"),
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
          const result = await client.get("/roles", {
            page: params.page,
            per_page: params.per_page,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        const all = await fetchAllPages(client, "/roles");
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
}
