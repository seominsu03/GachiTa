CREATE TABLE IF NOT EXISTS ride_reviews (
    review_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    reviewer_user_id BIGINT NOT NULL,
    reviewee_user_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_ride_review_once UNIQUE (room_id, reviewer_user_id, reviewee_user_id),
    CONSTRAINT fk_ride_review_room FOREIGN KEY (room_id) REFERENCES taxi_rooms(room_id),
    CONSTRAINT fk_ride_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_ride_review_reviewee FOREIGN KEY (reviewee_user_id) REFERENCES users(user_id)
);
