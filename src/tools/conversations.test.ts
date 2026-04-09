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

import { registerConversationTools } from "./conversations.js";

describe("Conversation Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerConversationTools(server);
  });

  describe("freshdesk_reply_to_ticket", () => {
    it("should send a reply to a ticket", async () => {
      const reply = { id: 100, body: "<p>Thanks</p>" };
      mockClient.post.mockResolvedValue(reply);

      const result = await handlers.get("freshdesk_reply_to_ticket")!({
        ticket_id: 42,
        body: "<p>Thanks</p>",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/reply", {
        body: "<p>Thanks</p>",
      });
      expect(result.content[0].text).toBe(JSON.stringify(reply, null, 2));
    });

    it("should pass cc and bcc emails", async () => {
      mockClient.post.mockResolvedValue({ id: 101 });

      await handlers.get("freshdesk_reply_to_ticket")!({
        ticket_id: 42,
        body: "Reply",
        cc_emails: ["cc@example.com"],
        bcc_emails: ["bcc@example.com"],
        from_email: "support@example.com",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/reply", {
        body: "Reply",
        cc_emails: ["cc@example.com"],
        bcc_emails: ["bcc@example.com"],
        from_email: "support@example.com",
      });
    });

    it("should not include ticket_id in body", async () => {
      mockClient.post.mockResolvedValue({});

      await handlers.get("freshdesk_reply_to_ticket")!({
        ticket_id: 42,
        body: "Reply",
      });

      const postData = mockClient.post.mock.calls[0][1];
      expect(postData).not.toHaveProperty("ticket_id");
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Ticket not found"));

      const result = await handlers.get("freshdesk_reply_to_ticket")!({
        ticket_id: 999,
        body: "Reply",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_add_note", () => {
    it("should add a private note by default", async () => {
      const note = { id: 200, body: "Internal note", private: true };
      mockClient.post.mockResolvedValue(note);

      const result = await handlers.get("freshdesk_add_note")!({
        ticket_id: 42,
        body: "Internal note",
        private: true,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/notes", {
        body: "Internal note",
        private: true,
      });
      expect(result.content[0].text).toBe(JSON.stringify(note, null, 2));
    });

    it("should add a public note", async () => {
      mockClient.post.mockResolvedValue({ id: 201 });

      await handlers.get("freshdesk_add_note")!({
        ticket_id: 42,
        body: "Public note",
        private: false,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/tickets/42/notes", {
        body: "Public note",
        private: false,
      });
    });

    it("should pass notify_emails", async () => {
      mockClient.post.mockResolvedValue({ id: 202 });

      await handlers.get("freshdesk_add_note")!({
        ticket_id: 42,
        body: "Note",
        private: true,
        notify_emails: ["manager@example.com"],
      });

      const postData = mockClient.post.mock.calls[0][1];
      expect(postData.notify_emails).toEqual(["manager@example.com"]);
    });

    it("should not include ticket_id in body", async () => {
      mockClient.post.mockResolvedValue({});

      await handlers.get("freshdesk_add_note")!({
        ticket_id: 42,
        body: "Note",
        private: true,
      });

      const postData = mockClient.post.mock.calls[0][1];
      expect(postData).not.toHaveProperty("ticket_id");
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Forbidden"));

      const result = await handlers.get("freshdesk_add_note")!({
        ticket_id: 42,
        body: "Note",
        private: true,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_conversations", () => {
    it("should list conversations for a ticket", async () => {
      const conversations = [
        { id: 1, body: "Reply 1" },
        { id: 2, body: "Note 1" },
      ];
      mockClient.get.mockResolvedValue(conversations);

      const result = await handlers.get("freshdesk_list_conversations")!({
        ticket_id: 42,
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/tickets/42/conversations",
        { page: 1, per_page: 30 }
      );
      expect(result.content[0].text).toBe(
        JSON.stringify(conversations, null, 2)
      );
    });

    it("should handle pagination", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_conversations")!({
        ticket_id: 42,
        page: 3,
        per_page: 100,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/tickets/42/conversations",
        { page: 3, per_page: 100 }
      );
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_list_conversations")!({
        ticket_id: 999,
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_conversation", () => {
    it("should update a conversation body", async () => {
      const updated = { id: 100, body: "<p>Updated</p>" };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_conversation")!({
        conversation_id: 100,
        body: "<p>Updated</p>",
      });

      expect(mockClient.put).toHaveBeenCalledWith("/conversations/100", {
        body: "<p>Updated</p>",
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_update_conversation")!({
        conversation_id: 999,
        body: "Updated",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_delete_conversation", () => {
    it("should delete a conversation and return confirmation", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_delete_conversation")!({
        conversation_id: 100,
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/conversations/100");
      expect(result.content[0].text).toBe(
        "Conversation 100 deleted successfully."
      );
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Forbidden"));

      const result = await handlers.get("freshdesk_delete_conversation")!({
        conversation_id: 100,
      });

      expect(result.isError).toBe(true);
    });
  });
});
