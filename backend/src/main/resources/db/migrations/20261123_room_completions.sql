CREATE TABLE IF NOT EXISTS room_completions (
    room_id BIGINT NOT NULL PRIMARY KEY,
    completed_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_room_completion_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id)
);
