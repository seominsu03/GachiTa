package com.gachita.report;

import com.gachita.common.ApiException;
import com.gachita.user.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class UserReportService {
    private final UserReportRepository reports;
    private final UserRepository users;
    public UserReportService(UserReportRepository reports, UserRepository users) { this.reports = reports; this.users = users; }
    @Transactional(readOnly = true) public List<UserReportResponse> mine(Long reporterId) {
        return reports.findByReporterUserIdOrderByCreatedAtDescReportIdDesc(reporterId, PageRequest.of(0, 100))
                .stream().map(UserReportResponse::from).toList();
    }
    public UserReportResponse create(Long reporterId, UserReportRequest input) {
        if (reporterId.equals(input.reportedUserId()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_REPORT", "본인은 신고할 수 없어요.");
        var description = input.description().strip();
        if (description.length() < 10)
            throw new ApiException(HttpStatus.BAD_REQUEST, "REPORT_TOO_SHORT", "신고 내용을 10자 이상 적어 주세요.");
        var reported = users.findById(input.reportedUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "신고 대상을 찾을 수 없어요."));
        if (reports.existsByReporterUserIdAndReportedUserUserIdAndReasonAndCreatedAtAfter(
                reporterId, reported.getUserId(), input.reason(), Instant.now().minus(1, ChronoUnit.DAYS)))
            throw new ApiException(HttpStatus.CONFLICT, "REPORT_RECENTLY_SUBMITTED", "같은 대상과 사유의 신고를 최근에 접수했어요.");
        return UserReportResponse.from(reports.saveAndFlush(new UserReport(
                users.getReferenceById(reporterId), reported, input.reason(), description)));
    }
}
