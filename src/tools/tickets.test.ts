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

import { registerTicketTools } from "./tickets.js";

describe("Ticket Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerTicketTools(server);
  });

  describe("freshdesk_create_ticket", () => {
    it("should create a ticket and return result", async () => {
      const ticket = { id: 1, subject: "Test", status: 2 };
      mockClient.post.mockResolvedValue(ticket);

      const result = await handlers.get("freshdesk_create_ticket")!({
        subject: "Test",
        description: "<p>Hello</p>",
        email: "user@example.com",
        priority: 1,
        status: 2,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets", {
        subject: "Test",
        description: "<p>Hello</p>",
        email: "user@example.com",
        priority: 1,
        status: 2,
      });
      expect(result.content[0].text).toBe(JSON.stringify(ticket, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it("should return error on API failure", async () => {
      mockClient.post.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_create_ticket")!({
        subject: "Test",
        description: "desc",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Bad request");
    });
  });

  describe("freshdesk_get_ticket", () => {
    it("should get a ticket by ID", async () => {
      const ticket = { id: 42, subject: "Issue" };
      mockClient.get.mockResolvedValue(ticket);

      const result = await handlers.get("freshdesk_get_ticket")!({
        ticket_id: 42,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tickets/42", {});
      expect(result.content[0].text).toBe(JSON.stringify(ticket, null, 2));
    });

    it("should pass include parameter", async () => {
      mockClient.get.mockResolvedValue({ id: 1 });

      await handlers.get("freshdesk_get_ticket")!({
        ticket_id: 1,
        include: "conversations,requester",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tickets/1", {
        include: "conversations,requester",
      });
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_ticket")!({
        ticket_id: 999,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Not found");
    });
  });

  describe("freshdesk_list_tickets", () => {
    it("should list tickets with default params", async () => {
      const tickets = [{ id: 1 }, { id: 2 }];
      mockClient.get.mockResolvedValue(tickets);

      const result = await handlers.get("freshdesk_list_tickets")!({
        page: 1,
        per_page: 30,
        order_by: "created_at",
        order_type: "desc",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tickets", {
        page: 1,
        per_page: 30,
        order_by: "created_at",
        order_type: "desc",
      });
      expect(result.content[0].text).toBe(JSON.stringify(tickets, null, 2));
    });

    it("should pass all optional filters", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_tickets")!({
        page: 2,
        per_page: 50,
        order_by: "updated_at",
        order_type: "asc",
        filter: "new_and_my_open",
        requester_id: 100,
        email: "test@example.com",
        company_id: 200,
        updated_since: "2024-01-01T00:00:00Z",
        include: "stats",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tickets", {
        page: 2,
        per_page: 50,
        order_by: "updated_at",
        order_type: "asc",
        filter: "new_and_my_open",
        requester_id: 100,
        email: "test@example.com",
        company_id: 200,
        updated_since: "2024-01-01T00:00:00Z",
        include: "stats",
      });
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Timeout"));

      const result = await handlers.get("freshdesk_list_tickets")!({
        page: 1,
        per_page: 30,
        order_by: "created_at",
        order_type: "desc",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_ticket", () => {
    it("should update a ticket with provided fields", async () => {
      const updated = { id: 10, status: 4 };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_ticket")!({
        ticket_id: 10,
        status: 4,
        priority: 3,
      });

      expect(mockClient.put).toHaveBeenCalledWith("/tickets/10", {
        status: 4,
        priority: 3,
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should not include ticket_id in update data", async () => {
      mockClient.put.mockResolvedValue({});

      await handlers.get("freshdesk_update_ticket")!({
        ticket_id: 5,
        subject: "Updated",
      });

      const putCallData = mockClient.put.mock.calls[0][1];
      expect(putCallData).not.toHaveProperty("ticket_id");
      expect(putCallData).toEqual({ subject: "Updated" });
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Forbidden"));

      const result = await handlers.get("freshdesk_update_ticket")!({
        ticket_id: 10,
        status: 5,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_delete_ticket", () => {
    it("should delete a ticket and return confirmation", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_delete_ticket")!({
        ticket_id: 42,
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/tickets/42");
      expect(result.content[0].text).toBe(
        "Ticket 42 deleted successfully."
      );
      expect(result.isError).toBeUndefined();
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_delete_ticket")!({
        ticket_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_search_tickets", () => {
    it("should search tickets with quoted query", async () => {
      const results = { results: [{ id: 1 }], total: 1 };
      mockClient.get.mockResolvedValue(results);

      const result = await handlers.get("freshdesk_search_tickets")!({
        query: "priority:3 AND status:2",
        page: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/search/tickets", {
        query: '"priority:3 AND status:2"',
        page: 1,
      });
      expect(result.content[0].text).toBe(JSON.stringify(results, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Invalid query"));

      const result = await handlers.get("freshdesk_search_tickets")!({
        query: "bad query",
        page: 1,
      });

      expect(result.isError).toBe(true);
    });
  });
});
