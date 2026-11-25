CREATE TABLE IF NOT EXISTS chat_messages (
    message_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    text VARCHAR(500) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_chat_message_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id),
    CONSTRAINT fk_chat_message_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_chat_messages_room_id (room_id, message_id)
);
