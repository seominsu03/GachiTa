import type { RoomStatus } from '@/types/contracts';

export const roomStatusLabels: Record<RoomStatus, string> = {
  RECRUITING: '모집 중', BOARDING_CHECK: '탑승 확인 중', TAXI_CALLING: '택시 호출 중',
  TAXI_ASSIGNED: '배차 완료', IN_RIDE: '운행 중', SETTLING: '정산 중', COMPLETED: '정산 완료',
};
export function departureLabel(departureAt: string) {
  return new Date(departureAt).toLocaleString('ko-KR', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
  });
}
