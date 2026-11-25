export type ApiHealth = {
  ok: boolean;
  service: string;
  upstreamConfigured: boolean;
  schoolId: string | null;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data as T;
}

export const api = {
  health: () => request<ApiHealth>('/api/health'),
  login: (credentials: { username: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  questions: () => request('/api/questions'),
  startExam: (payload: unknown) =>
    request('/api/exam', { method: 'POST', body: JSON.stringify(payload) })
};