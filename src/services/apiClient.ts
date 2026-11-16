import { authStorage } from '@/services/authStorage';
import type { ApiFailure, ApiSuccess, CsrfToken } from '@/types/auth';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!value || !/^https?:\/\//.test(value)) {
    throw new ApiError(0, 'API_NOT_CONFIGURED', '서버 연결 주소가 설정되지 않았습니다.');
  }
  return value;
}

async function send<T>(path: string, method: string, body?: unknown, csrf?: CsrfToken): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrf ? { [csrf.headerName]: csrf.token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let result: ApiSuccess<T> | ApiFailure;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(response.status, 'INVALID_RESPONSE', '서버 응답을 확인할 수 없습니다.');
    }
    if (!result || typeof result !== 'object' || !('success' in result)) {
      throw new ApiError(response.status, 'INVALID_RESPONSE', '서버 응답 형식이 올바르지 않습니다.');
    }
    if (!result.success) {
      throw new ApiError(response.status, result.error?.code ?? 'REQUEST_FAILED', result.error?.message ?? '요청에 실패했습니다.');
    }
    if (!response.ok) {
      throw new ApiError(response.status, 'REQUEST_FAILED', '요청에 실패했습니다.');
    }
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
  } finally {
    clearTimeout(timeout);
  }
}

let csrfRequest: Promise<CsrfToken> | null = null;
async function getCsrfToken() {
  const existing = authStorage.getCsrfToken();
  if (existing) return existing;
  csrfRequest ??= send<CsrfToken>('/api/v1/auth/csrf', 'GET');
  try {
    const token = await csrfRequest;
    authStorage.setCsrfToken(token);
    return token;
  } finally {
    csrfRequest = null;
  }
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  const method = options.method ?? 'GET';
  if (method === 'GET') return send<T>(path, method);
  try {
    return await send<T>(path, method, options.body, await getCsrfToken());
  } catch (error) {
    // Retry only a CSRF rejection, which happens before the controller executes.
    if (error instanceof ApiError && error.code === 'CSRF_INVALID') {
      authStorage.clear();
      return send<T>(path, method, options.body, await getCsrfToken());
    }
    throw error;
  }
}
