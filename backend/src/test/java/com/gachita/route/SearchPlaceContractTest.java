package com.gachita.route;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachita.common.ApiException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class SearchPlaceContractTest {
 @Test void keywordAndRegionProviderContractsAreParsedAndOutsideLocationsExcluded()throws Exception{
  var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/",exchange->{
   String response=exchange.getRequestURI().getPath().contains("regioncode")?"{\"documents\":[{\"region_1depth_name\":\"서울특별시\"}]}":"{\"documents\":[{\"place_name\":\"서울역\",\"address_name\":\"서울 용산구\",\"x\":\"126.97\",\"y\":\"37.55\"},{\"place_name\":\"수원역\",\"address_name\":\"경기 수원시\",\"x\":\"127.0\",\"y\":\"37.26\"},{\"place_name\":\"부산역\",\"address_name\":\"부산 동구\",\"x\":\"129.04\",\"y\":\"35.11\"}]}";
   byte[] bytes=response.getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
  });server.start();
  try{var controller=new SearchPlaceController("test-key",new ObjectMapper(),"http://127.0.0.1:"+server.getAddress().getPort()+"/");
   assertThat(controller.search("기차역").data()).extracting(SearchPlaceController.Place::name).containsExactly("서울역","수원역");
   assertThat(controller.region(37.5,127).data()).isTrue();
   assertThatThrownBy(()->controller.search("a")).isInstanceOf(ApiException.class);
   assertThatThrownBy(()->controller.region(91,127)).isInstanceOf(ApiException.class);
  }finally{server.stop(0);}
 }
 @Test void missingApiKeyProducesExplicitConfigurationError(){
  var controller=new SearchPlaceController("",new ObjectMapper(),"http://127.0.0.1/");
  assertThatThrownBy(()->controller.search("서울역")).isInstanceOf(ApiException.class).hasMessageContaining("API 키");
  assertThat(SearchPlaceController.supported("인천 남동구")).isFalse();
 }
}
