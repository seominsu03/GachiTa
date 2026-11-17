package com.gachita.boarding;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BoardingExpiryScheduler {
    private final BoardingService boarding;
    public BoardingExpiryScheduler(BoardingService boarding) { this.boarding = boarding; }

    @Scheduled(fixedDelay = 1000)
    public void expireDueChecks() { boarding.expireDueChecks(); }
}
