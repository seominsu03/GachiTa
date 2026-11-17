package com.gachita.room;

import com.gachita.common.LocationInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record RoomLocationsRequest(@NotNull @Valid LocationInfo origin,
                                   @NotNull @Valid LocationInfo destination) {}
