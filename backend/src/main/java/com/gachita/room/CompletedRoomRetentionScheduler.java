package com.gachita.room;

import java.time.Instant;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component @Profile("!test")
public class CompletedRoomRetentionScheduler {
    private final CompletedRoomRetentionService retention;
    public CompletedRoomRetentionScheduler(CompletedRoomRetentionService retention) { this.retention = retention; }

    @Scheduled(fixedDelay = 60000, initialDelay = 1000)
    public void archiveDue() { retention.archiveDue(Instant.now()); }
}
