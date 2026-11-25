import type { SignupRequest } from '@/types/auth';

export const signupSteps = [
  { key: 'username', label: '아이디', hint: '영문, 숫자, 밑줄 4~20자로 입력해 주세요.', placeholder: '사용할 아이디', maxLength: 20 },
  { key: 'password', label: '비밀번호', hint: '공백 없는 영문, 숫자, 기호 8~64자로 입력해 주세요.', placeholder: '사용할 비밀번호', maxLength: 64 },
  { key: 'passwordConfirm', label: '비밀번호 확인', hint: '앞에서 입력한 비밀번호를 다시 입력해 주세요.', placeholder: '비밀번호 다시 입력', maxLength: 64 },
  { key: 'name', label: '이름', hint: '이름을 2~50자로 입력해 주세요.', placeholder: '이름', maxLength: 50 },
  { key: 'nickname', label: '닉네임', hint: '앱에서 사용할 닉네임을 2~20자로 입력해 주세요.', placeholder: '닉네임', maxLength: 20 },
  { key: 'phoneNumber', label: '전화번호', hint: '휴대폰 번호를 입력한 뒤 완료를 눌러 주세요.', placeholder: '010-0000-0000', maxLength: 13 },
] as const;

export type SignupStep = typeof signupSteps[number]['key'];
export function validateSignupStep(key: SignupStep, values: SignupRequest & { passwordConfirm: string }): string | null {
  switch (key) {
    case 'username': return /^[a-zA-Z0-9_]{4,20}$/.test(values.username.trim()) ? null : signupSteps[0].hint;
    case 'password': return /^[\x21-\x7E]{8,64}$/.test(values.password) ? null : signupSteps[1].hint;
    case 'passwordConfirm': return values.password === values.passwordConfirm && !!values.passwordConfirm ? null : '비밀번호가 일치하지 않습니다.';
    case 'name': return values.name && values.name.trim().length >= 2 && values.name.trim().length <= 50 ? null : signupSteps[3].hint;
    case 'nickname': return values.nickname.trim().length >= 2 && values.nickname.trim().length <= 20 ? null : signupSteps[4].hint;
    case 'phoneNumber': return /^01[016789]\d{7,8}$/.test((values.phoneNumber ?? '').replace(/-/g, '')) ? null : '휴대폰 번호를 확인해 주세요.';
  }
}
