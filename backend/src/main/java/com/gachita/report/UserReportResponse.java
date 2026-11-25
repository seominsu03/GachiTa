package com.gachita.report;

import java.time.Instant;

public record UserReportResponse(Long reportId, Long reportedUserId, String reportedUsername,
                                 String reportedNickname, ReportReason reason, String description, Instant createdAt) {
    public static UserReportResponse from(UserReport report) {
        var user = report.getReportedUser();
        return new UserReportResponse(report.getReportId(), user.getUserId(), user.getUsername(), user.getNickname(),
                report.getReason(), report.getDescription(), report.getCreatedAt());
    }
}
