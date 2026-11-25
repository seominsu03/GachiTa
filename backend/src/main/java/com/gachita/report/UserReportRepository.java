package com.gachita.report;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findByReporterUserIdOrderByCreatedAtDescReportIdDesc(Long reporterId, Pageable pageable);
    boolean existsByReporterUserIdAndReportedUserUserIdAndReasonAndCreatedAtAfter(
            Long reporterId, Long reportedUserId, ReportReason reason, Instant since);
}
