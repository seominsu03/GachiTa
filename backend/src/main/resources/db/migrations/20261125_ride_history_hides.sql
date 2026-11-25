CREATE TABLE IF NOT EXISTS ride_history_hides (
    hide_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    hidden_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_ride_history_hide_room_user UNIQUE (room_id, user_id),
    CONSTRAINT fk_ride_history_hide_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id),
    CONSTRAINT fk_ride_history_hide_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
