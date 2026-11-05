/**
 * Thin API client.
 *
 * Every network call in the app goes through here, so error handling and the
 * session cookie behave consistently.
 */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    let message = 'Something went wrong.';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      /* keep the default message */
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async <T,>(path: string, file: File): Promise<T> => {
    const form = new FormData();
    form.append('file', file);
    return request<T>(path, { method: 'POST', body: form });
  },
};

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  createdAt: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: 'admin' | 'staff';
}

export interface FlyerRecord {
  id: string;
  name: string;
  templateId: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
