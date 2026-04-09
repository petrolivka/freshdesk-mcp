import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosError, AxiosHeaders } from "axios";
import {
  FreshdeskClient,
  handleApiError,
  getClient,
} from "./freshdesk-client.js";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(),
    },
  };
});

describe("FreshdeskClient", () => {
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    vi.mocked(axios.create).mockReturnValue({
      request: mockRequest,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create axios instance with correct config", () => {
    new FreshdeskClient({ domain: "mycompany", apiKey: "test-key" });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "https://mycompany.freshdesk.com/api/v2",
      auth: { username: "test-key", password: "X" },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  });

  describe("request methods", () => {
    let client: FreshdeskClient;

    beforeEach(() => {
      client = new FreshdeskClient({ domain: "test", apiKey: "key" });
    });

    it("get() should call request with GET method", async () => {
      mockRequest.mockResolvedValue({ data: { id: 1 } });

      const result = await client.get("/tickets", { page: 1 });

      expect(mockRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/tickets",
        data: undefined,
        params: { page: 1 },
      });
      expect(result).toEqual({ id: 1 });
    });

    it("post() should call request with POST method and data", async () => {
      mockRequest.mockResolvedValue({ data: { id: 2 } });

      const result = await client.post("/tickets", { subject: "Test" });

      expect(mockRequest).toHaveBeenCalledWith({
        method: "POST",
        url: "/tickets",
        data: { subject: "Test" },
        params: undefined,
      });
      expect(result).toEqual({ id: 2 });
    });

    it("put() should call request with PUT method and data", async () => {
      mockRequest.mockResolvedValue({ data: { id: 3 } });

      const result = await client.put("/tickets/3", { status: 4 });

      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        url: "/tickets/3",
        data: { status: 4 },
        params: undefined,
      });
      expect(result).toEqual({ id: 3 });
    });

    it("delete() should call request with DELETE method", async () => {
      mockRequest.mockResolvedValue({ data: undefined });

      await client.delete("/tickets/5");

      expect(mockRequest).toHaveBeenCalledWith({
        method: "DELETE",
        url: "/tickets/5",
        data: undefined,
        params: undefined,
      });
    });

    it("get() without params should pass undefined", async () => {
      mockRequest.mockResolvedValue({ data: [] });

      await client.get("/roles");

      expect(mockRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/roles",
        data: undefined,
        params: undefined,
      });
    });
  });
});

describe("handleApiError", () => {
  function makeAxiosError(
    status: number,
    data?: unknown,
    code?: string
  ): AxiosError {
    const error = new AxiosError("Request failed", code);
    if (status > 0) {
      error.response = {
        status,
        data,
        statusText: "Error",
        headers: {},
        config: { headers: new AxiosHeaders() },
      };
    }
    return error;
  }

  it("should handle 400 with detail", () => {
    const error = makeAxiosError(400, { description: "Invalid field" });
    expect(handleApiError(error)).toBe("Error: Bad request. Invalid field");
  });

  it("should handle 400 without detail", () => {
    const error = makeAxiosError(400, {});
    expect(handleApiError(error)).toBe(
      "Error: Bad request. Check your input parameters."
    );
  });

  it("should handle 400 with errors array", () => {
    const error = makeAxiosError(400, {
      errors: [{ message: "field1 invalid" }, { message: "field2 missing" }],
    });
    expect(handleApiError(error)).toBe(
      "Error: Bad request. field1 invalid; field2 missing"
    );
  });

  it("should handle 401", () => {
    const error = makeAxiosError(401);
    expect(handleApiError(error)).toBe(
      "Error: Authentication failed. Check your FRESHDESK_API_KEY."
    );
  });

  it("should handle 403 with detail", () => {
    const error = makeAxiosError(403, { description: "Forbidden resource" });
    expect(handleApiError(error)).toBe(
      "Error: Permission denied. Forbidden resource"
    );
  });

  it("should handle 403 without detail", () => {
    const error = makeAxiosError(403, {});
    expect(handleApiError(error)).toBe(
      "Error: Permission denied. You don't have access to this resource."
    );
  });

  it("should handle 404", () => {
    const error = makeAxiosError(404);
    expect(handleApiError(error)).toBe(
      "Error: Resource not found. Check that the ID is correct."
    );
  });

  it("should handle 409 with detail", () => {
    const error = makeAxiosError(409, { description: "Duplicate entry" });
    expect(handleApiError(error)).toBe("Error: Conflict. Duplicate entry");
  });

  it("should handle 409 without detail", () => {
    const error = makeAxiosError(409, {});
    expect(handleApiError(error)).toBe(
      "Error: Conflict. The resource may already exist or be in an incompatible state."
    );
  });

  it("should handle 429", () => {
    const error = makeAxiosError(429);
    expect(handleApiError(error)).toBe(
      "Error: Rate limit exceeded. Wait before making more requests."
    );
  });

  it("should handle unknown status codes", () => {
    const error = makeAxiosError(500, { description: "Internal error" });
    expect(handleApiError(error)).toBe(
      "Error: API returned status 500. Internal error"
    );
  });

  it("should handle ECONNABORTED (timeout)", () => {
    const error = new AxiosError("timeout", "ECONNABORTED");
    expect(handleApiError(error)).toBe("Error: Request timed out. Try again.");
  });

  it("should handle ENOTFOUND (DNS)", () => {
    const error = new AxiosError("not found", "ENOTFOUND");
    expect(handleApiError(error)).toBe(
      "Error: Could not connect to Freshdesk. Check your FRESHDESK_DOMAIN."
    );
  });

  it("should handle generic Error", () => {
    const error = new Error("Something broke");
    expect(handleApiError(error)).toBe("Error: Something broke");
  });

  it("should handle non-Error values", () => {
    expect(handleApiError("string error")).toBe("Error: string error");
    expect(handleApiError(42)).toBe("Error: 42");
  });
});

describe("getClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Reset the module-level singleton by re-importing
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw if FRESHDESK_DOMAIN is missing", async () => {
    delete process.env.FRESHDESK_DOMAIN;
    process.env.FRESHDESK_API_KEY = "key";

    const { getClient: freshGetClient } = await import(
      "./freshdesk-client.js"
    );
    expect(() => freshGetClient()).toThrow(
      "FRESHDESK_DOMAIN and FRESHDESK_API_KEY environment variables are required"
    );
  });

  it("should throw if FRESHDESK_API_KEY is missing", async () => {
    process.env.FRESHDESK_DOMAIN = "test";
    delete process.env.FRESHDESK_API_KEY;

    const { getClient: freshGetClient } = await import(
      "./freshdesk-client.js"
    );
    expect(() => freshGetClient()).toThrow(
      "FRESHDESK_DOMAIN and FRESHDESK_API_KEY environment variables are required"
    );
  });

  it("should return a FreshdeskClient when env vars are set", async () => {
    process.env.FRESHDESK_DOMAIN = "test";
    process.env.FRESHDESK_API_KEY = "key";

    const { getClient: freshGetClient, FreshdeskClient: FC } = await import(
      "./freshdesk-client.js"
    );
    const client = freshGetClient();
    expect(client).toBeInstanceOf(FC);
  });

  it("should return the same instance on subsequent calls (singleton)", async () => {
    process.env.FRESHDESK_DOMAIN = "test";
    process.env.FRESHDESK_API_KEY = "key";

    const { getClient: freshGetClient } = await import(
      "./freshdesk-client.js"
    );
    const client1 = freshGetClient();
    const client2 = freshGetClient();
    expect(client1).toBe(client2);
  });
});
