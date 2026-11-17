package com.gachita.route;

import com.gachita.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/routes")
public class DrivingRouteController {
    private final DrivingRouteService routes;

    public DrivingRouteController(DrivingRouteService routes) { this.routes = routes; }

    @GetMapping("/driving")
    public ApiResponse<DrivingRouteResponse> driving(
            @RequestParam double originLatitude, @RequestParam double originLongitude,
            @RequestParam double destinationLatitude, @RequestParam double destinationLongitude) {
        return ApiResponse.ok(routes.findRoute(originLatitude, originLongitude, destinationLatitude, destinationLongitude),
                "현재 기준 자동차 경로를 조회했어요.");
    }
}
