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
    @GetMapping public ApiResponse<List<RoomResponse>> getRooms(@RequestParam(defaultValue = "") String destination) { return ApiResponse.ok(rooms.getRooms(destination), "택시방을 조회했어요."); }
    @GetMapping("/mine") public ApiResponse<List<RoomResponse>> getMyRooms(Principal principal) { return ApiResponse.ok(rooms.getMyRooms(Long.valueOf(principal.getName())), "내 동승방을 조회했어요."); }
    @GetMapping("/{roomId}") public ApiResponse<RoomResponse> getRoomById(@PathVariable Long roomId) { return ApiResponse.ok(rooms.getRoomById(roomId), "택시방을 조회했어요."); }
}
