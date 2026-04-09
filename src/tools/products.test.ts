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

import { registerProductTools } from "./products.js";

describe("Product & Business Hours Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerProductTools(server);
  });

  describe("freshdesk_list_products", () => {
    it("should list all products", async () => {
      const products = [
        { id: 1, name: "Widget Pro" },
        { id: 2, name: "Widget Lite" },
      ];
      mockClient.get.mockResolvedValue(products);

      const result = await handlers.get("freshdesk_list_products")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/products");
      expect(result.content[0].text).toBe(JSON.stringify(products, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_products")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_product", () => {
    it("should get a product by ID", async () => {
      const product = { id: 1, name: "Widget Pro", description: "Premium widget" };
      mockClient.get.mockResolvedValue(product);

      const result = await handlers.get("freshdesk_get_product")!({
        product_id: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/products/1");
      expect(result.content[0].text).toBe(JSON.stringify(product, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_product")!({
        product_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_business_hours", () => {
    it("should list all business hours", async () => {
      const hours = [
        { id: 1, name: "Default", time_zone: "America/New_York" },
        { id: 2, name: "APAC", time_zone: "Asia/Tokyo" },
      ];
      mockClient.get.mockResolvedValue(hours);

      const result = await handlers.get("freshdesk_list_business_hours")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/business_hours");
      expect(result.content[0].text).toBe(JSON.stringify(hours, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_business_hours")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_business_hours", () => {
    it("should get business hours by ID", async () => {
      const hours = {
        id: 1,
        name: "Default",
        time_zone: "America/New_York",
        business_hours: { monday: { start: "09:00", end: "17:00" } },
      };
      mockClient.get.mockResolvedValue(hours);

      const result = await handlers.get("freshdesk_get_business_hours")!({
        business_hours_id: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/business_hours/1");
      expect(result.content[0].text).toBe(JSON.stringify(hours, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_business_hours")!({
        business_hours_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });
});
