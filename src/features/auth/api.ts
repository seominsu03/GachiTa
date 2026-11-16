import { apiRequest } from '@/services/apiClient';
import { authStorage } from '@/services/authStorage';
import type { LoginRequest, SignupRequest, UserProfile } from '@/types/auth';

export function signup(input: SignupRequest) {
  return apiRequest<UserProfile>('/api/v1/auth/signup', {
    method: 'POST',
    body: { ...input, username: input.username.trim(), nickname: input.nickname.trim() },
  });
}

export async function login(input: LoginRequest) {
  const user = await apiRequest<UserProfile>('/api/v1/auth/login', {
    method: 'POST', body: { ...input, username: input.username.trim() },
  });
  authStorage.clear();
  return user;
}

export async function logout() {
  await apiRequest<null>('/api/v1/auth/logout', { method: 'POST' });
  authStorage.clear();
}

export function getMyProfile() {
  return apiRequest<UserProfile>('/api/v1/users/me');
}
