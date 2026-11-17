CREATE TABLE IF NOT EXISTS boarding_checks (
    boarding_check_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    requested_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    status VARCHAR(30) NOT NULL,
    INDEX idx_boarding_check_expiry (status, expires_at),
    INDEX idx_boarding_check_room (room_id, boarding_check_id),
    CONSTRAINT fk_boarding_check_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id)
);

CREATE TABLE IF NOT EXISTS boarding_responses (
    boarding_response_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    boarding_check_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    responded_at DATETIME(6),
    CONSTRAINT uk_boarding_response_check_user UNIQUE (boarding_check_id, user_id),
    CONSTRAINT fk_boarding_response_check FOREIGN KEY (boarding_check_id) REFERENCES boarding_checks(boarding_check_id),
    CONSTRAINT fk_boarding_response_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
