package com.gachita.common;
import jakarta.validation.constraints.*;
public record LocationInfo(@NotBlank @Size(max = 100) String name,
        @DecimalMin("-90") @DecimalMax("90") double latitude,
        @DecimalMin("-180") @DecimalMax("180") double longitude) {}
