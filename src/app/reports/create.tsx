import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Field, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { BottomNavigation } from '@/components/rooms/RoomScreens';
import { navigateRoom } from '@/components/rooms/RoomRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendProfile, searchFriends } from '@/features/friends/api';
import { submitUserReport } from '@/features/reports/api';
import type { FriendCandidate } from '@/types/friend';
import { reportReasons, type ReportReason } from '@/types/report';

export default function CreateReportScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const initialId = Number(userId);
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendCandidate[] | null>(null);
  const [target, setTarget] = useState<FriendCandidate | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!Number.isSafeInteger(initialId) || initialId <= 0 || initialId === user?.userId) return;
    let active = true;
    void getFriendProfile(initialId).then(profile => { if (active) setTarget(profile); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : '사용자를 불러오지 못했어요.'); });
    return () => { active = false; };
  }, [initialId, user?.userId]);
  async function search() {
    const value = query.trim();
    if (value.length < 2) { setError('아이디를 2자 이상 입력해 주세요.'); return; }
    setSearching(true); setError(null);
    try { setResults(await searchFriends(value)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '사용자를 검색하지 못했어요.'); }
    finally { setSearching(false); }
  }
  async function submit() {
    if (busy) return;
    if (!target || !reason || description.trim().length < 10) { setError('신고 대상과 사유를 고르고 내용을 10자 이상 적어 주세요.'); return; }
    setBusy(true); setError(null);
    try {
      const report = await submitUserReport(target.userId, reason, description.trim());
      router.replace({ pathname: '/reports/complete', params: { reportId: String(report.reportId) } });
    } catch (failure) { setError(failure instanceof Error ? failure.message : '신고를 접수하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Screen title="사용자 신고" onBack={() => router.replace('/reports')}
    tabs={<BottomNavigation active="mypage" navigate={navigateRoom} />}>
    <Notice>실제로 겪은 상황을 적어 주세요. 신고 내용은 다른 사용자에게 표시되지 않습니다.</Notice>
    <Text style={ui.heading}>신고 대상</Text>
    {target ? <Card><View style={ui.between}><View><Text style={ui.bold}>{target.nickname}</Text><Text style={ui.muted}>@{target.username}</Text></View>
      <Button secondary small onPress={() => setTarget(null)}>변경</Button></View></Card> : <>
      <Field label="아이디 검색" icon="search" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false}
        maxLength={20} placeholder="신고할 사용자 아이디" onSubmitEditing={() => void search()} />
      <Button secondary busy={searching} onPress={() => void search()}>사용자 검색</Button>
      {results && (results.length ? results.map(candidate => <Card key={candidate.userId}><View style={ui.between}>
        <View style={{ flex: 1 }}><Text style={ui.bold}>{candidate.nickname}</Text><Text style={ui.muted}>@{candidate.username}</Text></View>
        <Button secondary small onPress={() => { setTarget(candidate); setResults(null); }}>선택</Button></View></Card>) : <Notice>검색된 사용자가 없어요.</Notice>)}
    </>}
    <Text style={ui.heading}>신고 사유</Text>
    {reportReasons.map(item => <Button key={item.value} secondary={reason !== item.value} small onPress={() => setReason(item.value)}>{item.label}</Button>)}
    <Text style={ui.heading}>상황 설명</Text>
    <TextInput accessibilityLabel="신고 내용" multiline maxLength={1000} value={description} onChangeText={setDescription}
      placeholder="언제 어떤 일이 있었는지 10자 이상 적어 주세요" style={[ui.field, { minHeight: 150, textAlignVertical: 'top', padding: 14 }]} />
    <Notice>{description.length}/1000자</Notice>
    {error && <Notice error>{error}</Notice>}
    <Button busy={busy} onPress={() => void submit()}>신고 제출</Button>
  </Screen>;
}
