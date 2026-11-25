import { apiRequest } from '@/services/apiClient';
import type { ReportReason, UserReport } from '@/types/report';

export function getMyReports() { return apiRequest<UserReport[]>('/api/v1/reports'); }
export function submitUserReport(reportedUserId: number, reason: ReportReason, description: string) {
  return apiRequest<UserReport>('/api/v1/reports', { method: 'POST', body: { reportedUserId, reason, description } });
}
