import { StyleSheet, Text, View } from 'react-native';

import { TAXI_DEMO_PROGRESS, getTaxiDemoProgress } from '@/features/taxi/stages';
import { CHAT_COLORS as colors } from '@/features/chat/theme';
import type { TaxiDemoStage } from '@/features/taxi/stages';

type Props = {
  stage: TaxiDemoStage;
  originName: string;
  destinationName: string;
  tripEstimate: string;
};

const stageCopy: Record<TaxiDemoStage, { title: string; description: string }> = {
  BEFORE_CALL: {
    title: '함께 출발할 준비가 되었나요?',
    description: '출발지와 목적지를 확인한 후 택시를 호출해 주세요.',
  },
  TAXI_CALLING: {
    title: '가상 택시를 찾고 있어요',
    description: '배차가 완료되면 차량 정보를 확인할 수 있어요.',
  },
  TAXI_ASSIGNED: {
    title: '택시가 출발지로 오고 있어요',
    description: '탑승 전 차량 번호를 확인해 주세요.',
  },
  IN_RIDE: {
    title: '목적지로 함께 가고 있어요',
    description: '운행 중 표시되는 정보는 시연용 예시입니다.',
  },
  SETTLING: {
    title: '가상 운행이 완료됐어요',
    description: '정산 화면은 담당 기능이 준비되면 연결합니다.',
  },
};

export function TaxiProgressCard({ stage, originName, destinationName, tripEstimate }: Props) {
  const progress = getTaxiDemoProgress(stage);
  const copy = stageCopy[stage];

  return (
    <View style={styles.card}>
      {progress > 0 && (
        <View style={styles.progress} accessibilityLabel={`가상 택시 진행 ${progress}단계 중 3단계`}>
          {TAXI_DEMO_PROGRESS.map((item, index) => (
            <View key={item.stage} style={styles.progressItem}>
              <View style={[styles.progressBar, index < progress && styles.progressBarActive]} />
              <Text style={[styles.progressLabel, index < progress && styles.progressLabelActive]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text accessibilityRole="header" style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>

      {stage === 'BEFORE_CALL' && (
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>예시 경로 · 예상 소요</Text>
            <Text style={styles.detailValue}>{tripEstimate}</Text>
          </View>
          <Text style={styles.sideNote}>함께 이동</Text>
        </View>
      )}

      {(stage === 'TAXI_ASSIGNED' || stage === 'IN_RIDE') && (
        <View style={styles.vehicle}>
          <Text style={styles.detailLabel}>시연용 차량 정보</Text>
          <Text style={styles.vehicleNumber}>경기 32바 1234</Text>
          <Text style={styles.description}>예시 차량 · 실제 배차 없음</Text>
        </View>
      )}

      {stage === 'IN_RIDE' && (
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>출발지</Text>
            <Text style={styles.detailValue}>{originName}</Text>
          </View>
          <View style={styles.destination}>
            <Text style={styles.detailLabel}>목적지</Text>
            <Text style={styles.detailValue}>{destinationName}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 18, gap: 8 },
  progress: { flexDirection: 'row', gap: 5, marginBottom: 13 },
  progressItem: { flex: 1, minWidth: 0, gap: 6 },
  progressBar: { height: 4, borderRadius: 4, backgroundColor: '#D5DDED' },
  progressBarActive: { backgroundColor: colors.primary },
  progressLabel: { color: '#94A3B8', textAlign: 'center', fontSize: 10, lineHeight: 15 },
  progressLabelActive: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.text, fontWeight: '700', fontSize: 17, lineHeight: 25 },
  description: { color: colors.secondary, fontSize: 12, lineHeight: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: '#D7E2F7', marginTop: 10, paddingTop: 14 },
  detailLabel: { color: colors.secondary, fontSize: 11, lineHeight: 17 },
  detailValue: { color: colors.primary, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  sideNote: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  vehicle: { gap: 2, borderTopWidth: 1, borderTopColor: '#D7E2F7', marginTop: 10, paddingTop: 14 },
  vehicleNumber: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: '700' },
  destination: { alignItems: 'flex-end', flexShrink: 1 },
});
