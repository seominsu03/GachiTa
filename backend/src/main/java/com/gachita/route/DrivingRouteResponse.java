package com.gachita.route;

import java.util.List;

public record DrivingRouteResponse(int durationSeconds, int distanceMeters, List<RoutePoint> path) {
    public record RoutePoint(double latitude, double longitude) {}
}
