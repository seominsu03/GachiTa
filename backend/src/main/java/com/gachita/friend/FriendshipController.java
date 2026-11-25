package com.gachita.friend;

import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/friends")
public class FriendshipController {
    private final FriendshipService service;
    public FriendshipController(FriendshipService service) { this.service = service; }
    @GetMapping public ApiResponse<FriendshipOverview> mine(Principal principal) {
        return ApiResponse.ok(service.mine(Long.valueOf(principal.getName())), "친구 목록을 조회했어요.");
    }
    @GetMapping("/search") public ApiResponse<List<FriendCandidate>> search(@RequestParam String query, Principal principal) {
        return ApiResponse.ok(service.search(Long.valueOf(principal.getName()), query), "사용자를 검색했어요.");
    }
    @GetMapping("/users/{userId}") public ApiResponse<FriendCandidate> profile(@PathVariable Long userId) {
        return ApiResponse.ok(service.profile(userId), "사용자를 조회했어요.");
    }
    @PostMapping("/requests") public ResponseEntity<ApiResponse<FriendshipResponse>> request(@Valid @RequestBody FriendRequest body, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.request(Long.valueOf(principal.getName()), body.userId()), "친구 요청을 보냈어요."));
    }
    @PostMapping("/requests/{friendshipId}/accept") public ApiResponse<FriendshipResponse> accept(@PathVariable Long friendshipId, Principal principal) {
        return ApiResponse.ok(service.accept(Long.valueOf(principal.getName()), friendshipId), "친구 요청을 수락했어요.");
    }
    @DeleteMapping("/{friendshipId}") public ApiResponse<Void> remove(@PathVariable Long friendshipId, Principal principal) {
        service.remove(Long.valueOf(principal.getName()), friendshipId);
        return ApiResponse.ok(null, "친구 관계를 정리했어요.");
    }
}
