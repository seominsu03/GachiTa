export type UserProfile = {
  userId: number;
  username: string;
  nickname: string;
  name?: string | null;
  phoneNumber?: string | null;
};

export type LoginRequest = { username: string; password: string };
export type SignupRequest = LoginRequest & { nickname: string; name?: string; phoneNumber?: string };
export type CsrfToken = { token: string; headerName: string };
export type ApiSuccess<T> = { success: true; data: T; message: string };
export type ApiFailure = { success: false; error: { code: string; message: string } };
