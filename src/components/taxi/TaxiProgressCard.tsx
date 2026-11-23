import { Text, View } from 'react-native';
import { Card, ui } from '@/components/ui/DesignSystem';
import { taxiStageCopy } from '@/features/taxi/stages';
import type { RoomStatus } from '@/types/contracts';

const stages: RoomStatus[] = ['TAXI_CALLING', 'TAXI_ASSIGNED', 'IN_RIDE', 'SETTLING'];

export function TaxiProgressCard({ status }: { status: RoomStatus }) {
  const copy = taxiStageCopy[status];
  const progress = stages.indexOf(status);
  return <Card tinted style={{ gap: 12 }}>
    <Text style={ui.heading}>{copy?.title ?? '가상 택시 이용'}</Text>
    <Text style={ui.body}>{copy?.description ?? '탑승 확인을 기다리고 있어요.'}</Text>
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {stages.map((stage, index) => <View key={stage} style={{ flex: 1, height: 5, borderRadius: 4, backgroundColor: progress >= index || status === 'COMPLETED' ? '#2D67E8' : '#D5DDED' }} />)}
    </View>
    <Text style={ui.muted}>이 화면은 가상 운행 시연입니다. 실제 차량을 배차하거나 운행 위치를 추적하지 않습니다.</Text>
  </Card>;
}
