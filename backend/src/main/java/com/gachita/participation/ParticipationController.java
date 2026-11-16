package com.gachita.participation;
import com.gachita.common.ApiResponse;
import java.security.Principal;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/rooms/{roomId}/participations")
public class ParticipationController {
    private final ParticipationService members;
    public ParticipationController(ParticipationService members) { this.members = members; }
    @GetMapping public ApiResponse<List<ParticipationResponse>> get(@PathVariable Long roomId, Principal principal) { return ApiResponse.ok(members.getParticipations(roomId, Long.valueOf(principal.getName())), "참여자를 조회했어요."); }
    @PostMapping public ResponseEntity<ApiResponse<ParticipationResponse>> request(@PathVariable Long roomId, Principal principal) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(members.requestParticipation(roomId, Long.valueOf(principal.getName())), "신청이 접수되었어요.")); }
    @PostMapping("/{participationId}/approve") public ApiResponse<ParticipationResponse> approve(@PathVariable Long roomId, @PathVariable Long participationId, Principal principal) { return change(roomId, participationId, principal, ParticipationStatus.APPROVED); }
    @PostMapping("/{participationId}/reject") public ApiResponse<ParticipationResponse> reject(@PathVariable Long roomId, @PathVariable Long participationId, Principal principal) { return change(roomId, participationId, principal, ParticipationStatus.REJECTED); }
    @PostMapping("/{participationId}/cancel") public ApiResponse<ParticipationResponse> cancel(@PathVariable Long roomId, @PathVariable Long participationId, Principal principal) { return change(roomId, participationId, principal, ParticipationStatus.CANCELLED); }
    private ApiResponse<ParticipationResponse> change(Long roomId, Long participationId, Principal principal, ParticipationStatus status) { return ApiResponse.ok(members.change(roomId, participationId, Long.valueOf(principal.getName()), status), "신청을 처리했어요."); }
}
