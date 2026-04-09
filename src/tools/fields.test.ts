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

import { registerFieldTools } from "./fields.js";

describe("Field Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerFieldTools(server);
  });

  describe("freshdesk_list_ticket_fields", () => {
    it("should list all ticket fields", async () => {
      const fields = [
        { id: 1, name: "subject", type: "default_subject" },
        { id: 2, name: "priority", type: "default_priority" },
        { id: 3, name: "cf_custom", type: "custom_text" },
      ];
      mockClient.get.mockResolvedValue(fields);

      const result = await handlers.get("freshdesk_list_ticket_fields")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/ticket_fields");
      expect(result.content[0].text).toBe(JSON.stringify(fields, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_ticket_fields")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_contact_fields", () => {
    it("should list all contact fields", async () => {
      const fields = [
        { id: 1, name: "name", type: "default_name" },
        { id: 2, name: "email", type: "default_email" },
      ];
      mockClient.get.mockResolvedValue(fields);

      const result = await handlers.get("freshdesk_list_contact_fields")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/contact_fields");
      expect(result.content[0].text).toBe(JSON.stringify(fields, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_contact_fields")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_company_fields", () => {
    it("should list all company fields", async () => {
      const fields = [
        { id: 1, name: "name", type: "default_name" },
        { id: 2, name: "cf_account_type", type: "custom_dropdown" },
      ];
      mockClient.get.mockResolvedValue(fields);

      const result = await handlers.get("freshdesk_list_company_fields")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/company_fields");
      expect(result.content[0].text).toBe(JSON.stringify(fields, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_company_fields")!({});

      expect(result.isError).toBe(true);
    });
  });
});
