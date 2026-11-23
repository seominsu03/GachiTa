package com.gachita.taxi;

import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/taxi")
public class TaxiController {
    private final TaxiService taxi;

    public TaxiController(TaxiService taxi) { this.taxi = taxi; }

    @GetMapping
    public ApiResponse<TaxiStatusResponse> getStatus(@PathVariable Long roomId, Principal principal) {
        return ApiResponse.ok(taxi.getStatus(roomId, Long.valueOf(principal.getName())), "가상 택시 상태를 조회했어요.");
    }

    @PostMapping("/advance")
    public ApiResponse<TaxiStatusResponse> advance(@PathVariable Long roomId, Principal principal,
            @Valid @RequestBody TaxiAdvanceRequest input) {
        return ApiResponse.ok(taxi.advance(roomId, Long.valueOf(principal.getName()), input.expectedStatus()), "가상 택시 상태를 변경했어요.");
    }
}
