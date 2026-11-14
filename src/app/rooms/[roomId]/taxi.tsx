import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaxiProgressCard } from '@/components/taxi/TaxiProgressCard';
import { DEMO_USER_ID } from '@/features/chat/messages';
import { getDemoRoom } from '@/features/chat/mockMessages';
import { CHAT_COLORS as colors } from '@/features/chat/theme';
import { advanceTaxiDemoRoomStage, cancelTaxiDemoRoomCall, getTaxiDemoRoomStage } from '@/features/taxi/stages';
import type { TaxiDemoStage } from '@/features/taxi/stages';

const ACTION_LABELS: Partial<Record<TaxiDemoStage, string>> = {
  BEFORE_CALL: '택시 호출 시연',
  TAXI_CALLING: '배차 완료 시연',
  TAXI_ASSIGNED: '운행 시작 시연',
  IN_RIDE: '운행 완료 시연',
};

export default function TaxiScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string | string[] }>();
  const room = getDemoRoom(typeof roomId === 'string' ? roomId : undefined);
  const isHost = room?.hostUserId === DEMO_USER_ID;
  const [stage, setStage] = useState<TaxiDemoStage>(() => room ? getTaxiDemoRoomStage(room.roomId, isHost) : 'BEFORE_CALL');

  useEffect(() => {
    if (room) setStage(getTaxiDemoRoomStage(room.roomId, isHost));
  }, [room?.roomId, isHost]);

  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/chats');

  if (!room) {
    return (
      <SafeAreaView style={styles.page}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>택시방을 찾을 수 없어요</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/chats')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>채팅 목록으로</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const tripEstimate = room.roomId === 101 ? '약 40분 · 35km' : '약 15분 · 6km';
  const currentLocation = stage === 'IN_RIDE' ? `${room.destination.name} 방향` : `${room.origin.name} 근처`;
  const actionLabel = ACTION_LABELS[stage];

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="채팅방으로 돌아가기" onPress={goBack} style={styles.backButton}>
            <Text accessible={false} style={styles.backText}>‹</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>택시 이용</Text>
          <Text style={styles.headerCount}>동승 {room.participantCount}명</Text>
        </View>
        <Text style={styles.topNotice}>시연용 화면입니다. 실제 택시는 호출되지 않습니다.</Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.mapPreview}>
            <View style={styles.mapTop}><Text style={styles.mapBadge}>예시 경로</Text><Text style={styles.mapCaption}>실제 지도·위치 미연동</Text></View>
            <View style={styles.roadTop} /><View style={styles.roadBottom} />
            <View style={styles.routeRow}>
              <View style={styles.routeEndpoint}><View style={styles.markerDot} /><Text style={styles.markerLabel}>출발</Text></View>
              <View style={styles.routeLine} />
              {(stage === 'TAXI_ASSIGNED' || stage === 'IN_RIDE') && <Text style={[styles.carMarker, stage === 'IN_RIDE' && styles.carMarkerRide]}>🚕</Text>}
              <View style={styles.routeEndpoint}><View style={styles.markerDot} /><Text style={styles.markerLabel}>도착</Text></View>
            </View>
            <View style={styles.mapBottom}><Text style={styles.mapPlace} numberOfLines={1}>{room.origin.name}</Text><Text style={styles.mapArrow}>→</Text><Text style={styles.mapPlace} numberOfLines={1}>{room.destination.name}</Text></View>
            <Text style={styles.mapEstimate}>{tripEstimate} · 예시</Text>
          </View>

          <View style={styles.locationCard}>
            <LocationRow label="현재 위치" value={currentLocation} />
            <LocationRow label="출발지" value={room.origin.name} />
            <LocationRow label="목적지" value={room.destination.name} />
          </View>

          <TaxiProgressCard stage={stage} originName={room.origin.name} destinationName={room.destination.name} tripEstimate={tripEstimate} />
          <Text style={styles.demoNotice}>배차·차량·위치·예상 시간은 예시입니다. 이 앱에서 채팅을 다녀와도 단계가 유지되지만, 앱을 다시 실행하면 초기화됩니다.</Text>
        </ScrollView>

        <View style={styles.footer}>
          {isHost && actionLabel && (
            <Pressable accessibilityRole="button" onPress={() => setStage(advanceTaxiDemoRoomStage(room.roomId, isHost))} style={styles.primaryButton}>
              <Text style={styles.primaryText}>{actionLabel}</Text>
            </Pressable>
          )}
          {isHost && stage === 'TAXI_CALLING' && (
            <Pressable accessibilityRole="button" onPress={() => setStage(cancelTaxiDemoRoomCall(room.roomId, isHost))} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>호출 취소</Text>
            </Pressable>
          )}
          {stage === 'IN_RIDE' && (
            <Pressable accessibilityRole="button" onPress={goBack} style={isHost ? styles.textButton : styles.primaryButton}>
              <Text style={isHost ? styles.textButtonLabel : styles.primaryText}>동승자 채팅</Text>
            </Pressable>
          )}
          {stage === 'SETTLING' && (
            <Pressable accessibilityRole="button" onPress={goBack} style={styles.primaryButton}>
              <Text style={styles.primaryText}>채팅으로 돌아가기</Text>
            </Pressable>
          )}
          {!isHost && stage !== 'IN_RIDE' && <Text style={styles.viewerNote}>참여자는 진행 상태를 확인할 수 있어요. 단계 전환은 방장만 할 수 있습니다.</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}

function LocationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.locationRow}>
      <View style={styles.locationDot} />
      <Text style={styles.locationLabel}>{label}</Text>
      <Text style={styles.locationValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backButton: { width: 44, minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 36, lineHeight: 40 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
  headerCount: { color: colors.primary, fontSize: 12, fontWeight: '700', minWidth: 65, textAlign: 'right' },
  topNotice: { color: colors.secondary, fontSize: 11, lineHeight: 18, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 5 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 15 },
  mapPreview: { height: 237, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#EFF3F8', overflow: 'hidden', padding: 12 },
  mapTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  mapBadge: { overflow: 'hidden', color: colors.secondary, fontSize: 10, backgroundColor: '#FFFFFFDD', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  mapCaption: { color: colors.secondary, fontSize: 10 },
  roadTop: { position: 'absolute', top: 68, left: -10, right: -10, height: 12, backgroundColor: '#FFFFFFA8', transform: [{ rotate: '-10deg' }] },
  roadBottom: { position: 'absolute', bottom: 56, left: -10, right: -10, height: 12, backgroundColor: '#FFFFFFA8', transform: [{ rotate: '13deg' }] },
  routeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  routeEndpoint: { alignItems: 'center', gap: 5 },
  markerDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 5 },
  markerLabel: { color: colors.text, fontSize: 11, fontWeight: '700', backgroundColor: colors.white, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  routeLine: { height: 4, flex: 1, backgroundColor: colors.primary, marginHorizontal: -4 },
  carMarker: { position: 'absolute', alignSelf: 'center', left: '38%', fontSize: 24 },
  carMarkerRide: { left: '63%' },
  mapBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  mapPlace: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  mapArrow: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  mapEstimate: { color: colors.secondary, fontSize: 10, marginTop: 4 },
  locationCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 12, backgroundColor: colors.surface },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  locationDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.white },
  locationLabel: { color: colors.secondary, fontSize: 12, width: 70 },
  locationValue: { color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  demoNotice: { color: colors.secondary, textAlign: 'center', fontSize: 11, lineHeight: 17, paddingHorizontal: 10 },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8, backgroundColor: colors.white },
  primaryButton: { minHeight: 52, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14 },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  textButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  textButtonLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  viewerNote: { color: colors.secondary, textAlign: 'center', fontSize: 12, lineHeight: 20, paddingVertical: 10 },
  empty: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
