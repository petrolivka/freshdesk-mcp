import axios, { AxiosError, AxiosInstance } from "axios";

export interface FreshdeskConfig {
  domain: string;
  apiKey: string;
}

export class FreshdeskClient {
  private client: AxiosInstance;

  constructor(config: FreshdeskConfig) {
    this.client = axios.create({
      baseURL: `https://${config.domain}.freshdesk.com/api/v2`,
      auth: {
        username: config.apiKey,
        password: "X",
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await this.client.request<T>({
      method,
      url: endpoint,
      data,
      params,
    });
    return response.data;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, params);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, data);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>("PUT", endpoint, data);
  }

  async delete(endpoint: string): Promise<void> {
    await this.request<void>("DELETE", endpoint);
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as
        | { description?: string; errors?: Array<{ message: string }> }
        | undefined;
      const detail =
        data?.description ||
        data?.errors?.map((e) => e.message).join("; ") ||
        "";

      switch (status) {
        case 400:
          return `Error: Bad request. ${detail || "Check your input parameters."}`;
        case 401:
          return "Error: Authentication failed. Check your FRESHDESK_API_KEY.";
        case 403:
          return `Error: Permission denied. ${detail || "You don't have access to this resource."}`;
        case 404:
          return "Error: Resource not found. Check that the ID is correct.";
        case 409:
          return `Error: Conflict. ${detail || "The resource may already exist or be in an incompatible state."}`;
        case 429:
          return "Error: Rate limit exceeded. Wait before making more requests.";
        default:
          return `Error: API returned status ${status}. ${detail}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. Try again.";
    } else if (error.code === "ENOTFOUND") {
      return "Error: Could not connect to Freshdesk. Check your FRESHDESK_DOMAIN.";
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

let clientInstance: FreshdeskClient | null = null;

export function getClient(): FreshdeskClient {
  if (!clientInstance) {
    const domain = process.env.FRESHDESK_DOMAIN;
    const apiKey = process.env.FRESHDESK_API_KEY;

    if (!domain || !apiKey) {
      throw new Error(
        "FRESHDESK_DOMAIN and FRESHDESK_API_KEY environment variables are required"
      );
    }

    clientInstance = new FreshdeskClient({ domain, apiKey });
  }
  return clientInstance;
}
