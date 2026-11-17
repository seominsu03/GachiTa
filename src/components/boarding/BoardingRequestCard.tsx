import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BoardingCountdown } from '@/components/boarding/BoardingCountdown';
import { CHAT_COLORS as colors, chatTime } from '@/features/chat/theme';
import type { BoardingDemoState } from '@/types/boarding';

type Props = {
  isHost: boolean;
  participantCount: number;
  state: BoardingDemoState;
  onRequest: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
};

export function BoardingRequestCard({
  isHost, participantCount, state, onRequest, onAccept, onDecline, onExpire,
}: Props) {
  const waitingCount = Math.max(0, participantCount - 1);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>탑승 확인</Text>
        <Text style={styles.badge}>시연용 · {isHost ? '방장' : '참여자'}</Text>
      </View>
      {state.status !== 'idle' && <Text style={styles.meta}>요청 시각 {chatTime(new Date(state.requestedAt).toISOString())}</Text>}

      {state.status === 'idle' && (
        <>
          <Text style={styles.description}>{isHost ? '동승자에게 탑승 여부를 확인해 보세요.' : '방장의 탑승 확인 요청을 기다리고 있어요.'}</Text>
          {isHost && <Pressable accessibilityRole="button" onPress={onRequest} style={styles.primaryButton}><Text style={styles.primaryText}>부르기</Text></Pressable>}
        </>
      )}

      {state.status === 'pending' && (
        <>
          <View style={styles.statusRow}>
            <Text style={styles.statusTitle}>{isHost ? '동승자 응답 대기 중' : '방장이 탑승 확인을 요청했어요'}</Text>
            <BoardingCountdown expiresAt={state.expiresAt} onExpire={onExpire} />
          </View>
          <Text style={styles.description}>{isHost ? `동승자 ${waitingCount}명의 응답을 기다리고 있어요.` : '화면 시연을 위한 예시 요청입니다. 남은 시간 안에 선택해 주세요.'}</Text>
          {!isHost && <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onAccept} style={[styles.actionButton, styles.acceptButton]}><Text style={styles.acceptText}>탑승할게요</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={onDecline} style={[styles.actionButton, styles.declineButton]}><Text style={styles.declineText}>탑승하지 않을게요</Text></Pressable>
          </View>}
        </>
      )}

      {state.status === 'accepted' && <Text style={styles.result}>탑승을 확인했어요.</Text>}
      {state.status === 'declined' && <Text style={styles.result}>탑승하지 않기로 했어요. 미응답 만료와는 별도 상태입니다.</Text>}
      {state.status === 'expired' && <Text style={styles.result}>60초가 지나 요청이 만료됐어요. 실제 자동 퇴장은 서버 연결 후 적용됩니다.</Text>}

      <Text style={styles.note}>이 화면에서만 진행하는 시연이며 다른 기기로 전송되지 않아요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 15, gap: 10, marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  title: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  badge: { color: colors.primary, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  meta: { color: colors.secondary, fontSize: 11, lineHeight: 17 },
  description: { color: colors.secondary, fontSize: 12, lineHeight: 19 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  statusTitle: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  primaryButton: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20 },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { minHeight: 44, flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8 },
  acceptButton: { backgroundColor: colors.primary },
  acceptText: { color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  declineButton: { borderColor: colors.border, borderWidth: 1, backgroundColor: colors.background },
  declineText: { color: colors.secondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  result: { color: colors.text, fontSize: 13, lineHeight: 21, fontWeight: '600' },
  note: { color: colors.secondary, fontSize: 11, lineHeight: 17 },
});
