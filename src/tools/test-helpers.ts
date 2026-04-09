import { vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Mocked Freshdesk client methods.
 */
export const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

/**
 * Mock the freshdesk-client module for tool tests.
 * Call this via vi.mock() at the top of each test file.
 */
export function createFreshdeskClientMock() {
  return {
    getClient: () => mockClient,
    handleApiError: (error: unknown) =>
      `Error: ${error instanceof Error ? error.message : String(error)}`,
  };
}

/**
 * Create a real McpServer instance for tool registration.
 */
export function createTestServer(): McpServer {
  return new McpServer({ name: "test-server", version: "0.0.1" });
}

/**
 * Extract the handler for a registered tool by calling the tool through the server.
 * Since McpServer doesn't expose handlers directly, we capture them during registration.
 */
export type ToolHandler = (params: any) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

/**
 * Capture tool handlers by spying on server.registerTool.
 */
export function captureToolHandlers(server: McpServer): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();
  const originalRegisterTool = server.registerTool.bind(server);

  server.registerTool = ((name: string, config: any, handler: ToolHandler) => {
    handlers.set(name, handler);
    return originalRegisterTool(name, config, handler);
  }) as any;

  return handlers;
}
