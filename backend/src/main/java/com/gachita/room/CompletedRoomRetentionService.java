package com.gachita.room;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompletedRoomRetentionService {
    private final RoomCompletionRepository completions;
    private final RoomService rooms;

    public CompletedRoomRetentionService(RoomCompletionRepository completions, RoomService rooms) {
        this.completions = completions;
        this.rooms = rooms;
    }

    @Transactional
    public void archiveDue(Instant now) {
        // Older completed rooms have no completion timestamp. Start their seven-day period now.
        for (var room : completions.findCompletedWithoutTimestamp(PageRequest.of(0, 1000)))
            completions.save(new RoomCompletion(room, now));
        completions.flush();
        var cutoff = now.minus(7, ChronoUnit.DAYS);
        for (var roomId : completions.findDueRoomIds(cutoff, PageRequest.of(0, 1000)))
            rooms.archiveCompletedRoom(roomId, cutoff);
    }
}
