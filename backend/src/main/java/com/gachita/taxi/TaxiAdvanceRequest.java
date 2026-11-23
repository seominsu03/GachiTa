package com.gachita.taxi;

import com.gachita.room.RoomStatus;
import jakarta.validation.constraints.NotNull;

public record TaxiAdvanceRequest(@NotNull RoomStatus expectedStatus) {}
