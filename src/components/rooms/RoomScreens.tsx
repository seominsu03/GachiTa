import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Brand, Button, Card, Field, Icon, Notice, Screen, ui } from '@/components/ui/DesignSystem';
import { design as c } from '@/constants/design';
import { CapacityCard, MemberRow, RoomSummary } from '@/components/rooms/RoomPresentation';
import type { Participation, Room, RoomCreateRequest } from '@/types/room';
import { departureLabel, roomStatusLabels } from '@/features/rooms/presentation';
import type { LocationInfo } from '@/types/contracts';

export type Navigate = (screen: string, roomId?: number, search?: Record<string, string>) => void;
export function BottomNavigation({ active, navigate }: { active: 'home' | 'rooms' | 'mypage'; navigate: Navigate }) {
  return <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: c.line, paddingTop: 8, paddingBottom: 20, backgroundColor: c.white }}>
    {(['home', 'rooms', 'chats', 'mypage'] as const).map((name, index) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: name === active, disabled: name === 'chats' }} accessibilityLabel={['홈', '택시방', '채팅', '내 정보'][index]} onPress={() => name !== 'chats' && navigate(name)} style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: 40 }}>
      <Icon name={(['home', 'car', 'chat', 'user'] as const)[index]} color={name === active ? c.blue : c.faint} /><Text style={{ fontSize: 11, color: name === active ? c.blue : c.muted }}>{['홈', '택시방', '채팅', '내 정보'][index]}</Text>
    </Pressable>)}
  </View>;
}

function RoomListCard({ room, onPress, home = false }: { room: Room; onPress: () => void; home?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}><Card style={{ backgroundColor: c.white, padding: 12 }}>
    <View style={ui.between}><View style={{ gap: 5 }}><Text style={ui.body}><Text style={ui.muted}>출발　</Text><Text style={ui.bold}>{room.origin.name}</Text></Text><Text style={ui.body}><Text style={[ui.muted, ui.blue]}>도착　</Text><Text style={ui.bold}>{room.destination.name}</Text></Text></View>{home && <Icon name="next" color={c.faint} />}</View>
    <View style={ui.between}><View><Text style={ui.muted}>출발 시간 <Text style={ui.bold}>{departureLabel(room.departureAt)}</Text></Text><Text style={ui.muted}>모집 인원 <Text style={ui.bold}>{room.capacity}명</Text>　현재 참여 <Text style={[ui.blue, { fontWeight: '700' }]}>{room.participantCount}명</Text></Text></View>{!home && <View style={{ backgroundColor: c.blue, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 11 }}><Text style={{ color: c.white, fontSize: 12, fontWeight: '700' }}>동승 신청</Text></View>}</View>
  </Card></Pressable>;
}

export function RoomListScreen({ rooms, navigate, onSearch, home = false, error, loading = false, refresh, initialSearch = {} }: { rooms: Room[]; navigate: Navigate; onSearch?: (filter: Record<string, string>) => void; home?: boolean; error?: string | null; loading?: boolean; refresh?: () => void; initialSearch?: Record<string, string> }) {
  const [origin, setOrigin] = useState(initialSearch.origin ?? ''); const [destination, setDestination] = useState(initialSearch.destination ?? ''); const [period, setPeriod] = useState(initialSearch.period ?? '전체'); const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ origin: initialSearch.origin ?? '', destination: initialSearch.destination ?? '', period: initialSearch.period ?? '전체' });
  // Production results are already fully filtered by the server. Preview fixtures remain local.
  const visible = onSearch ? rooms : rooms.filter(room => { const hour = new Date(new Date(room.departureAt).getTime() + 9 * 3600000).getUTCHours(); return room.origin.name.includes(filter.origin) && room.destination.name.includes(filter.destination) && (filter.period === '전체' || (filter.period === '오전' && hour < 12) || (filter.period === '오후' && hour >= 12 && hour < 18) || (filter.period === '저녁' && hour >= 18)); });
  const search = () => { const next = { origin: origin.trim(), destination: destination.trim(), period }; setFilter(next); if (!home) onSearch?.(next); };
  return <Screen title={home ? undefined : '택시방 찾기'} right={!home ? <Pressable accessibilityLabel="검색 필터" onPress={() => setShowFilter(true)}><Icon name="tune" color={c.ink} /></Pressable> : undefined} tabs={<BottomNavigation active={home ? 'home' : 'rooms'} navigate={navigate} />}>
    {home && <><View style={ui.between}><Brand /><Pressable accessibilityLabel="내 정보" onPress={() => navigate('mypage')}><Icon name="user" color={c.muted} /></Pressable></View><View style={{ marginTop: 4, gap: 4 }}><Text style={ui.muted}>안녕하세요!</Text><Text style={ui.title}>어디로 같이 갈까요?</Text></View></>}
    <View style={{ gap: 8 }}><Field icon="origin" value={origin} onChangeText={setOrigin} placeholder="출발지를 입력해 주세요" accessibilityLabel="출발지 검색" prefix={<Text style={ui.label}>출발지</Text>} /><Field icon="pin" value={destination} onChangeText={setDestination} placeholder="목적지를 입력해 주세요" accessibilityLabel="목적지 검색" prefix={<Text style={ui.label}>목적지</Text>} />
      <View style={ui.row}><Pressable accessibilityRole="button" accessibilityLabel="출발 시간 필터" onPress={() => setShowFilter(true)} style={{ flex: 1 }}><View pointerEvents="none"><Field icon="clock" value={period === '전체' && home ? '' : period} placeholder="시간을 선택해 주세요" prefix={<Text style={ui.label}>출발 시간</Text>} editable={false} suffix={<Icon name="down" color={c.muted} />} /></View></Pressable>{!home && <Button onPress={search}>검색</Button>}</View>
      {home && <Button onPress={() => { search(); navigate('rooms', undefined, { origin: origin.trim(), destination: destination.trim(), period }); }}>⌕  택시방 검색</Button>}
    </View>
    {home && <View style={ui.row}>{['택시방 만들기', '택시방 찾기'].map((label, index) => <Pressable key={label} accessibilityRole="button" onPress={() => navigate(index === 0 ? 'create' : 'rooms')} style={{ flex: 1, minHeight: 56, backgroundColor: c.tint, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon name={index === 0 ? 'plus' : 'people'} size={20} /><Text style={[ui.label, ui.blue]}>{label}</Text></Pressable>)}</View>}
    <View style={[ui.between, { marginTop: 4 }]}><Text style={ui.heading}>모집 중인 택시방{!home && <Text style={ui.blue}> {visible.length}</Text>}</Text><View style={ui.row}>{refresh && <Button secondary small busy={loading} onPress={refresh}>새로고침</Button>}{home && <Pressable onPress={() => navigate('rooms')}><Text style={ui.muted}>더보기 ›</Text></Pressable>}</View></View>
    {error && <View style={ui.column}><Notice error>{error}</Notice><Button secondary small onPress={() => refresh?.()}>다시 불러오기</Button></View>}
    {loading && <Notice>택시방을 불러오고 있어요.</Notice>}
    {visible.map(room => <RoomListCard key={room.roomId} room={room} home={home} onPress={() => navigate('detail', room.roomId)} />)}
    {!loading && !error && visible.length === 0 && <Card><Notice>조건에 맞는 택시방이 없습니다.</Notice><Button secondary small onPress={() => navigate('create')}>새 택시방 만들기</Button></Card>}
    <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000044' }}><Card style={{ backgroundColor: c.white, paddingBottom: 32 }}><Text style={ui.heading}>출발 시간 선택</Text>{['전체', '오전', '오후', '저녁'].map(value => <Pressable accessibilityRole="button" key={value} onPress={() => { setPeriod(value); setShowFilter(false); }} style={{ padding: 14 }}><Text style={ui.body}>{value}{period === value ? '　✓' : ''}</Text></Pressable>)}<Button secondary onPress={() => setShowFilter(false)}>닫기</Button></Card></View></Modal>
  </Screen>;
}

export function RoomDetailScreen({ onRefresh, room, participations, userId, navigate, busy, error, onRequest, onCancel }: { room: Room; participations: Participation[]; userId: number; navigate: Navigate; busy?: boolean; error?: string | null; onRefresh?: () => void; onRequest: () => void; onCancel: (participationId: number) => void }) {
  const approved = participations.filter(p => p.status === 'APPROVED' || p.status === 'BOARDING_CONFIRMED');
  const own = participations.find(p => p.userId === userId && (p.status === 'PENDING' || p.status === 'APPROVED' || p.status === 'BOARDING_CONFIRMED'));
  const host = room.hostUserId === userId;
  const timedOut = participations.some(p => p.userId === userId && p.status === 'TIMED_OUT');
  const canCancel = room.status === 'RECRUITING' || room.status === 'BOARDING_CHECK';
  return <Screen title="택시방 상세" right={onRefresh && <Button secondary small onPress={onRefresh}>새로고침</Button>} footer={<View style={ui.column}>
    {error && <Notice error>{error}</Notice>}
    {host ? <Button onPress={() => navigate('participants', room.roomId)}>동승자 관리</Button>
      : own ? <><Text style={[ui.muted, { textAlign: 'center' }]}>{own.status === 'PENDING' ? '신청이 접수되었어요.\n방장 승인 후 참여가 확정돼요.' : '동승이 확정되었어요.'}</Text><Card tinted style={{ alignItems: 'center' }}><Text style={[ui.blue, { fontSize: 17, fontWeight: '700' }]}>✓　{own.status === 'PENDING' ? '신청 완료' : '동승 확정'}</Text></Card>{canCancel && own.status !== 'BOARDING_CONFIRMED' && <Button secondary small busy={busy} onPress={() => onCancel(own.participationId)}>신청 취소</Button>}</>
        : <><Text style={[ui.muted, { textAlign: 'center' }]}>동승 신청 후 방장의 승인을 기다려 주세요.{'\n'}승인 후 참여가 확정돼요.</Text><Button onPress={onRequest} busy={busy} disabled={timedOut || room.participantCount >= room.capacity || room.status !== 'RECRUITING'}>{timedOut ? '탑승 미응답으로 재참여할 수 없어요' : '동승 신청'}</Button></>}
  </View>}>
    <Text style={ui.badge}>{roomStatusLabels[room.status]}</Text><RoomSummary room={room} detailed /><CapacityCard room={room} />
    <Text style={ui.heading}>방장 정보</Text><MemberRow member={room.host} badge="방장" />
    <View style={ui.between}><Text style={ui.heading}>동승자 정보</Text><Text style={ui.muted}>{approved.length}명 참여 중</Text></View>{approved.map(member => <MemberRow key={member.userId} member={member} />)}
    {(host || own?.status === 'APPROVED' || own?.status === 'BOARDING_CONFIRMED') && <Button secondary onPress={() => navigate('settlement', room.roomId)}>요금 및 정산</Button>}
  </Screen>;
}

export function ParticipantsScreen({ onRefresh, room, participations, navigate, busy, error, onApprove, onReject }: { room: Room; participations: Participation[]; navigate: Navigate; busy?: boolean; error?: string | null; onRefresh?: () => void; onApprove: (id: number) => void; onReject: (id: number) => void }) {
  const pending = participations.filter(p => p.status === 'PENDING'); const approved = participations.filter(p => p.status === 'APPROVED' || p.status === 'BOARDING_CONFIRMED');
  const [showChat, setShowChat] = useState(false);
  return <Screen title="동승자 관리" right={onRefresh && <Button secondary small onPress={onRefresh}>새로고침</Button>} contentGap={12} footer={<Button onPress={() => setShowChat(true)}>채팅</Button>}>
    <RoomSummary room={room} /><CapacityCard room={room} management />
    <View style={ui.between}><Text style={ui.heading}>동승 신청자</Text><Text style={[ui.muted, ui.blue]}>{pending.length}명</Text></View>
    {error && <Notice error>{error}</Notice>}
    <View style={{ gap: 8 }}>{pending.map(member => <MemberRow key={member.participationId} member={member} dense><View style={{ gap: 4 }}><Button small busy={busy} disabled={room.status !== 'RECRUITING' || room.participantCount >= room.capacity} onPress={() => onApprove(member.participationId)}>수락</Button><Button small secondary disabled={busy || room.status !== 'RECRUITING'} onPress={() => onReject(member.participationId)}>거절</Button></View></MemberRow>)}</View>
    {pending.length === 0 && <Card style={{ alignItems: 'center', paddingVertical: 22 }}><Text style={ui.body}>대기 중인 신청자가 없어요.</Text><Text style={ui.muted}>{room.participantCount >= room.capacity ? '모든 동승자가 확정되었어요.' : '새로운 동승 신청을 기다리고 있어요.'}</Text></Card>}
    <View style={ui.between}><Text style={ui.heading}>현재 동승자</Text><Text style={ui.muted}>{approved.length}명 참여 중</Text></View><Text style={[ui.muted, { fontSize: 11, marginTop: -12 }]}>방장 본인({room.host.nickname})은 목록에서 제외돼요.</Text>
    <View style={{ gap: 8 }}>{approved.map(member => <MemberRow key={member.userId} member={member}><Text style={ui.badge}>동승 확정</Text></MemberRow>)}</View>
    <Modal visible={showChat} transparent animationType="fade" onRequestClose={() => setShowChat(false)}><View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000055' }}><Card><Text style={ui.heading}>채팅 화면 연결</Text><Text style={ui.body}>채팅은 팀원 B의 담당 화면입니다. 현재 화면과 데이터는 유지되며, B의 채팅 구현 후 연결할 수 있어요.</Text><Button onPress={() => { setShowChat(false); navigate('detail', room.roomId); }}>확인</Button></Card></View></Modal>
  </Screen>;
}

export const locations: LocationInfo[] = [
  { name: '수원역', latitude: 37.2657, longitude: 127.0007 }, { name: '강남역', latitude: 37.4979, longitude: 127.0276 },
  { name: '사당역', latitude: 37.4765, longitude: 126.9816 }, { name: '아주대학교 정문', latitude: 37.2791, longitude: 127.0438 },
  { name: '서울대학교 정문', latitude: 37.4663, longitude: 126.9481 }, { name: '서울대입구역 3번 출구', latitude: 37.4812, longitude: 126.9527 },
  { name: '서울대학교 중앙도서관', latitude: 37.4591, longitude: 126.952 }, { name: '신림역 2번 출구', latitude: 37.4842, longitude: 126.9296 },
];

export function CreateRoomScreen({ onCreate, busy, error, preview = false }: { onCreate: (input: RoomCreateRequest) => void; busy?: boolean; error?: string | null; preview?: boolean }) {
  const [origin, setOrigin] = useState<LocationInfo | null>(preview ? locations[0] : null); const [destination, setDestination] = useState<LocationInfo | null>(preview ? locations[1] : null);
  const [capacity, setCapacity] = useState(3); const [day, setDay] = useState(() => preview ? '2026-10-07' : new Date(Date.now() + 86400000 + 9 * 3600000).toISOString().slice(0, 10)); const [time, setTime] = useState('18:30');
  const [datePicker, setDatePicker] = useState<'date' | 'time' | null>(null);
  const [dateOptions] = useState(() => Array.from({ length: 14 }, (_, index) => new Date(Date.now() + index * 86400000 + 9 * 3600000).toISOString().slice(0, 10)));
  const dayText = new Date(`${day}T00:00:00+09:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' });
  const timeText = new Date(`${day}T${time}:00+09:00`).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });
  const [picker, setPicker] = useState<'origin' | 'destination' | null>(null); const [localError, setLocalError] = useState<string | null>(null);
  function submit() {
    const departure = new Date(`${day}T${time}:00+09:00`);
    if (!origin || !destination) { setLocalError('출발지와 목적지를 선택해 주세요.'); return; }
    if (!Number.isFinite(departure.getTime()) || (!preview && departure.getTime() <= Date.now())) { setLocalError('미래의 출발 날짜와 시간을 입력해 주세요.'); return; }
    if (origin.name === destination.name) { setLocalError('출발지와 목적지를 다르게 선택해 주세요.'); return; }
    setLocalError(null); onCreate({ origin, destination, capacity, departureAt: departure.toISOString() });
  }
  return <Screen title="택시방 만들기" footer={<Button onPress={submit} busy={busy}>택시방 만들기</Button>}>
    <View style={{ gap: 24, paddingTop: 8 }}>
      <View style={{ gap: 9 }}><Text style={ui.label}>출발지</Text><Pressable accessibilityRole="button" accessibilityLabel="출발지 선택" onPress={() => setPicker('origin')}><View pointerEvents="none"><Field icon="origin" value={origin?.name ?? ''} placeholder="출발지를 선택해 주세요" editable={false} suffix={<Icon name="search" color={c.muted} />} /></View></Pressable></View>
      <View style={{ gap: 9 }}><Text style={ui.label}>목적지</Text><Pressable accessibilityRole="button" accessibilityLabel="목적지 선택" onPress={() => setPicker('destination')}><View pointerEvents="none"><Field icon="pin" value={destination?.name ?? ''} placeholder="목적지를 선택해 주세요" editable={false} suffix={<Icon name="search" color={c.muted} />} /></View></Pressable></View>
      <View style={{ gap: 12 }}><Text style={ui.label}>출발 시간</Text><View style={ui.row}><Pressable accessibilityRole="button" accessibilityLabel="출발 날짜 선택" onPress={() => setDatePicker('date')} style={{ flex: 1 }}><View pointerEvents="none"><Field label="날짜 선택" icon="calendar" value={dayText} editable={false} suffix={<Icon name="down" color={c.muted} size={18} />} /></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel="출발 시각 선택" onPress={() => setDatePicker('time')} style={{ flex: 1 }}><View pointerEvents="none"><Field label="시간 선택" icon="clock" value={timeText} editable={false} suffix={<Icon name="down" color={c.muted} size={18} />} /></View></Pressable></View></View>
      <View style={{ gap: 10 }}><View style={ui.between}><Text style={ui.label}>모집 인원</Text><Text style={ui.muted}>본인 포함</Text></View><Card style={{ padding: 5 }}><View style={ui.between}><Pressable accessibilityLabel="모집 인원 줄이기" disabled={capacity <= 2} onPress={() => setCapacity(capacity - 1)} style={{ padding: 8 }}><Icon name="minus" /></Pressable><Text style={[ui.heading, { fontSize: 21 }]}>{capacity}명</Text><Pressable accessibilityLabel="모집 인원 늘리기" disabled={capacity >= 4} onPress={() => setCapacity(capacity + 1)} style={{ padding: 8 }}><Icon name="plus" /></Pressable></View></Card><Text style={ui.muted}>2명 / 3명 / 4명 중 선택할 수 있어요.</Text></View>
      <Card tinted><Text style={ui.bold}>예상 정보</Text><Text style={[ui.heading, { marginVertical: 4 }]}>{origin?.name ?? '출발지'}　→　{destination?.name ?? '목적지'}</Text><View style={ui.divider} /><View style={ui.between}><Text style={ui.muted}>{dayText} · {timeText}</Text><Text style={ui.muted}>모집 인원 <Text style={[ui.blue, { fontWeight: '700' }]}>{capacity}명</Text></Text></View></Card>
      {(localError || error) && <Notice error>{localError ?? error}</Notice>}
    </View>
    <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000044' }}><Card style={{ backgroundColor: c.white, paddingBottom: 32 }}><Text style={ui.heading}>{picker === 'origin' ? '출발지' : '목적지'} 선택</Text>{locations.map(location => <Pressable accessibilityRole="button" key={location.name} onPress={() => { if (picker === 'origin') setOrigin(location); else setDestination(location); setPicker(null); }} style={{ padding: 10 }}><Text style={ui.body}>{location.name}</Text></Pressable>)}<Button secondary onPress={() => setPicker(null)}>닫기</Button></Card></View></Modal>
    <Modal visible={datePicker !== null} transparent animationType="slide" onRequestClose={() => setDatePicker(null)}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000044' }}><Card style={{ backgroundColor: c.white, maxHeight: '65%', paddingBottom: 28 }}><Text style={ui.heading}>{datePicker === 'date' ? '출발 날짜' : '출발 시간'} 선택</Text><ScrollView>{(datePicker === 'date' ? dateOptions : Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)).map(value => <Pressable key={value} accessibilityRole="button" onPress={() => { if (datePicker === 'date') setDay(value); else setTime(value); setDatePicker(null); }} style={{ padding: 12 }}><Text style={ui.body}>{value}</Text></Pressable>)}</ScrollView><Button secondary onPress={() => setDatePicker(null)}>닫기</Button></Card></View></Modal>
  </Screen>;
}
