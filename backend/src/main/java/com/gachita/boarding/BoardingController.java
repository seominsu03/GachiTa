package com.gachita.boarding;

import com.gachita.common.ApiResponse;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/rooms/{roomId}/boarding-checks")
public class BoardingController {
    private final BoardingService boarding;
    public BoardingController(BoardingService boarding) { this.boarding = boarding; }

    @PostMapping
    public ResponseEntity<ApiResponse<BoardingCheckResponse>> requestBoardingCheck(
            @PathVariable Long roomId, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                boarding.requestBoardingCheck(roomId, Long.valueOf(principal.getName())), "탑승 확인을 요청했어요."));
    }

    @GetMapping("/current")
    public ApiResponse<BoardingCheckResponse> getCurrentBoardingCheck(@PathVariable Long roomId, Principal principal) {
        return ApiResponse.ok(boarding.getCurrentBoardingCheck(roomId, Long.valueOf(principal.getName())), "탑승 확인을 조회했어요.");
    }

    @PostMapping("/{boardingCheckId}/accept")
    public ApiResponse<BoardingCheckResponse> acceptBoardingCheck(@PathVariable Long roomId,
            @PathVariable Long boardingCheckId, Principal principal) {
        return ApiResponse.ok(boarding.acceptBoardingCheck(roomId, boardingCheckId,
                Long.valueOf(principal.getName())), "탑승을 확인했어요.");
    }
}
