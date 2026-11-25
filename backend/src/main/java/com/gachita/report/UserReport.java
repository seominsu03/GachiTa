package com.gachita.report;

import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "user_reports")
public class UserReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "report_id") private Long reportId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "reporter_user_id") private User reporter;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "reported_user_id") private User reportedUser;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24) private ReportReason reason;
    @Column(nullable = false, length = 1000) private String description;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected UserReport() {}
    public UserReport(User reporter, User reportedUser, ReportReason reason, String description) {
        this.reporter = reporter; this.reportedUser = reportedUser; this.reason = reason;
        this.description = description; this.createdAt = Instant.now();
    }
    public Long getReportId() { return reportId; }
    public User getReportedUser() { return reportedUser; }
    public ReportReason getReason() { return reason; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
}
