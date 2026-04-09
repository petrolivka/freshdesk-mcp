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

import { registerCompanyTools } from "./companies.js";

describe("Company Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerCompanyTools(server);
  });

  describe("freshdesk_create_company", () => {
    it("should create a company", async () => {
      const company = { id: 1, name: "Acme Corp" };
      mockClient.post.mockResolvedValue(company);

      const result = await handlers.get("freshdesk_create_company")!({
        name: "Acme Corp",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/companies", {
        name: "Acme Corp",
      });
      expect(result.content[0].text).toBe(JSON.stringify(company, null, 2));
    });

    it("should create a company with all optional fields", async () => {
      const params = {
        name: "Big Co",
        description: "A big company",
        domains: ["bigco.com"],
        health_score: "happy",
        account_tier: "premium",
        renewal_date: "2025-12-31",
        industry: "Tech",
        custom_fields: { cf_size: "large" },
      };
      mockClient.post.mockResolvedValue({ id: 2, ...params });

      const result = await handlers.get("freshdesk_create_company")!(params);

      expect(mockClient.post).toHaveBeenCalledWith("/companies", params);
      expect(result.isError).toBeUndefined();
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Duplicate name"));

      const result = await handlers.get("freshdesk_create_company")!({
        name: "Dup Corp",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_company", () => {
    it("should get a company by ID", async () => {
      const company = { id: 10, name: "Widgets Inc" };
      mockClient.get.mockResolvedValue(company);

      const result = await handlers.get("freshdesk_get_company")!({
        company_id: 10,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/companies/10");
      expect(result.content[0].text).toBe(JSON.stringify(company, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_company")!({
        company_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_companies", () => {
    it("should list companies with pagination", async () => {
      const companies = [{ id: 1 }, { id: 2 }];
      mockClient.get.mockResolvedValue(companies);

      const result = await handlers.get("freshdesk_list_companies")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/companies", {
        page: 1,
        per_page: 30,
      });
      expect(result.content[0].text).toBe(JSON.stringify(companies, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Server error"));

      const result = await handlers.get("freshdesk_list_companies")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_company", () => {
    it("should update a company and strip company_id from body", async () => {
      const updated = { id: 10, name: "New Name" };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_company")!({
        company_id: 10,
        name: "New Name",
        industry: "Finance",
      });

      expect(mockClient.put).toHaveBeenCalledWith("/companies/10", {
        name: "New Name",
        industry: "Finance",
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should not include company_id in update payload", async () => {
      mockClient.put.mockResolvedValue({});

      await handlers.get("freshdesk_update_company")!({
        company_id: 5,
        description: "Updated",
      });

      const putCallData = mockClient.put.mock.calls[0][1];
      expect(putCallData).not.toHaveProperty("company_id");
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_update_company")!({
        company_id: 10,
        name: "",
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_delete_company", () => {
    it("should delete a company and return confirmation", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const result = await handlers.get("freshdesk_delete_company")!({
        company_id: 15,
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/companies/15");
      expect(result.content[0].text).toBe(
        "Company 15 deleted successfully."
      );
    });

    it("should handle errors", async () => {
      mockClient.delete.mockRejectedValue(new Error("Forbidden"));

      const result = await handlers.get("freshdesk_delete_company")!({
        company_id: 15,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_search_companies", () => {
    it("should search companies with quoted query", async () => {
      const results = { results: [{ id: 1 }], total: 1 };
      mockClient.get.mockResolvedValue(results);

      const result = await handlers.get("freshdesk_search_companies")!({
        query: "name:'Acme'",
        page: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/search/companies", {
        query: `"name:'Acme'"`,
        page: 1,
      });
      expect(result.content[0].text).toBe(JSON.stringify(results, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Bad query"));

      const result = await handlers.get("freshdesk_search_companies")!({
        query: "bad",
        page: 1,
      });

      expect(result.isError).toBe(true);
    });
  });
});
