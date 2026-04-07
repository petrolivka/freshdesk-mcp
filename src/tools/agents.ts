import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerAgentTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_agents",
    {
      title: "List Freshdesk Agents",
      description: `List all agents in the helpdesk.

Args:
  - page (number, optional): Page number (default: 1)
  - per_page (number, optional): Results per page, max 100 (default: 30)
  - email (string, optional): Filter by email
  - mobile (string, optional): Filter by mobile
  - phone (string, optional): Filter by phone

Returns: Array of agent objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
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
        const query: Record<string, unknown> = {
          page: params.page,
          per_page: params.per_page,
        };
        if (params.email) query.email = params.email;
        if (params.mobile) query.mobile = params.mobile;
        if (params.phone) query.phone = params.phone;

        const result = await getClient().get("/agents", query);
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
      description: `List all agent groups.

Args:
  - page (number, optional): Page number (default: 1)
  - per_page (number, optional): Results per page, max 100 (default: 30)

Returns: Array of group objects.`,
      inputSchema: {
        page: z.number().int().min(1).default(1).describe("Page number"),
        per_page: z.number().int().min(1).max(100).default(30).describe("Results per page"),
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
        const result = await getClient().get("/groups", {
          page: params.page,
          per_page: params.per_page,
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
      description: `List all roles in the helpdesk.

Returns: Array of role objects.`,
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
        const result = await getClient().get("/roles");
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
