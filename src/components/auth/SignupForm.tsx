import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Brand, Button, Field, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { signupSteps, validateSignupStep } from '@/features/auth/signupSteps';
import { validateSignup } from '@/features/auth/validation';

export function SignupForm({ preview = false, onNavigate }: { preview?: boolean; onNavigate?: (screen: string) => void }) {
  const auth = useAuth();
  const [values, setValues] = useState({ username: '', password: '', passwordConfirm: '', name: '', nickname: '', phoneNumber: '' });
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const current = signupSteps[step];
  const last = step === signupSteps.length - 1;
  const secret = current.key === 'password' || current.key === 'passwordConfirm';

  async function next() {
    if (submitting.current) return;
    const problem = validateSignupStep(current.key, values);
    setError(problem);
    if (problem) return;
    if (!last) { setVisible(false); setStep(step + 1); return; }
    const input = { password: values.password, username: values.username.trim(), name: values.name.trim(), nickname: values.nickname.trim(), phoneNumber: values.phoneNumber.replace(/-/g, '') };
    const invalid = validateSignup(input, values.passwordConfirm);
    if (invalid) { setError(invalid); return; }
    submitting.current = true;
    setBusy(true);
    try {
      if (preview) { onNavigate?.('login'); return; }
      await auth.signup(input);
      Keyboard.dismiss();
      setValues({ username: '', password: '', passwordConfirm: '', name: '', nickname: '', phoneNumber: '' });
      router.replace({ pathname: ROUTES.login, params: { registered: '1' } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : '회원가입을 처리하지 못했습니다. 다시 시도해 주세요.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  function back() {
    if (busy) return;
    setError(null); setVisible(false);
    if (step > 0) setStep(step - 1);
    else if (preview) onNavigate?.('login');
    else router.replace(ROUTES.login);
  }

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen title="회원가입" onBack={back}>
      <Brand />
      <Text style={ui.muted}>{step + 1} / {signupSteps.length} 단계</Text>
      <Text style={ui.title}>{current.label} 입력</Text>
      <Text style={ui.muted}>{current.hint}</Text>
      <Field key={current.key} label={current.label} value={values[current.key]}
        onChangeText={value => { setValues(previous => ({ ...previous, [current.key]: value })); setError(null); }}
        placeholder={current.placeholder} maxLength={current.maxLength} autoFocus editable={!busy}
        autoCapitalize="none" autoCorrect={false} secureTextEntry={secret && !visible}
        autoComplete={secret ? 'new-password' : current.key === 'username' ? 'username' : current.key === 'name' ? 'name' : current.key === 'phoneNumber' ? 'tel' : 'off'}
        returnKeyType={last ? 'done' : 'next'} submitBehavior="submit" onSubmitEditing={() => void next()}
        suffix={secret ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onPress={() => setVisible(previous => !previous)} style={{ padding: 10 }}><Text style={ui.blue}>{visible ? '숨기기' : '보기'}</Text></Pressable> : undefined} />
      {error && <Notice error>{error}</Notice>}
      <Button onPress={() => void next()} busy={busy}>{last ? '회원가입 완료' : '다음'}</Button>
      {step > 0 && <Button secondary disabled={busy} onPress={back}>이전 단계</Button>}
      <View style={{ paddingVertical: 8 }}>
        {preview ? <Text style={ui.blue} onPress={() => onNavigate?.('login')}>로그인으로 돌아가기</Text> : <Link href={ROUTES.login} replace style={ui.blue}>이미 계정이 있으신가요? 로그인</Link>}
      </View>
    </Screen>
  </KeyboardAvoidingView>;
}
