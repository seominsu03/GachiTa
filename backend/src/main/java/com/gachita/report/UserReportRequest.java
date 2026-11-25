package com.gachita.report;

import jakarta.validation.constraints.*;

public record UserReportRequest(@NotNull Long reportedUserId, @NotNull ReportReason reason,
                                @NotBlank @Size(max = 1000) String description) {}
