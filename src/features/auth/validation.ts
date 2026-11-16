import type { LoginRequest, SignupRequest } from '@/types/auth';

export function validateLogin(input: LoginRequest): string | null {
  if (!input.username.trim()) return '아이디를 입력해 주세요.';
  if (!input.password) return '비밀번호를 입력해 주세요.';
  return null;
}

export function validateSignup(input: SignupRequest, passwordConfirm: string): string | null {
  if (input.name !== undefined && (input.name.trim().length < 2 || input.name.trim().length > 50)) return '이름은 2~50자로 입력해 주세요.';
  if (input.phoneNumber !== undefined && !/^01[016789]\d{7,8}$/.test(input.phoneNumber.replace(/-/g, ''))) return '휴대폰 번호를 확인해 주세요.';
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(input.username.trim())) {
    return '아이디는 영문, 숫자, 밑줄 4~20자로 입력해 주세요.';
  }
  if (input.nickname.trim().length < 2 || input.nickname.trim().length > 20) {
    return '닉네임은 2~20자로 입력해 주세요.';
  }
  if (!/^[\x21-\x7E]{8,64}$/.test(input.password)) {
    return '비밀번호는 공백 없는 영문, 숫자, 기호 8~64자로 입력해 주세요.';
  }
  if (input.password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
  return null;
}
