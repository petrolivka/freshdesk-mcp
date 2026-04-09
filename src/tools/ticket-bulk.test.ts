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

import { registerTicketBulkTools } from "./ticket-bulk.js";

describe("Ticket Bulk Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerTicketBulkTools(server);
  });

  describe("freshdesk_bulk_update_tickets", () => {
    it("should bulk update tickets with status", async () => {
      const response = { job_id: "abc123" };
      mockClient.put.mockResolvedValue(response);

      const result = await handlers.get("freshdesk_bulk_update_tickets")!({
        ids: [1, 2, 3],
        status: 4,
      });

      expect(mockClient.put).toHaveBeenCalledWith("/tickets/bulk_update", {
        ids: [1, 2, 3],
        properties: { status: 4 },
      });
      expect(result.content[0].text).toBe(JSON.stringify(response, null, 2));
    });

    it("should bulk update with multiple properties", async () => {
      mockClient.put.mockResolvedValue({ job_id: "def456" });

      await handlers.get("freshdesk_bulk_update_tickets")!({
        ids: [10, 20],
        priority: 3,
        group_id: 5,
        responder_id: 100,
        tags: ["urgent"],
      });

      expect(mockClient.put).toHaveBeenCalledWith("/tickets/bulk_update", {
        ids: [10, 20],
        properties: {
          priority: 3,
          group_id: 5,
          responder_id: 100,
          tags: ["urgent"],
        },
      });
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_bulk_update_tickets")!({
        ids: [1],
        status: 4,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_merge_tickets", () => {
    it("should merge source tickets into target", async () => {
      const response = { message: "Tickets merged successfully" };
      mockClient.post.mockResolvedValue(response);

      const result = await handlers.get("freshdesk_merge_tickets")!({
        target_ticket_id: 1,
        source_ticket_ids: [2, 3, 4],
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/merge", {
        primary_ticket_id: 1,
        ticket_ids: [2, 3, 4],
      });
      expect(result.content[0].text).toBe(JSON.stringify(response, null, 2));
    });

    it("should merge a single ticket", async () => {
      mockClient.post.mockResolvedValue({});

      await handlers.get("freshdesk_merge_tickets")!({
        target_ticket_id: 10,
        source_ticket_ids: [20],
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/merge", {
        primary_ticket_id: 10,
        ticket_ids: [20],
      });
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Cannot merge"));

      const result = await handlers.get("freshdesk_merge_tickets")!({
        target_ticket_id: 1,
        source_ticket_ids: [2],
      });

      expect(result.isError).toBe(true);
    });
  });
});
