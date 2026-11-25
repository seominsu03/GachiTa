package com.gachita.room;

import com.gachita.common.ApiResponse;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/history")
public class RideHistoryController {
    private final RideHistoryService histories;
    public RideHistoryController(RideHistoryService histories) { this.histories = histories; }
    @GetMapping public ApiResponse<List<RideHistoryResponse>> list(Principal principal) {
        return ApiResponse.ok(histories.list(Long.valueOf(principal.getName())), "내 동승 이력을 조회했어요.");
    }
    @GetMapping("/{roomId}") public ApiResponse<RideHistoryResponse> get(@PathVariable Long roomId, Principal principal) {
        return ApiResponse.ok(histories.get(roomId, Long.valueOf(principal.getName())), "동승 이력을 조회했어요.");
    }
    @DeleteMapping("/{roomId}") public ApiResponse<Void> hide(@PathVariable Long roomId, Principal principal) {
        histories.hide(roomId, Long.valueOf(principal.getName()));
        return ApiResponse.ok(null, "내 목록에서 동승 이력을 삭제했어요.");
    }
}
