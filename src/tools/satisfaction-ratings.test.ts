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

import { registerSatisfactionRatingTools } from "./satisfaction-ratings.js";

describe("Satisfaction Rating & SLA Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerSatisfactionRatingTools(server);
  });

  describe("freshdesk_list_satisfaction_ratings", () => {
    it("should list satisfaction ratings with pagination", async () => {
      const ratings = [
        { id: 1, rating: 5, ticket_id: 42 },
        { id: 2, rating: 3, ticket_id: 43 },
      ];
      mockClient.get.mockResolvedValue(ratings);

      const result = await handlers.get("freshdesk_list_satisfaction_ratings")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/surveys/satisfaction_ratings",
        { page: 1, per_page: 30 }
      );
      expect(result.content[0].text).toBe(JSON.stringify(ratings, null, 2));
    });

    it("should support custom pagination", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_satisfaction_ratings")!({
        page: 3,
        per_page: 50,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/surveys/satisfaction_ratings",
        { page: 3, per_page: 50 }
      );
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_satisfaction_ratings")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_ticket_satisfaction_ratings", () => {
    it("should get ratings for a specific ticket", async () => {
      const ratings = [{ id: 1, rating: 5, feedback: "Great support!" }];
      mockClient.get.mockResolvedValue(ratings);

      const result = await handlers.get("freshdesk_get_ticket_satisfaction_ratings")!({
        ticket_id: 42,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/tickets/42/satisfaction_ratings"
      );
      expect(result.content[0].text).toBe(JSON.stringify(ratings, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_ticket_satisfaction_ratings")!({
        ticket_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_sla_policies", () => {
    it("should list all SLA policies", async () => {
      const policies = [
        { id: 1, name: "Default SLA", is_default: true },
        { id: 2, name: "Premium SLA", is_default: false },
      ];
      mockClient.get.mockResolvedValue(policies);

      const result = await handlers.get("freshdesk_list_sla_policies")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/sla_policies");
      expect(result.content[0].text).toBe(JSON.stringify(policies, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_sla_policies")!({});

      expect(result.isError).toBe(true);
    });
  });
});
