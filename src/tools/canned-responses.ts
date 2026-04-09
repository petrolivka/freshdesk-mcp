import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerCannedResponseTools(server: McpServer): void {
  server.registerTool(
    "freshdesk_list_canned_response_folders",
    {
      title: "List Canned Response Folders",
      description: `List all canned response folders.

Returns: Array of canned response folder objects with id and name.`,
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
        const result = await getClient().get("/canned_response_folders");
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
    "freshdesk_list_canned_responses",
    {
      title: "List Canned Responses in Folder",
      description: `List all canned responses within a specific folder.

Args:
  - folder_id (number): Canned response folder ID

Returns: Array of canned response objects within the folder.`,
      inputSchema: {
        folder_id: z.number().int().describe("Canned response folder ID"),
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
          `/canned_response_folders/${params.folder_id}/responses`
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
    "freshdesk_get_canned_response",
    {
      title: "Get Canned Response",
      description: `Retrieve a specific canned response by ID.

Args:
  - canned_response_id (number): Canned response ID

Returns: Canned response object with title and content.`,
      inputSchema: {
        canned_response_id: z.number().int().describe("Canned response ID"),
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
          `/canned_responses/${params.canned_response_id}`
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
