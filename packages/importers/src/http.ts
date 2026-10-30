import type { HttpClient } from './types';

export interface HttpOptions {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Client HTTP des imports : délai maximal, reprises avec attente exponentielle sur les erreurs
 * réseau et les réponses 429/5xx (en respectant Retry-After), User-Agent identifiable
 * (exigé par les services publics comme Overpass).
 */
export function createHttpClient(options: HttpOptions = {}): HttpClient {
  const {
    retries = 3,
    timeoutMs = 120_000,
    baseDelayMs = 2_000,
    userAgent = 'WaterFinder-ETL/0.1 (+https://github.com/MustaphaAitHamou/Project_Aman)',
    fetchImpl = fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;

  async function request(url: string, init: RequestInit = {}): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          ...init,
          signal: controller.signal,
          headers: {
            'User-Agent': userAgent,
            Accept: 'application/json, text/csv, */*',
            ...init.headers,
          },
        });
        if (response.ok) return response;
        if (!RETRYABLE.has(response.status) || attempt === retries) {
          throw new HttpError(response.status, url, `HTTP ${response.status} pour ${url}`);
        }
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : baseDelayMs * 2 ** attempt,
        );
      } catch (error) {
        lastError = error;
        if (error instanceof HttpError) throw error;
        if (attempt === retries) break;
        await sleep(baseDelayMs * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error(
      `Échec réseau après ${retries + 1} tentatives pour ${url} : ${String(lastError)}`,
    );
  }

  return {
    async getJson<T>(url: string, init?: RequestInit) {
      return (await (await request(url, init)).json()) as T;
    },
    async getText(url: string, init?: RequestInit) {
      return (await request(url, init)).text();
    },
    async postForm<T>(url: string, form: Record<string, string>) {
      const response = await request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(form).toString(),
      });
      return (await response.json()) as T;
    },
  };
}
