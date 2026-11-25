package com.gachita.review;

import java.util.List;

public record RideReviewOverview(List<RideReviewResponse> received, List<RideReviewResponse> written,
                                 long receivedCount, Double averageRating) {}
