import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  mockClient,
  captureToolHandlers,
  type ToolHandler,
} from "./test-helpers.js";

vi.mock("../services/freshdesk-client.js", () => ({
  getClient: () => mockClient,
  handleApiError: (error: unknown) =>
    `Error: ${error instanceof Error ? error.message : String(error)}`,
}));

import { registerCannedResponseTools } from "./canned-responses.js";

describe("Canned Response Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerCannedResponseTools(server);
  });

  describe("freshdesk_list_canned_response_folders", () => {
    it("should list all canned response folders", async () => {
      const folders = [
        { id: 1, name: "General" },
        { id: 2, name: "Billing" },
      ];
      mockClient.get.mockResolvedValue(folders);

      const result = await handlers.get("freshdesk_list_canned_response_folders")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/canned_response_folders");
      expect(result.content[0].text).toBe(JSON.stringify(folders, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_canned_response_folders")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_canned_responses", () => {
    it("should list canned responses in a folder", async () => {
      const responses = [
        { id: 10, title: "Welcome", content: "Hello!" },
        { id: 11, title: "Closing", content: "Thank you." },
      ];
      mockClient.get.mockResolvedValue(responses);

      const result = await handlers.get("freshdesk_list_canned_responses")!({
        folder_id: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/canned_response_folders/1/responses"
      );
      expect(result.content[0].text).toBe(JSON.stringify(responses, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_list_canned_responses")!({
        folder_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_canned_response", () => {
    it("should get a specific canned response", async () => {
      const response = {
        id: 10,
        title: "Welcome",
        content: "<p>Hello! How can we help?</p>",
      };
      mockClient.get.mockResolvedValue(response);

      const result = await handlers.get("freshdesk_get_canned_response")!({
        canned_response_id: 10,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/canned_responses/10");
      expect(result.content[0].text).toBe(JSON.stringify(response, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_canned_response")!({
        canned_response_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });
});
