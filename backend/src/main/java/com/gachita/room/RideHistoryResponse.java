package com.gachita.room;

import com.gachita.settlement.SettlementResponse;
import java.time.Instant;

public record RideHistoryResponse(RoomResponse room, boolean archived, Instant completedAt, SettlementResponse settlement) {}
