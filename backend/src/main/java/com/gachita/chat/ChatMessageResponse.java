package com.gachita.chat;

import java.time.Instant;

public record ChatMessageResponse(Long messageId, Long roomId, Long userId, String nickname, String text, Instant createdAt) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(message.getMessageId(), message.getRoom().getRoomId(), message.getUser().getUserId(),
                message.getUser().getNickname(), message.getText(), message.getCreatedAt());
    }
}
