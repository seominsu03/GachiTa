package com.gachita.settlement;
import jakarta.validation.constraints.*;
public record SettlementRequest(@Min(1) @Max(10000000) int totalFare) {}
