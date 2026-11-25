package com.gachita.chat;

import com.gachita.room.TaxiRoom;
import com.gachita.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "chat_messages", indexes = @Index(name = "idx_chat_messages_room_id", columnList = "room_id,message_id"))
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "message_id") private Long messageId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "room_id") private TaxiRoom room;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false, length = 500) private String text;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected ChatMessage() {}
    public ChatMessage(TaxiRoom room, User user, String text) { this.room = room; this.user = user; this.text = text; createdAt = Instant.now(); }
    public Long getMessageId() { return messageId; }
    public TaxiRoom getRoom() { return room; }
    public User getUser() { return user; }
    public String getText() { return text; }
    public Instant getCreatedAt() { return createdAt; }
}
