import { FreshdeskClient } from "./freshdesk-client.js";

export const MAX_PER_PAGE = 100;

export async function fetchAllPages<T>(
  client: FreshdeskClient,
  endpoint: string,
  baseQuery: Record<string, unknown> = {},
  options: { perPage?: number; maxPages?: number } = {}
): Promise<T[]> {
  const perPage = options.perPage ?? MAX_PER_PAGE;
  const maxPages = options.maxPages ?? Infinity;
  const all: T[] = [];
  let page = 1;
  while (page <= maxPages) {
    const result = await client.get<T[]>(endpoint, {
      ...baseQuery,
      page,
      per_page: perPage,
    });
    if (!Array.isArray(result) || result.length === 0) break;
    all.push(...result);
    if (result.length < perPage) break;
    page++;
  }
  return all;
}

export async function fetchAllSearchPages<T>(
  client: FreshdeskClient,
  endpoint: string,
  baseQuery: Record<string, unknown> = {},
  options: { maxPages?: number } = {}
): Promise<{ results: T[]; total: number }> {
  const maxPages = options.maxPages ?? 10;
  const all: T[] = [];
  let total = 0;
  let page = 1;
  while (page <= maxPages) {
    const response = await client.get<{ results?: T[]; total?: number }>(
      endpoint,
      { ...baseQuery, page }
    );
    const results = response?.results;
    if (typeof response?.total === "number") total = response.total;
    if (!Array.isArray(results) || results.length === 0) break;
    all.push(...results);
    if (results.length < 30) break;
    page++;
  }
  return { results: all, total };
}
