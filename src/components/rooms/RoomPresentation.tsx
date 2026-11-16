import { Image, StyleSheet, Text, View } from 'react-native';
import { Card, Icon, ui } from '@/components/ui/DesignSystem';
import { design as c } from '@/constants/design';
import type { Member, Room } from '@/types/room';

export const timeLabel = (value: string) => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
export const dateLabel = (value: string) => new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' });
export const money = (value: number) => value.toLocaleString('ko-KR');

// The reference images remain unmodified. These clipped views use only their sample avatars.
// Real accounts without an avatar display initials instead of someone else's portrait.
const samples = {
  mint: { x: 36, y: 384 }, junho: { x: 36, y: 464 }, sohee: { x: 36, y: 544 }, haru: { x: 36, y: 680 },
  host: { x: 38, y: 490 },
};
export function Avatar({ member, size = 40 }: { member: Member; size?: number }) {
  const crop = member.avatarKey ? samples[member.avatarKey] : null;
  const scale = size / 40;
  return <View accessibilityLabel={`${member.nickname} 프로필`} style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
    {crop ? <Image source={member.avatarKey === 'host' ? require('../../../assets/design/settlement-reference.png') : require('../../../assets/design/participants-reference.png')}
      style={{ position: 'absolute', width: 390 * scale, height: (member.avatarKey === 'host' ? 898 : 844) * scale, left: -crop.x * scale, top: -crop.y * scale }} />
      : <Text style={{ color: c.blue, fontWeight: '700' }}>{member.nickname.slice(0, 1)}</Text>}
  </View>;
}

export function RoomSummary({ room, detailed = false, compact = false }: { room: Room; detailed?: boolean; compact?: boolean }) {
  return <Card style={{ gap: compact ? 6 : 8 }}>
    {compact ? <><Text style={ui.bold}>{room.origin.name} → {room.destination.name} 같이타</Text><View style={ui.between}><Text style={ui.muted}>출발 시간 {timeLabel(room.departureAt)}</Text><Text style={[ui.muted, ui.blue, { fontWeight: '700' }]}>총 {room.participantCount}명 · 방장 포함</Text></View><Text style={[ui.muted, { fontSize: 11 }]}>방장 {room.host.nickname}</Text></>
      : <><View style={ui.row}><View style={{ flex: 1, gap: 4 }}><Text style={[ui.muted, { lineHeight: 14 }]}>출발지</Text><Text style={[ui.heading, { fontSize: 24, lineHeight: 28 }]}>{room.origin.name}</Text></View><Icon name="arrow" color={c.muted} /><View style={{ flex: 1, gap: 4 }}><Text style={[ui.muted, ui.blue, { lineHeight: 14 }]}>목적지</Text><Text style={[ui.heading, { fontSize: 24, lineHeight: 28 }]}>{room.destination.name}</Text></View></View>
        <View style={[ui.divider, { marginVertical: 0 }]} />
        {detailed ? <View style={ui.row}><View style={{ flex: 1, gap: 6 }}><Text style={ui.muted}>출발 날짜</Text><Text style={ui.bold}>{dateLabel(room.departureAt)}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={ui.muted}>출발 시간</Text><Text style={ui.bold}>{timeLabel(room.departureAt)}</Text></View></View>
          : <View style={ui.between}><Text style={ui.muted}>출발 시간 <Text style={ui.bold}>{timeLabel(room.departureAt)}</Text></Text><Text style={ui.muted}>모집 인원 <Text style={ui.bold}>{room.capacity}명</Text></Text></View>}
      </>}
  </Card>;
}

export function CapacityCard({ room, management = false }: { room: Room; management?: boolean }) {
  const full = room.participantCount >= room.capacity;
  return <Card tinted style={{ gap: 8 }}><View style={ui.between}><Text style={ui.bold}>{full ? '모집 완료' : management ? '현재 참여' : '모집 현황'}</Text><Text style={{ fontSize: 21, lineHeight: 24, color: c.blue, fontWeight: '700' }}>{room.participantCount} / {room.capacity}명</Text></View>
    <View style={styles.progress}>{Array.from({ length: room.capacity }, (_, index) => <View key={index} style={[styles.segment, index < room.participantCount && { backgroundColor: c.blue }]} />)}</View>
    {!management && <View style={ui.between}><Text style={ui.muted}>모집 인원 <Text style={ui.bold}>{room.capacity}명</Text></Text><Text style={ui.muted}>현재 참여 인원 <Text style={ui.blue}>{room.participantCount}명</Text></Text></View>}
    <Text style={[ui.muted, ui.blue, { lineHeight: 14 }]}>{full ? '정원이 찼어요. 채팅에서 출발을 준비해요.' : `${management ? '방장 포함 · ' : ''}남은 모집 인원 ${room.capacity - room.participantCount}명`}</Text>
  </Card>;
}

export function MemberRow({ member, badge, children, dense = false }: { member: Member; badge?: string; children?: React.ReactNode; dense?: boolean }) {
  return <Card style={{ paddingVertical: dense ? 7 : 10 }}><View style={ui.row}><Avatar member={member} /><View style={{ flex: 1, gap: 4 }}><View style={ui.row}><Text style={ui.bold}>{member.nickname}</Text>{badge && <Text style={ui.badge}>{badge}</Text>}</View>
    {member.rating !== undefined && <View style={[ui.row, { gap: 5 }]}><Icon name="star" size={13} /><Text style={ui.label}>{member.rating.toFixed(1)}</Text><Text style={ui.muted}>· 후기 {member.reviewCount ?? 0}개</Text></View>}
  </View>{children}</View></Card>;
}

export function MemberStrip({ members, hostUserId, currentUserId }: { members: Member[]; hostUserId: number; currentUserId?: number }) {
  return <View style={{ gap: 14 }}><Text style={ui.bold}>함께 탄 참여자 {members.length}명</Text><View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>{members.map(member => <View key={member.userId} style={{ alignItems: 'center', gap: 6 }}><Avatar member={member} /><Text style={{ color: c.ink, fontSize: 12 }}>{member.nickname}{member.userId === hostUserId ? ' · 방장' : ''}{member.userId === currentUserId ? ' (나)' : ''}</Text></View>)}</View></View>;
}

const styles = StyleSheet.create({ progress: { flexDirection: 'row', gap: 5 }, segment: { flex: 1, height: 6, borderRadius: 6, backgroundColor: c.line } });
