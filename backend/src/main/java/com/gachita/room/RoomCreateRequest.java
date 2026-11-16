package com.gachita.room;
import com.gachita.common.LocationInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record RoomCreateRequest(@NotNull @Valid LocationInfo origin, @NotNull @Valid LocationInfo destination,
        @NotNull @Future Instant departureAt, @Min(2) @Max(4) int capacity) {}
