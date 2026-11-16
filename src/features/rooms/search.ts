import type { DeparturePeriod, RoomSearchParams } from '@/types/room';

const periodCodes: Record<string, DeparturePeriod> = {
  전체: 'ALL', 오전: 'MORNING', 오후: 'AFTERNOON', 저녁: 'EVENING',
  ALL: 'ALL', MORNING: 'MORNING', AFTERNOON: 'AFTERNOON', EVENING: 'EVENING',
};
export function toDeparturePeriod(label = '전체'): DeparturePeriod {
  const period = periodCodes[label];
  if (!period) throw new Error('올바른 출발 시간대를 선택해 주세요.');
  return period;
}
export function roomSearchQuery(input: string | RoomSearchParams = '') {
  const params = typeof input === 'string' ? { destination: input } : input;
  const values = { destination: params.destination?.trim(), origin: params.origin?.trim(), period: params.period };
  const query = Object.entries(values).filter(([, value]) => value && value !== 'ALL')
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value!)).join('&');
  return query ? '?' + query : '';
}
