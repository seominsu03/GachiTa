package com.gachita.review;

import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class RideReviewController {
    private final RideReviewService reviews;
    public RideReviewController(RideReviewService reviews) { this.reviews = reviews; }
    @PostMapping("/api/v1/rooms/{roomId}/reviews")
    public ResponseEntity<ApiResponse<RideReviewResponse>> create(@PathVariable Long roomId, @Valid @RequestBody RideReviewRequest input, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(reviews.create(roomId, Long.valueOf(principal.getName()), input), "후기를 작성했어요."));
    }
    @GetMapping("/api/v1/rooms/{roomId}/reviews")
    public ApiResponse<List<RideReviewResponse>> forRoom(@PathVariable Long roomId, Principal principal) {
        return ApiResponse.ok(reviews.forRoom(roomId, Long.valueOf(principal.getName())), "동승 후기를 조회했어요.");
    }
    @GetMapping("/api/v1/reviews/mine")
    public ApiResponse<RideReviewOverview> mine(Principal principal) {
        return ApiResponse.ok(reviews.mine(Long.valueOf(principal.getName())), "내 후기를 조회했어요.");
    }
}
