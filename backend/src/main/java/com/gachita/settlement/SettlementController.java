package com.gachita.settlement;
import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import java.security.Principal;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/rooms/{roomId}/settlement")
public class SettlementController {
    private final SettlementService settlements;
    public SettlementController(SettlementService settlements) { this.settlements = settlements; }
    @GetMapping public ApiResponse<SettlementResponse> get(@PathVariable Long roomId, Principal principal) { return ApiResponse.ok(settlements.getSettlement(roomId, Long.valueOf(principal.getName())), "정산을 조회했어요."); }
    @PostMapping public ResponseEntity<ApiResponse<SettlementResponse>> create(@PathVariable Long roomId, Principal principal, @Valid @RequestBody SettlementRequest input) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(settlements.createSettlement(roomId, Long.valueOf(principal.getName()), input.totalFare()), "정산 금액을 계산했어요.")); }
    public record ReceiptRequest(@AssertTrue boolean received) {}
    @PatchMapping("/receipts/{userId}") public ApiResponse<SettlementResponse> confirm(@PathVariable Long roomId, @PathVariable Long userId, Principal principal, @Valid @RequestBody ReceiptRequest input) { return ApiResponse.ok(settlements.confirmReceipt(roomId, Long.valueOf(principal.getName()), userId), "수령을 확인했어요."); }
}
