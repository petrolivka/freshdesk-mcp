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

import { registerSolutionTools } from "./solutions.js";

describe("Solution Tools", () => {
  let handlers: Map<string, ToolHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    handlers = captureToolHandlers(server);
    registerSolutionTools(server);
  });

  // --- Categories ---

  describe("freshdesk_list_solution_categories", () => {
    it("should list all solution categories", async () => {
      const categories = [
        { id: 1, name: "General", description: "General articles" },
      ];
      mockClient.get.mockResolvedValue(categories);

      const result = await handlers.get("freshdesk_list_solution_categories")!({});

      expect(mockClient.get).toHaveBeenCalledWith("/solutions/categories");
      expect(result.content[0].text).toBe(JSON.stringify(categories, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Auth failed"));

      const result = await handlers.get("freshdesk_list_solution_categories")!({});

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_solution_category", () => {
    it("should get a solution category by ID", async () => {
      const category = { id: 1, name: "General", description: "General articles" };
      mockClient.get.mockResolvedValue(category);

      const result = await handlers.get("freshdesk_get_solution_category")!({
        category_id: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/solutions/categories/1");
      expect(result.content[0].text).toBe(JSON.stringify(category, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_solution_category")!({
        category_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  // --- Folders ---

  describe("freshdesk_list_solution_folders", () => {
    it("should list folders within a category", async () => {
      const folders = [
        { id: 10, name: "Getting Started", articles_count: 5 },
      ];
      mockClient.get.mockResolvedValue(folders);

      const result = await handlers.get("freshdesk_list_solution_folders")!({
        category_id: 1,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/solutions/categories/1/folders"
      );
      expect(result.content[0].text).toBe(JSON.stringify(folders, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_list_solution_folders")!({
        category_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_solution_folder", () => {
    it("should get a folder by ID", async () => {
      const folder = { id: 10, name: "Getting Started", articles_count: 5 };
      mockClient.get.mockResolvedValue(folder);

      const result = await handlers.get("freshdesk_get_solution_folder")!({
        category_id: 1,
        folder_id: 10,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/solutions/categories/1/folders/10"
      );
      expect(result.content[0].text).toBe(JSON.stringify(folder, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_solution_folder")!({
        category_id: 1,
        folder_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  // --- Articles ---

  describe("freshdesk_list_solution_articles", () => {
    it("should list articles within a folder", async () => {
      const articles = [
        { id: 100, title: "How to get started", status: 2 },
      ];
      mockClient.get.mockResolvedValue(articles);

      const result = await handlers.get("freshdesk_list_solution_articles")!({
        category_id: 1,
        folder_id: 10,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/solutions/categories/1/folders/10/articles"
      );
      expect(result.content[0].text).toBe(JSON.stringify(articles, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_list_solution_articles")!({
        category_id: 1,
        folder_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_get_solution_article", () => {
    it("should get an article by ID", async () => {
      const article = {
        id: 100,
        title: "How to get started",
        description: "<p>Welcome!</p>",
        status: 2,
      };
      mockClient.get.mockResolvedValue(article);

      const result = await handlers.get("freshdesk_get_solution_article")!({
        article_id: 100,
      });

      expect(mockClient.get).toHaveBeenCalledWith("/solutions/articles/100");
      expect(result.content[0].text).toBe(JSON.stringify(article, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.get.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_get_solution_article")!({
        article_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_create_solution_article", () => {
    it("should create an article in a folder", async () => {
      const article = {
        id: 101,
        title: "New Article",
        description: "<p>Content</p>",
        status: 1,
      };
      mockClient.post.mockResolvedValue(article);

      const result = await handlers.get("freshdesk_create_solution_article")!({
        category_id: 1,
        folder_id: 10,
        title: "New Article",
        description: "<p>Content</p>",
        status: 1,
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/solutions/categories/1/folders/10/articles",
        { title: "New Article", description: "<p>Content</p>", status: 1 }
      );
      expect(result.content[0].text).toBe(JSON.stringify(article, null, 2));
    });

    it("should handle errors", async () => {
      mockClient.post.mockRejectedValue(new Error("Bad request"));

      const result = await handlers.get("freshdesk_create_solution_article")!({
        category_id: 1,
        folder_id: 10,
        title: "New Article",
        description: "<p>Content</p>",
        status: 1,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe("freshdesk_update_solution_article", () => {
    it("should update an article", async () => {
      const updated = { id: 100, title: "Updated Title", status: 2 };
      mockClient.put.mockResolvedValue(updated);

      const result = await handlers.get("freshdesk_update_solution_article")!({
        article_id: 100,
        title: "Updated Title",
        status: 2,
      });

      expect(mockClient.put).toHaveBeenCalledWith("/solutions/articles/100", {
        title: "Updated Title",
        status: 2,
      });
      expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
    });

    it("should update description only", async () => {
      mockClient.put.mockResolvedValue({ id: 100 });

      await handlers.get("freshdesk_update_solution_article")!({
        article_id: 100,
        description: "<p>New content</p>",
      });

      expect(mockClient.put).toHaveBeenCalledWith("/solutions/articles/100", {
        description: "<p>New content</p>",
      });
    });

    it("should handle errors", async () => {
      mockClient.put.mockRejectedValue(new Error("Not found"));

      const result = await handlers.get("freshdesk_update_solution_article")!({
        article_id: 999,
      });

      expect(result.isError).toBe(true);
    });
  });
});
