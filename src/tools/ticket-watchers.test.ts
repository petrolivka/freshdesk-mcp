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

import { registerTicketWatcherTools } from "./ticket-watchers.js";

describe("Ticket Watcher Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerTicketWatcherTools(server);
  });

  describe("freshdesk_list_ticket_watchers", () => {
    it("should list watchers for a ticket", async () => {
      const watchers = [
        { id: 1, user_id: 100, name: "Agent A" },
        { id: 2, user_id: 101, name: "Agent B" },
      ];
      mockClient.get.mockResolvedValue(watchers);

      const result = await handlers.get("freshdesk_list_ticket_watchers")!({
        ticket_id: 42,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tickets/42/watchers");
      expect(result.content[0].text).toBe(JSON.stringify(watchers, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_list_ticket_watchers")!({
        ticket_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_add_ticket_watcher", () => {
    it("should add a watcher to a ticket", async () => {
      const watcher = { id: 3, user_id: 102 };
      mockClient.post.mockResolvedValue(watcher);

      const result = await handlers.get("freshdesk_add_ticket_watcher")!({
        ticket_id: 42,
        user_id: 102,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/watchers", {
        user_id: 102,
      });
      expect(result.content[0].text).toBe(JSON.stringify(watcher, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Conflict"));

      const result = await handlers.get("freshdesk_add_ticket_watcher")!({
        ticket_id: 42,
        user_id: 102,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_remove_ticket_watcher", () => {
    it("should remove a watcher from a ticket", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_remove_ticket_watcher")!({
        ticket_id: 42,
        watcher_id: 3,
      });

      expect(mockClient.delete).toHaveBeenCalledWith(
        "/tickets/42/watchers/3"
      );
      expect(result.content[0].text).toBe(
        "Watcher 3 removed from ticket 42 successfully."
      );
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_remove_ticket_watcher")!({
        ticket_id: 42,
        watcher_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });
});
