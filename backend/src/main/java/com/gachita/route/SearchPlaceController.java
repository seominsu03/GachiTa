package com.gachita.route;
import com.fasterxml.jackson.databind.*;
import com.gachita.common.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/search-places")
public class SearchPlaceController {
 private final String key; private final ObjectMapper json; private final String baseUrl;
 public SearchPlaceController(@Value("${KAKAO_REST_API_KEY:}") String key,ObjectMapper json,@Value("${app.places.base-url:https://dapi.kakao.com/v2/local/}") String baseUrl){this.key=key;this.json=json;this.baseUrl=baseUrl;}
 public record Place(String name,String address,double latitude,double longitude) {}
 private JsonNode call(String suffix){
  if(key.isBlank())throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"PLACE_KEY_MISSING","서버의 카카오 REST API 키 설정을 확인해 주세요.");
  try{
   var request=HttpRequest.newBuilder(URI.create(baseUrl+suffix)).timeout(Duration.ofSeconds(8)).header("Authorization","KakaoAK "+key).GET().build();
   var response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build().send(request,HttpResponse.BodyHandlers.ofString());
   if(response.statusCode()!=200)throw new IllegalStateException(); return json.readTree(response.body());
  }catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiException(HttpStatus.BAD_GATEWAY,"PLACE_PROVIDER_ERROR","장소 검색이 중단됐어요.");}
   catch(Exception e){throw new ApiException(HttpStatus.BAD_GATEWAY,"PLACE_PROVIDER_ERROR","장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.");}
 }
 static boolean supported(String address){return address.startsWith("서울 ")||address.startsWith("서울특별시 ")||address.startsWith("경기 ")||address.startsWith("경기도 ");}
 @GetMapping public ApiResponse<List<Place>> search(@RequestParam String query){
  if(query.strip().length()<2||query.length()>100)throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_INPUT","장소를 2~100자로 입력해 주세요.");
  var result=call("search/keyword.json?query="+URLEncoder.encode(query.strip(),StandardCharsets.UTF_8)+"&rect=126.35,36.85,127.90,38.30&size=15");
  List<Place> places=new ArrayList<>();
  for(var item:result.path("documents"))if(supported(item.path("address_name").asText()))places.add(new Place(item.path("place_name").asText(),item.path("address_name").asText(),item.path("y").asDouble(),item.path("x").asDouble()));
  return ApiResponse.ok(places,"서울·경기 장소를 조회했어요.");
 }
 @GetMapping("/region") public ApiResponse<Boolean> region(@RequestParam double latitude,@RequestParam double longitude){
  if(!Double.isFinite(latitude)||!Double.isFinite(longitude)||latitude< -90||latitude>90||longitude< -180||longitude>180)throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_INPUT","좌표를 확인해 주세요.");
  var result=call("geo/coord2regioncode.json?x="+longitude+"&y="+latitude);
  boolean valid=false;for(var item:result.path("documents")){String region=item.path("region_1depth_name").asText();if(region.equals("서울특별시")||region.equals("경기도"))valid=true;}
  return ApiResponse.ok(valid,"서비스 지역을 확인했어요.");
 }
}
