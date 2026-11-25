package com.gachita.report;

import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/reports")
public class UserReportController {
    private final UserReportService service;
    public UserReportController(UserReportService service) { this.service = service; }
    @GetMapping public ApiResponse<List<UserReportResponse>> mine(Principal principal) {
        return ApiResponse.ok(service.mine(Long.valueOf(principal.getName())), "내 신고 내역을 조회했어요.");
    }
    @PostMapping public ResponseEntity<ApiResponse<UserReportResponse>> create(@Valid @RequestBody UserReportRequest input, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(Long.valueOf(principal.getName()), input), "신고를 접수했어요."));
    }
}
