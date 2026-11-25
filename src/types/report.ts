export type ReportReason = 'UNSAFE_BEHAVIOR' | 'ABUSIVE_LANGUAGE' | 'NO_SHOW' | 'OTHER';
export type UserReport = {
  reportId: number;
  reportedUserId: number;
  reportedUsername: string;
  reportedNickname: string;
  reason: ReportReason;
  description: string;
  createdAt: string;
};
export const reportReasons: { value: ReportReason; label: string }[] = [
  { value: 'UNSAFE_BEHAVIOR', label: '위험한 행동' },
  { value: 'ABUSIVE_LANGUAGE', label: '욕설·불쾌한 언행' },
  { value: 'NO_SHOW', label: '약속 장소에 나오지 않음' },
  { value: 'OTHER', label: '기타' },
];
export function reportReasonLabel(reason: ReportReason) {
  return reportReasons.find(item => item.value === reason)?.label ?? reason;
}
