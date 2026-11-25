package com.gachita.chat;

import com.gachita.common.ApiResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/rooms/{roomId}/messages")
public class ChatController {
    private final ChatService chat;
    public ChatController(ChatService chat) { this.chat = chat; }
    @GetMapping public ApiResponse<List<ChatMessageResponse>> get(@PathVariable Long roomId, @RequestParam(defaultValue = "0") Long after, Principal principal) {
        return ApiResponse.ok(chat.getMessages(roomId, Long.valueOf(principal.getName()), after), "메시지를 조회했어요.");
    }
    @PostMapping public ResponseEntity<ApiResponse<ChatMessageResponse>> send(@PathVariable Long roomId, @Valid @RequestBody ChatMessageRequest input, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(chat.send(roomId, Long.valueOf(principal.getName()), input.text()), "메시지를 보냈어요."));
    }
}
