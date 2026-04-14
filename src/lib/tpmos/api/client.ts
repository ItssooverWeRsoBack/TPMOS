/**
 * Base API client for TPMOS endpoints.
 * All API calls go through these helpers for consistent error handling.
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json();

  let error: { code: string; message: string; details?: Record<string, unknown> };
  try {
    const body = (await res.json()) as { error?: { code: string; message: string; details?: Record<string, unknown> } };
    error = body.error ?? { code: "UNKNOWN", message: res.statusText };
  } catch {
    error = { code: "UNKNOWN", message: res.statusText };
  }

  throw new ApiError(error.code, error.message, res.status, error.details);
}

const BASE = "/api/tpmos";

export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
