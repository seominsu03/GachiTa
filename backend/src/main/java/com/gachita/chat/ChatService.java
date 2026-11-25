package com.gachita.chat;

import com.gachita.common.ApiException;
import com.gachita.participation.ParticipationRepository;
import com.gachita.participation.ParticipationStatus;
import com.gachita.room.RoomRepository;
import com.gachita.room.RoomStatus;
import com.gachita.room.TaxiRoom;
import com.gachita.user.UserRepository;
import java.util.Collections;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class ChatService {
    private final RoomRepository rooms; private final ParticipationRepository members; private final UserRepository users; private final ChatMessageRepository messages;
    public ChatService(RoomRepository rooms, ParticipationRepository members, UserRepository users, ChatMessageRepository messages) {
        this.rooms = rooms; this.members = members; this.users = users; this.messages = messages;
    }
    private TaxiRoom accessibleRoom(Long roomId, Long userId) {
        var room = rooms.findById(roomId).filter(value -> value.getStatus() != RoomStatus.CANCELLED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "채팅방이 없습니다."));
        if (!room.getHost().getUserId().equals(userId)) {
            var member = members.findByRoomRoomIdAndUserUserId(roomId, userId).orElse(null);
            if (member == null || (member.getStatus() != ParticipationStatus.APPROVED && member.getStatus() != ParticipationStatus.BOARDING_CONFIRMED))
                throw new ApiException(HttpStatus.FORBIDDEN, "CHAT_FORBIDDEN", "승인된 동승자만 채팅할 수 있습니다.");
        }
        return room;
    }
    @Transactional(readOnly = true) public List<ChatMessageResponse> getMessages(Long roomId, Long userId, Long after) {
        accessibleRoom(roomId, userId);
        if (after < 0) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "올바른 메시지 번호를 입력해 주세요.");
        if (after > 0) return messages.findTop100ByRoomRoomIdAndMessageIdGreaterThanOrderByMessageIdAsc(roomId, after)
                .stream().map(ChatMessageResponse::from).toList();
        var latest = messages.findTop100ByRoomRoomIdOrderByMessageIdDesc(roomId);
        Collections.reverse(latest);
        return latest.stream().map(ChatMessageResponse::from).toList();
    }
    public ChatMessageResponse send(Long roomId, Long userId, String input) {
        var room = accessibleRoom(roomId, userId);
        var text = input.strip();
        if (text.isEmpty() || text.length() > 500) throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "메시지는 1~500자로 입력해 주세요.");
        var user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "다시 로그인해 주세요."));
        return ChatMessageResponse.from(messages.saveAndFlush(new ChatMessage(room, user, text)));
    }
}
