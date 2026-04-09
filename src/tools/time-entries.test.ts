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

import { registerTimeEntryTools } from "./time-entries.js";

describe("Time Entry Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerTimeEntryTools(server);
  });

  describe("freshdesk_create_time_entry", () => {
    it("should create a time entry for a ticket", async () => {
      const entry = { id: 1, ticket_id: 42, time_spent: "01:30", billable: true };
      mockClient.post.mockResolvedValue(entry);

      const result = await handlers.get("freshdesk_create_time_entry")!({
        ticket_id: 42,
        time_spent: "01:30",
        billable: true,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/time_entries", {
        time_spent: "01:30",
        billable: true,
      });
      expect(result.content[0].text).toBe(JSON.stringify(entry, null, 2));
    });

    it("should pass optional fields", async () => {
      mockClient.post.mockResolvedValue({});

      await handlers.get("freshdesk_create_time_entry")!({
        ticket_id: 10,
        time_spent: "00:45",
        billable: false,
        note: "Fixed bug",
        agent_id: 5,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/10/time_entries", {
        time_spent: "00:45",
        billable: false,
        note: "Fixed bug",
        agent_id: 5,
      });
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_create_time_entry")!({
        ticket_id: 42,
        time_spent: "01:00",
        billable: true,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_time_entries", () => {
    it("should list time entries with defaults", async () => {
      const entries = [{ id: 1, time_spent: "02:00" }];
      mockClient.get.mockResolvedValue(entries);

      const result = await handlers.get("freshdesk_list_time_entries")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/time_entries", {
        page: 1,
        per_page: 30,
      });
      expect(result.content[0].text).toBe(JSON.stringify(entries, null, 2));
    });

    it("should pass optional filters", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_time_entries")!({
        page: 1,
        per_page: 30,
        ticket_id: 42,
        company_id: 10,
        agent_id: 5,
        executed_after: "2024-01-01T00:00:00Z",
        executed_before: "2024-12-31T23:59:59Z",
        billable: true,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/time_entries", {
        page: 1,
        per_page: 30,
        ticket_id: 42,
        company_id: 10,
        agent_id: 5,
        executed_after: "2024-01-01T00:00:00Z",
        executed_before: "2024-12-31T23:59:59Z",
        billable: true,
      });
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_time_entries")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_time_entry", () => {
    it("should update a time entry", async () => {
      const updated = { id: 1, time_spent: "03:00", billable: false };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_time_entry")!({
        time_entry_id: 1,
        time_spent: "03:00",
        billable: false,
      });

      expect(mockClient.put).toHaveBeenCalledWith("/time_entries/1", {
        time_spent: "03:00",
        billable: false,
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should update note only", async () => {
      mockClient.put.mockResolvedValue({ id: 1, note: "Updated note" });

      await handlers.get("freshdesk_update_time_entry")!({
        time_entry_id: 1,
        note: "Updated note",
      });

      expect(mockClient.put).toHaveBeenCalledWith("/time_entries/1", {
        note: "Updated note",
      });
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_update_time_entry")!({
        time_entry_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_delete_time_entry", () => {
    it("should delete a time entry", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_delete_time_entry")!({
        time_entry_id: 1,
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/time_entries/1");
      expect(result.content[0].text).toBe(
        "Time entry 1 deleted successfully."
      );
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_delete_time_entry")!({
        time_entry_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_toggle_timer", () => {
    it("should toggle a timer on a time entry", async () => {
      const toggled = { id: 1, timer_running: true };
      mockClient.put.mockResolvedValue(toggled);

      const result = await handlers.get("freshdesk_toggle_timer")!({
        time_entry_id: 1,
      });

      expect(mockClient.put).toHaveBeenCalledWith(
        "/time_entries/1/toggle_timer",
        {}
      );
      expect(result.content[0].text).toBe(JSON.stringify(toggled, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Timer error"));

      const result = await handlers.get("freshdesk_toggle_timer")!({
        time_entry_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });
});
