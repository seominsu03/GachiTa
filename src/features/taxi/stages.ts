import type { RoomStatus } from '@/types/contracts';

export const taxiStageCopy: Partial<Record<RoomStatus, { title: string; description: string; action?: string }>> = {
  BOARDING_CHECK: { title: '탑승 확인 중', description: '모든 동승자가 탑승을 확인하면 방장이 가상 택시를 호출할 수 있어요.', action: '가상 택시 호출' },
  TAXI_CALLING: { title: '택시 호출 중', description: '실제 택시가 호출되지는 않아요. 방장이 다음 시연 단계를 진행합니다.', action: '배차 완료' },
  TAXI_ASSIGNED: { title: '배차 완료', description: '가상 택시 배차가 완료됐어요.', action: '운행 시작' },
  IN_RIDE: { title: '운행 중', description: '가상 운행을 진행하고 있어요.', action: '운행 완료' },
  SETTLING: { title: '운행 완료', description: '정산 화면에서 최종 요금을 입력하고 수령을 확인해 주세요.' },
  COMPLETED: { title: '정산 완료', description: '모든 탑승자의 정산이 완료됐어요.' },
};
