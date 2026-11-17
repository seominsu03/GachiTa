package com.gachita.route;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachita.common.ApiException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DrivingRouteService {
    private static final String BASE_URL = "https://apis-navi.kakaomobility.com/v1/directions";
    private static final int MAX_POINTS = 20000;
    private final ObjectMapper json;
    private final String apiKey;

    public DrivingRouteService(ObjectMapper json, @Value("${KAKAO_REST_API_KEY:}") String apiKey) {
        this.json = json;
        this.apiKey = apiKey.trim();
    }

    public DrivingRouteResponse findRoute(double originLatitude, double originLongitude,
                                          double destinationLatitude, double destinationLongitude) {
        validateCoordinates(originLatitude, originLongitude);
        validateCoordinates(destinationLatitude, destinationLongitude);
        if (originLatitude == destinationLatitude && originLongitude == destinationLongitude)
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_LOCATION", "출발지와 목적지를 다르게 선택해 주세요.");
        if (apiKey.isBlank())
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "ROUTE_KEY_MISSING", "서버에 길찾기 키가 설정되지 않았어요.");

        String url = BASE_URL + "?origin=" + originLongitude + "," + originLatitude
                + "&destination=" + destinationLongitude + "," + destinationLatitude + "&summary=false";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "KakaoAK " + apiKey)
                .header("Accept", "application/json")
                .GET().build();
        try {
            HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 429)
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "ROUTE_QUOTA_EXCEEDED", "길찾기 요청 한도를 확인해 주세요.");
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_PROVIDER_ERROR", "길찾기 서비스에 연결하지 못했어요.");
            return parseResponse(json.readTree(response.body()));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_PROVIDER_ERROR", "길찾기 요청이 중단됐어요.");
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_PROVIDER_ERROR", "길찾기 서비스에 연결하지 못했어요.");
        }
    }

    private static void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90 ||
                !Double.isFinite(longitude) || longitude < -180 || longitude > 180)
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES", "올바른 위치 좌표가 아니에요.");
    }

    private static DrivingRouteResponse parseResponse(JsonNode body) {
        JsonNode route = body.path("routes").path(0);
        if (route.isMissingNode() || !route.path("result_code").isNumber())
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_INVALID_RESPONSE", "길찾기 결과를 읽지 못했어요.");
        if (route.path("result_code").asInt() != 0)
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "ROUTE_NOT_FOUND", "이 위치 사이의 자동차 경로를 찾지 못했어요. 핀을 다시 조정해 주세요.");
        JsonNode summary = route.path("summary");
        if (!summary.path("duration").isNumber() || !summary.path("distance").isNumber())
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_INVALID_RESPONSE", "길찾기 결과를 읽지 못했어요.");

        List<DrivingRouteResponse.RoutePoint> path = new ArrayList<>();
        for (JsonNode section : route.path("sections")) {
            for (JsonNode road : section.path("roads")) {
                JsonNode vertices = road.path("vertexes");
                if (!vertices.isArray() || vertices.size() % 2 != 0)
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_INVALID_RESPONSE", "경로 좌표를 읽지 못했어요.");
                for (int i = 0; i < vertices.size(); i += 2) {
                    if (!vertices.get(i).isNumber() || !vertices.get(i + 1).isNumber())
                        throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_INVALID_RESPONSE", "경로 좌표를 읽지 못했어요.");
                    double longitude = vertices.get(i).asDouble();
                    double latitude = vertices.get(i + 1).asDouble();
                    validateCoordinates(latitude, longitude);
                    if (path.size() >= MAX_POINTS)
                        throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_TOO_LONG", "경로가 너무 길어 지도에 표시할 수 없어요.");
                    path.add(new DrivingRouteResponse.RoutePoint(latitude, longitude));
                }
            }
        }
        if (path.size() < 2)
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ROUTE_INVALID_RESPONSE", "표시할 도로 경로가 없어요.");
        return new DrivingRouteResponse(summary.path("duration").asInt(), summary.path("distance").asInt(), path);
    }
}
