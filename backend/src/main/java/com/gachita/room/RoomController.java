package com.gachita.room;
import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/rooms")
public class RoomController {
    private final RoomService rooms;
    public RoomController(RoomService rooms) { this.rooms = rooms; }
    @PostMapping public ResponseEntity<ApiResponse<RoomResponse>> createRoom(Principal principal, @Valid @RequestBody RoomCreateRequest input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(rooms.createRoom(Long.valueOf(principal.getName()), input), "택시방을 만들었어요."));
    }
    @GetMapping public ApiResponse<List<RoomResponse>> getRooms(
            @RequestParam(defaultValue = "") String destination,
            @RequestParam(defaultValue = "") String origin,
            @RequestParam(defaultValue = "ALL") String period) {
        return ApiResponse.ok(rooms.getRooms(origin, destination, period), "택시방을 조회했어요.");
    }
    @GetMapping("/mine") public ApiResponse<List<RoomResponse>> getMyRooms(Principal principal) { return ApiResponse.ok(rooms.getMyRooms(Long.valueOf(principal.getName())), "내 동승방을 조회했어요."); }
    @GetMapping("/{roomId}") public ApiResponse<RoomResponse> getRoomById(@PathVariable Long roomId) { return ApiResponse.ok(rooms.getRoomById(roomId), "택시방을 조회했어요."); }
    @PatchMapping("/{roomId}/capacity") public ApiResponse<RoomResponse> updateRoomCapacity(@PathVariable Long roomId, Principal principal, @Valid @RequestBody RoomCapacityRequest input) {
        return ApiResponse.ok(rooms.updateRoomCapacity(roomId, Long.valueOf(principal.getName()), input.capacity()), "모집 인원을 변경했어요.");
    }
    @DeleteMapping("/{roomId}") public ApiResponse<Void> deleteRoom(@PathVariable Long roomId, Principal principal) {
        rooms.deleteRoom(roomId, Long.valueOf(principal.getName()));
        return ApiResponse.ok(null, "택시방을 삭제했어요.");
    }
}
