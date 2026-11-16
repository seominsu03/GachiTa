CREATE TABLE IF NOT EXISTS taxi_rooms (
    room_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    host_user_id BIGINT NOT NULL,
    origin_name VARCHAR(100) NOT NULL, origin_latitude DOUBLE NOT NULL, origin_longitude DOUBLE NOT NULL,
    destination_name VARCHAR(100) NOT NULL, destination_latitude DOUBLE NOT NULL, destination_longitude DOUBLE NOT NULL,
    departure_at DATETIME(6) NOT NULL, capacity INT NOT NULL, participant_count INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    CONSTRAINT fk_room_host FOREIGN KEY (host_user_id) REFERENCES users(user_id)
);
CREATE TABLE IF NOT EXISTS participations (
    participation_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL, user_id BIGINT NOT NULL, status VARCHAR(30) NOT NULL,
    CONSTRAINT uk_participation_room_user UNIQUE (room_id, user_id),
    CONSTRAINT fk_participation_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id),
    CONSTRAINT fk_participation_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE IF NOT EXISTS settlements (
    settlement_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL UNIQUE, total_fare INT NOT NULL, fare_per_person INT NOT NULL,
    remainder_fare INT NOT NULL, participant_count INT NOT NULL,
    CONSTRAINT fk_settlement_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id)
);
CREATE TABLE IF NOT EXISTS settlement_receipts (
    receipt_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    settlement_id BIGINT NOT NULL, user_id BIGINT NOT NULL, received BOOLEAN NOT NULL,
    CONSTRAINT uk_receipt_settlement_user UNIQUE (settlement_id, user_id),
    CONSTRAINT fk_receipt_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(settlement_id),
    CONSTRAINT fk_receipt_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
