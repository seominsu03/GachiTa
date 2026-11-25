package com.gachita.chat;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findTop100ByRoomRoomIdOrderByMessageIdDesc(Long roomId);
    List<ChatMessage> findTop100ByRoomRoomIdAndMessageIdGreaterThanOrderByMessageIdAsc(Long roomId, Long after);
}
