package com.gachita.room;
import jakarta.validation.constraints.*;
public record RoomCapacityRequest(@Min(2) @Max(4) int capacity) {}
