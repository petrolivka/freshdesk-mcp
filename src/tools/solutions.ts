import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, handleApiError } from "../services/freshdesk-client.js";

export function registerSolutionTools(server: McpServer): void {
  // --- Categories ---

  server.registerTool(
    "freshdesk_list_solution_categories",
    {
      title: "List Solution Categories",
      description: `List all knowledge base solution categories.

Returns: Array of solution category objects with id, name, description, and visibility.`,
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
        const result = await getClient().get("/solutions/categories");
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
    "freshdesk_get_solution_category",
    {
      title: "Get Solution Category",
      description: `Retrieve a specific solution category by ID.

Args:
  - category_id (number): Solution category ID

Returns: Solution category object.`,
      inputSchema: {
        category_id: z.number().int().describe("Solution category ID"),
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
          `/solutions/categories/${params.category_id}`
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

  // --- Folders ---

  server.registerTool(
    "freshdesk_list_solution_folders",
    {
      title: "List Solution Folders",
      description: `List all folders within a solution category.

Args:
  - category_id (number): Solution category ID

Returns: Array of solution folder objects.`,
      inputSchema: {
        category_id: z.number().int().describe("Solution category ID"),
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
          `/solutions/categories/${params.category_id}/folders`
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
    "freshdesk_get_solution_folder",
    {
      title: "Get Solution Folder",
      description: `Retrieve a specific solution folder by ID.

Args:
  - category_id (number): Solution category ID
  - folder_id (number): Solution folder ID

Returns: Solution folder object with articles count and hierarchy.`,
      inputSchema: {
        category_id: z.number().int().describe("Solution category ID"),
        folder_id: z.number().int().describe("Solution folder ID"),
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
          `/solutions/categories/${params.category_id}/folders/${params.folder_id}`
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

  // --- Articles ---

  server.registerTool(
    "freshdesk_list_solution_articles",
    {
      title: "List Solution Articles",
      description: `List all articles within a solution folder.

Args:
  - category_id (number): Solution category ID
  - folder_id (number): Solution folder ID

Returns: Array of solution article objects.`,
      inputSchema: {
        category_id: z.number().int().describe("Solution category ID"),
        folder_id: z.number().int().describe("Solution folder ID"),
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
          `/solutions/categories/${params.category_id}/folders/${params.folder_id}/articles`
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
    "freshdesk_get_solution_article",
    {
      title: "Get Solution Article",
      description: `Retrieve a specific solution article by ID.

Args:
  - article_id (number): Solution article ID

Returns: Solution article object with title, description, status, and metadata.`,
      inputSchema: {
        article_id: z.number().int().describe("Solution article ID"),
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
          `/solutions/articles/${params.article_id}`
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
    "freshdesk_create_solution_article",
    {
      title: "Create Solution Article",
      description: `Create a new knowledge base article in a specific folder.

Args:
  - category_id (number): Solution category ID
  - folder_id (number): Solution folder ID
  - title (string): Article title
  - description (string): Article content (HTML supported)
  - status (number, optional): 1=Draft, 2=Published (default: 1)

Returns: Created solution article object.`,
      inputSchema: {
        category_id: z.number().int().describe("Solution category ID"),
        folder_id: z.number().int().describe("Solution folder ID"),
        title: z.string().min(1).describe("Article title"),
        description: z.string().min(1).describe("Article content (HTML)"),
        status: z.number().int().min(1).max(2).default(1).describe("Status: 1=Draft, 2=Published"),
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
        const { category_id, folder_id, ...body } = params;
        const result = await getClient().post(
          `/solutions/categories/${category_id}/folders/${folder_id}/articles`,
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
    "freshdesk_update_solution_article",
    {
      title: "Update Solution Article",
      description: `Update an existing knowledge base article.

Args:
  - article_id (number): Solution article ID
  - title (string, optional): New title
  - description (string, optional): New content (HTML)
  - status (number, optional): 1=Draft, 2=Published

Returns: Updated solution article object.`,
      inputSchema: {
        article_id: z.number().int().describe("Solution article ID"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New content (HTML)"),
        status: z.number().int().min(1).max(2).optional().describe("Status: 1=Draft, 2=Published"),
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
        const { article_id, ...updateData } = params;
        const result = await getClient().put(
          `/solutions/articles/${article_id}`,
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
}
