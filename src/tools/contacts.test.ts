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

import { registerContactTools } from "./contacts.js";

describe("Contact Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerContactTools(server);
  });

  describe("freshdesk_create_contact", () => {
    it("should create a contact", async () => {
      const contact = { id: 1, name: "John", email: "john@example.com" };
      mockClient.post.mockResolvedValue(contact);

      const result = await handlers.get("freshdesk_create_contact")!({
        name: "John",
        email: "john@example.com",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/contacts", {
        name: "John",
        email: "john@example.com",
      });
      expect(result.content[0].text).toBe(JSON.stringify(contact, null, 2));
    });

    it("should create a contact with all optional fields", async () => {
      const params = {
        name: "Jane",
        email: "jane@example.com",
        phone: "555-0100",
        mobile: "555-0101",
        address: "123 Main St",
        description: "VIP",
        job_title: "CEO",
        company_id: 10,
        tags: ["vip"],
        custom_fields: { cf_tier: "gold" },
      };
      mockClient.post.mockResolvedValue({ id: 2, ...params });

      const result = await handlers.get("freshdesk_create_contact")!(params);

      expect(mockClient.post).toHaveBeenCalledWith("/contacts", params);
      expect(result.isError).toBeUndefined();
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Conflict"));

      const result = await handlers.get("freshdesk_create_contact")!({
        name: "Dup",
        email: "dup@example.com",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Conflict");
    });
  });

  describe("freshdesk_get_contact", () => {
    it("should get a contact by ID", async () => {
      const contact = { id: 5, name: "Alice" };
      mockClient.get.mockResolvedValue(contact);

      const result = await handlers.get("freshdesk_get_contact")!({
        contact_id: 5,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/contacts/5");
      expect(result.content[0].text).toBe(JSON.stringify(contact, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_contact")!({
        contact_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_contacts", () => {
    it("should list contacts with defaults", async () => {
      const contacts = [{ id: 1 }, { id: 2 }];
      mockClient.get.mockResolvedValue(contacts);

      const result = await handlers.get("freshdesk_list_contacts")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/contacts", {
        page: 1,
        per_page: 30,
      });
      expect(result.content[0].text).toBe(JSON.stringify(contacts, null, 2));
    });

    it("should pass all optional filters", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_contacts")!({
        page: 1,
        per_page: 50,
        email: "filter@example.com",
        phone: "555-0100",
        mobile: "555-0101",
        company_id: 10,
        updated_since: "2024-01-01",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/contacts", {
        page: 1,
        per_page: 50,
        email: "filter@example.com",
        phone: "555-0100",
        mobile: "555-0101",
        company_id: 10,
        updated_since: "2024-01-01",
      });
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Server error"));

      const result = await handlers.get("freshdesk_list_contacts")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_contact", () => {
    it("should update a contact and strip contact_id from body", async () => {
      const updated = { id: 5, name: "Updated Name" };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_contact")!({
        contact_id: 5,
        name: "Updated Name",
        job_title: "CTO",
      });

      expect(mockClient.put).toHaveBeenCalledWith("/contacts/5", {
        name: "Updated Name",
        job_title: "CTO",
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_update_contact")!({
        contact_id: 5,
        email: "invalid",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_delete_contact", () => {
    it("should delete a contact and return confirmation", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_delete_contact")!({
        contact_id: 7,
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/contacts/7");
      expect(result.content[0].text).toBe(
        "Contact 7 deleted successfully."
      );
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Forbidden"));

      const result = await handlers.get("freshdesk_delete_contact")!({
        contact_id: 7,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_search_contacts", () => {
    it("should search contacts with quoted query", async () => {
      const results = { results: [{ id: 1 }], total: 1 };
      mockClient.get.mockResolvedValue(results);

      const result = await handlers.get("freshdesk_search_contacts")!({
        query: "email:'john@example.com'",
        page: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/search/contacts", {
        query: `"email:'john@example.com'"`,
        page: 1,
      });
      expect(result.content[0].text).toBe(JSON.stringify(results, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Bad query"));

      const result = await handlers.get("freshdesk_search_contacts")!({
        query: "bad",
        page: 1,
      });

      expect(result.isError).toBe(true);
    });
  });
});
