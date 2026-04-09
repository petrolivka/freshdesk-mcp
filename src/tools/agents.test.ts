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

import { registerAgentTools } from "./agents.js";

describe("Agent Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerAgentTools(server);
  });

  describe("freshdesk_list_agents", () => {
    it("should list agents with defaults", async () => {
      const agents = [{ id: 1, contact: { name: "Agent 1" } }];
      mockClient.get.mockResolvedValue(agents);

      const result = await handlers.get("freshdesk_list_agents")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/agents", {
        page: 1,
        per_page: 30,
      });
      expect(result.content[0].text).toBe(JSON.stringify(agents, null, 2));
    });

    it("should pass optional filters", async () => {
      mockClient.get.mockResolvedValue([]);

      await handlers.get("freshdesk_list_agents")!({
        page: 1,
        per_page: 30,
        email: "agent@example.com",
        mobile: "555-0100",
        phone: "555-0200",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/agents", {
        page: 1,
        per_page: 30,
        email: "agent@example.com",
        mobile: "555-0100",
        phone: "555-0200",
      });
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_agents")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_agent", () => {
    it("should get an agent by ID", async () => {
      const agent = { id: 5, contact: { name: "John" } };
      mockClient.get.mockResolvedValue(agent);

      const result = await handlers.get("freshdesk_get_agent")!({
        agent_id: 5,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/agents/5");
      expect(result.content[0].text).toBe(JSON.stringify(agent, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_agent")!({
        agent_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_current_agent", () => {
    it("should get current agent", async () => {
      const agent = { id: 1, contact: { name: "Me" } };
      mockClient.get.mockResolvedValue(agent);

      const result = await handlers.get("freshdesk_get_current_agent")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/agents/me");
      expect(result.content[0].text).toBe(JSON.stringify(agent, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_get_current_agent")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_groups", () => {
    it("should list groups with pagination", async () => {
      const groups = [{ id: 1, name: "Support" }];
      mockClient.get.mockResolvedValue(groups);

      const result = await handlers.get("freshdesk_list_groups")!({
        page: 1,
        per_page: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/groups", {
        page: 1,
        per_page: 30,
      });
      expect(result.content[0].text).toBe(JSON.stringify(groups, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Error"));

      const result = await handlers.get("freshdesk_list_groups")!({
        page: 1,
        per_page: 30,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_group", () => {
    it("should get a group by ID", async () => {
      const group = { id: 10, name: "Billing" };
      mockClient.get.mockResolvedValue(group);

      const result = await handlers.get("freshdesk_get_group")!({
        group_id: 10,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/groups/10");
      expect(result.content[0].text).toBe(JSON.stringify(group, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_group")!({
        group_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_list_roles", () => {
    it("should list all roles", async () => {
      const roles = [
        { id: 1, name: "Admin" },
        { id: 2, name: "Agent" },
      ];
      mockClient.get.mockResolvedValue(roles);

      const result = await handlers.get("freshdesk_list_roles")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/roles");
      expect(result.content[0].text).toBe(JSON.stringify(roles, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_roles")!({});

      expect(result.isError).toBe(true);
    });
  });
});
