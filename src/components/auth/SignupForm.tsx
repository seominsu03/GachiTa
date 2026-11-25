import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View, TextInput } from 'react-native';
import { Link, router } from 'expo-router';
import { Brand, Button, Field, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { signupSteps, validateSignupStep, type SignupStep } from '@/features/auth/signupSteps';
import { validateSignup } from '@/features/auth/validation';

export function SignupForm({ preview = false, onNavigate }: { preview?: boolean; onNavigate?: (screen: string) => void }) {
  const auth = useAuth();
  const [values, setValues] = useState({ username: '', password: '', passwordConfirm: '', name: '', nickname: '', phoneNumber: '' });
  const [shown, setShown] = useState({ password: false, passwordConfirm: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const inputs = useRef<Partial<Record<SignupStep, ComponentRef<typeof TextInput> | null>>>({});

  async function submit() {
    if (submitting.current) return;
    for (const field of signupSteps) {
      const problem = validateSignupStep(field.key, values);
      if (problem) { setError(problem); inputs.current[field.key]?.focus(); return; }
    }
    const input = { password: values.password, username: values.username.trim(), name: values.name.trim(), nickname: values.nickname.trim(), phoneNumber: values.phoneNumber.replace(/-/g, '') };
    const invalid = validateSignup(input, values.passwordConfirm);
    if (invalid) { setError(invalid); return; }
    submitting.current = true; setBusy(true); setError(null);
    try {
      if (preview) { Keyboard.dismiss(); onNavigate?.('login'); return; }
      await auth.signup(input);
      Keyboard.dismiss();
      setValues({ username: '', password: '', passwordConfirm: '', name: '', nickname: '', phoneNumber: '' });
      router.replace({ pathname: ROUTES.login, params: { registered: '1' } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : '회원가입을 처리하지 못했습니다. 다시 시도해 주세요.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  function next(index: number) {
    if (busy) return;
    const problem = validateSignupStep(signupSteps[index].key, values);
    setError(problem);
    if (problem) return;
    if (index === signupSteps.length - 1) void submit();
    else inputs.current[signupSteps[index + 1].key]?.focus();
  }

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen title="회원가입" dismissKeyboardOnDrag onBack={() => { if (!busy) { Keyboard.dismiss(); if (preview) onNavigate?.('login'); else router.replace(ROUTES.login); } }}>
      <Brand />
      <Text style={ui.title}>회원가입</Text>
      <Text style={ui.muted}>아래로 스크롤하며 정보를 입력해 주세요. 키보드의 다음을 누르면 다음 입력칸으로 이동해요.</Text>
      {signupSteps.map((field, index) => {
        const secret = field.key === 'password' || field.key === 'passwordConfirm';
        const visible = secret && shown[field.key as 'password' | 'passwordConfirm'];
        return <View key={field.key} style={{ gap: 5 }}>
          <Field label={field.label} value={values[field.key]} inputRef={node => { inputs.current[field.key] = node; }}
            onChangeText={value => { setValues(previous => ({ ...previous, [field.key]: value })); setError(null); }}
            placeholder={field.placeholder} maxLength={field.maxLength} editable={!busy}
            autoCapitalize="none" autoCorrect={false} secureTextEntry={secret && !visible}
            autoComplete={secret ? 'new-password' : field.key === 'username' ? 'username' : field.key === 'name' ? 'name' : field.key === 'phoneNumber' ? 'tel' : 'off'}
            returnKeyType={index === signupSteps.length - 1 ? 'done' : 'next'} submitBehavior="submit" onSubmitEditing={() => next(index)}
            suffix={secret ? <Pressable accessibilityRole="button" accessibilityLabel={field.label + (visible ? ' 숨기기' : ' 보기')} onPress={() => { const key = field.key as 'password' | 'passwordConfirm'; setShown(previous => ({ ...previous, [key]: !previous[key] })); }} style={{ padding: 10 }}><Text style={ui.blue}>{visible ? '숨기기' : '보기'}</Text></Pressable> : undefined} />
          <Text style={ui.muted}>{field.hint}</Text>
        </View>;
      })}
      {error && <Notice error>{error}</Notice>}
      <Button onPress={() => void submit()} busy={busy}>회원가입 완료</Button>
      <View style={{ paddingVertical: 8 }}>
        {preview ? <Text style={ui.blue} onPress={() => onNavigate?.('login')}>로그인으로 돌아가기</Text> : <Link href={ROUTES.login} replace style={ui.blue}>이미 계정이 있으신가요? 로그인</Link>}
      </View>
    </Screen>
  </KeyboardAvoidingView>;
}
