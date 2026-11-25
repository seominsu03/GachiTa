CREATE TABLE IF NOT EXISTS user_reports (
    report_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL,
    reported_user_id BIGINT NOT NULL,
    reason VARCHAR(24) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    INDEX ix_user_reports_reporter_created (reporter_user_id, created_at),
    CONSTRAINT fk_user_report_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_report_reported FOREIGN KEY (reported_user_id) REFERENCES users(user_id)
);
