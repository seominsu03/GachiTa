CREATE TABLE IF NOT EXISTS friendships (
    friendship_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    lower_user_id BIGINT NOT NULL,
    higher_user_id BIGINT NOT NULL,
    requester_user_id BIGINT NOT NULL,
    status VARCHAR(12) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    accepted_at DATETIME(6),
    CONSTRAINT uk_friendship_pair UNIQUE (lower_user_id, higher_user_id),
    CONSTRAINT fk_friendship_lower FOREIGN KEY (lower_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_friendship_higher FOREIGN KEY (higher_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_user_id) REFERENCES users(user_id)
);
