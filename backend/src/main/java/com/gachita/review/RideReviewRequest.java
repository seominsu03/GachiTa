package com.gachita.review;

import jakarta.validation.constraints.*;

public record RideReviewRequest(@NotNull Long revieweeUserId, @NotNull @Min(1) @Max(5) Integer rating,
                                @Size(max = 500) String comment) {}
