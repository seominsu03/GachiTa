CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    phone_number VARCHAR(20),
    PRIMARY KEY (user_id),
    CONSTRAINT uk_users_username UNIQUE (username)
);
