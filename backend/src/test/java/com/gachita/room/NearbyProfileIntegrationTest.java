package com.gachita.room;
import com.gachita.common.LocationInfo;
import com.gachita.participation.*;
import com.gachita.review.*;
import com.gachita.settlement.*;
import com.gachita.user.*;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class NearbyProfileIntegrationTest {
 @Autowired MockMvc mvc; @Autowired UserRepository users; @Autowired RoomRepository rooms;
 @Autowired RoomNearbySearch nearby; @Autowired RoomService service; @Autowired ParticipationService participation;
 @Autowired SettlementService settlements; @Autowired RideReviewRepository reviews;
 TaxiRoom room(User host,double latitude,double longitude){return rooms.saveAndFlush(new TaxiRoom(host,new RoomCreateRequest(new LocationInfo("출발",latitude,longitude),new LocationInfo("도착",37.5,127.0),Instant.now().plusSeconds(3600),3)));}
 @Test void allRadiiUseRealDistanceAndCoordinatesBeforeHundredLimit(){
  var host=users.save(new User("near-host","방장","hash"));
  var inside=room(host,37.5,127.0);
  for(int i=0;i<101;i++)room(host,37.6,127.0);
  assertThat(nearby.search("","","ALL",37.5,127.0,100,"origin",true)).extracting(RoomResponse::roomId).containsExactly(inside.getRoomId());
  room(host,37.5+200.0/111195,127.0);room(host,37.5+400.0/111195,127.0);room(host,37.5+800.0/111195,127.0);
  int expected=1;for(int radius:List.of(100,300,500,1000))assertThat(nearby.search("","","ALL",37.5,127.0,radius,"origin",true)).hasSize(expected++);
  assertThat(nearby.search("","","ALL",37.5,127.0,100,"destination",true)).hasSize(100);
 }
 @Test void invalidRadiusAndPartialCoordinatesFailAndOutsideMetroIsExcluded()throws Exception{
  var host=users.save(new User("region-host","방장","hash"));room(host,35.1,129.0);room(host,37.5,127.0);
  assertThat(nearby.search("","","ALL",null,null,null,"origin",true)).hasSize(1);
  for(String query:List.of("latitude=37.5&longitude=127&radiusMeters=200","latitude=37.5&radiusMeters=100","latitude=999&longitude=127&radiusMeters=100","latitude=37.5&longitude=127&radiusMeters=100&nearTarget=invalid"))
   mvc.perform(get("/api/v1/rooms?"+query).with(user(host.getUserId().toString()))).andExpect(status().isBadRequest());
 }
 @Test void applicantSummaryIsHostOnlyAndContainsNoPrivateOrRouteFields()throws Exception{
  var host=users.save(new User("profile-host","방장","hash"));var rider=users.save(new User("profile-rider","신청자","hash"));var outsider=users.save(new User("profile-outside","외부인","hash"));
  var old=room(host,37.5,127.0);var joined=participation.requestParticipation(old.getRoomId(),rider.getUserId());participation.change(old.getRoomId(),joined.participationId(),host.getUserId(),ParticipationStatus.APPROVED);
  old.setStatus(RoomStatus.SETTLING);rooms.saveAndFlush(old);settlements.createSettlement(old.getRoomId(),host.getUserId(),10000);settlements.confirmReceipt(old.getRoomId(),host.getUserId(),rider.getUserId());
  reviews.saveAndFlush(new RideReview(old,host,rider,4,"친절해요"));
  var current=room(host,37.5,127.0);participation.requestParticipation(current.getRoomId(),rider.getUserId());
  var path="/api/v1/rooms/"+current.getRoomId()+"/applicants/"+rider.getUserId()+"/profile";
  mvc.perform(get(path).with(user(host.getUserId().toString()))).andExpect(status().isOk()).andExpect(jsonPath("$.data.averageRating").value(4)).andExpect(jsonPath("$.data.rideCount").value(1)).andExpect(jsonPath("$.data.reviewCount").value(1)).andExpect(jsonPath("$.data.reviews[0].comment").value("친절해요")).andExpect(jsonPath("$.data.reviews[0].roomId").doesNotExist()).andExpect(jsonPath("$.data.phoneNumber").doesNotExist()).andExpect(jsonPath("$.data.username").doesNotExist());
  mvc.perform(get(path).with(user(rider.getUserId().toString()))).andExpect(status().isForbidden());
  mvc.perform(get(path).with(user(outsider.getUserId().toString()))).andExpect(status().isForbidden());
  mvc.perform(get(path)).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/v1/rooms/"+current.getRoomId()+"/applicants/"+outsider.getUserId()+"/profile").with(user(host.getUserId().toString()))).andExpect(status().isNotFound());
 }
 @Test void unratedApplicantHasZeroTripsAndNullRating()throws Exception{
  var host=users.save(new User("empty-host","방장","hash"));var rider=users.save(new User("empty-rider","신청자","hash"));var current=room(host,37.5,127.0);participation.requestParticipation(current.getRoomId(),rider.getUserId());
  mvc.perform(get("/api/v1/rooms/"+current.getRoomId()+"/applicants/"+rider.getUserId()+"/profile").with(user(host.getUserId().toString()))).andExpect(status().isOk()).andExpect(jsonPath("$.data.rideCount").value(0)).andExpect(jsonPath("$.data.reviewCount").value(0)).andExpect(jsonPath("$.data.reviews").isEmpty());
 }
}
