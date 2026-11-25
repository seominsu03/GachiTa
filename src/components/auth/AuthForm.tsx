import { useRef, useState } from 'react';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SignupForm } from '@/components/auth/SignupForm';

import { ROUTES } from '@/constants/routes';
import { design as c } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { validateLogin, validateSignup } from '@/features/auth/validation';
import { Brand, Button, Field, Icon, Notice, Screen, ui } from '@/components/ui/DesignSystem';

function LegacyAuthForm({ mode, preview = false, onNavigate }: { mode: 'login' | 'signup'; preview?: boolean; onNavigate?: (screen: string) => void }) {
  const isSignup = mode === 'signup';
  const auth = useAuth();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    const input = { username, nickname, password, name: name.trim(), phoneNumber: phoneNumber.replace(/-/g, '') };
    const validation = isSignup ? validateSignup(input, passwordConfirm) : validateLogin(input);
    setError(validation);
    if (validation) return;
    if (preview) { onNavigate?.(isSignup ? 'login' : 'home'); return; }
    submitting.current = true; setIsSubmitting(true);
    try {
      if (isSignup) {
        await auth.signup(input); setPassword(''); setPasswordConfirm('');
        router.replace({ pathname: ROUTES.login, params: { registered: '1' } });
      } else { await auth.login(input); setPassword(''); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : '요청을 처리하지 못했습니다.'); }
    finally { submitting.current = false; setIsSubmitting(false); }
  }

  const switchAccount = <Text style={[ui.muted, { textAlign: 'center', paddingVertical: 12 }]}>
    {isSignup ? '이미 계정이 있으신가요?  ' : '아직 계정이 없으신가요?  '}
    {preview ? <Text onPress={() => onNavigate?.(isSignup ? 'login' : 'signup')} style={[ui.blue, { fontWeight: '700', textDecorationLine: 'underline' }]}>{isSignup ? '로그인' : '회원가입'}</Text>
      : <Link href={isSignup ? ROUTES.login : ROUTES.signup} replace style={[ui.blue, { fontWeight: '700', textDecorationLine: 'underline' }]}>{isSignup ? '로그인' : '회원가입'}</Link>}
  </Text>;

  return <Screen footer={!isSignup ? <View style={{ paddingBottom: 34 }}>{switchAccount}{__DEV__ && !preview && <Link href="/preview" style={[ui.muted, { textAlign: 'center', padding: 8 }]}>화면 미리보기</Link>}</View> : undefined}>
    <Brand />
    <View style={{ gap: 6, marginTop: 4 }}><Text style={[ui.title, { fontSize: 30 }]}>{isSignup ? '회원가입' : '로그인'}</Text><Text style={ui.muted}>함께 타는 즐거움, 같이타에서 시작해요.</Text></View>
    {!preview && !isSignup && registered === '1' && <Notice>회원가입이 완료되었습니다. 로그인해 주세요.</Notice>}
    {!preview && auth.restoreError && <View style={ui.column}><Notice error>{auth.restoreError}</Notice><Button secondary small onPress={() => void auth.restoreSession()}>연결 다시 확인</Button></View>}
    <View style={{ gap: 16, marginTop: 8 }}>
      {isSignup && <><Field label="이름" value={name} onChangeText={setName} placeholder="이름을 입력해 주세요" maxLength={50} editable={!isSubmitting} autoComplete="name" />
        <Field label="닉네임" value={nickname} onChangeText={setNickname} placeholder="사용할 닉네임을 입력해 주세요" maxLength={20} editable={!isSubmitting} /></>}
      <Field label="아이디" value={username} onChangeText={setUsername} placeholder={isSignup ? '사용할 아이디를 입력해 주세요' : '아이디를 입력해 주세요'} maxLength={20} editable={!isSubmitting} autoCapitalize="none" autoCorrect={false} autoComplete="username" />
      <Field label="비밀번호" value={password} onChangeText={setPassword} placeholder="비밀번호를 입력해 주세요" maxLength={64} editable={!isSubmitting} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={isSignup ? 'new-password' : 'current-password'}
        suffix={<Pressable accessibilityRole="button" accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onPress={() => setVisible(!visible)} style={{ paddingVertical: 10 }}><Icon name={visible ? 'visible' : 'eye'} color={c.faint} size={20} /></Pressable>} />
      {isSignup && <><Field label="비밀번호 확인" value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="비밀번호를 다시 입력해 주세요" maxLength={64} editable={!isSubmitting} secureTextEntry={!confirmVisible} autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
        suffix={<Pressable accessibilityRole="button" accessibilityLabel="확인 비밀번호 표시 전환" onPress={() => setConfirmVisible(!confirmVisible)}><Icon name={confirmVisible ? 'visible' : 'eye'} color={c.faint} size={20} /></Pressable>} />
        <Field label="전화번호" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="010-0000-0000" maxLength={13} editable={!isSubmitting} keyboardType="phone-pad" autoComplete="tel" /></>}
    </View>
    {error && <Notice error>{error}</Notice>}
    <View style={{ marginTop: 8 }}><Button onPress={() => void submit()} busy={isSubmitting}>{isSignup ? '회원가입' : '로그인'}</Button></View>
    {!isSignup && <View style={[ui.row, { justifyContent: 'center', gap: 16, paddingTop: 4 }]}><Text accessibilityState={{ disabled: true }} style={ui.muted}>아이디 찾기</Text><Text style={{ color: c.line }}>|</Text><Text accessibilityState={{ disabled: true }} style={ui.muted}>비밀번호 찾기</Text></View>}
    {isSignup && switchAccount}
  </Screen>;
}

export function AuthForm(props: { mode: 'login' | 'signup'; preview?: boolean; onNavigate?: (screen: string) => void }) {
  return props.mode === 'signup' ? <SignupForm preview={props.preview} onNavigate={props.onNavigate} /> : <LegacyAuthForm {...props} />;
}
