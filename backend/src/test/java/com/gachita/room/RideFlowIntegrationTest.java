package com.gachita.room;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachita.common.*;
import com.gachita.participation.*;
import com.gachita.settlement.SettlementRepository;
import com.gachita.user.*;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class RideFlowIntegrationTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper json;
    @Autowired RoomService roomService; @Autowired RoomRepository rooms;
    @Autowired ParticipationService participation; @Autowired ParticipationRepository members;
    @Autowired SettlementRepository settlements; @Autowired UserRepository users;
    User host; User first; User second;
    @BeforeEach void setup() {
        cleanup();
        host = users.save(new User("host", "방장", "unused-test-hash"));
        first = users.save(new User("first", "하루", "unused-test-hash"));
        second = users.save(new User("second", "민트", "unused-test-hash"));
    }
    @AfterEach void cleanup() { settlements.deleteAll(); members.deleteAll(); rooms.deleteAll(); users.deleteAll(); }
    RoomCreateRequest input(int capacity) { return new RoomCreateRequest(new LocationInfo("수원역", 37.2657, 127.0007), new LocationInfo("강남역", 37.4979, 127.0276), Instant.now().plusSeconds(86400), capacity); }
    RoomResponse create(int capacity) { return roomService.createRoom(host.getUserId(), input(capacity)); }
    String as(User user) { return user.getUserId().toString(); }

    @Test void roomCreationSearchAndPrivacy() throws Exception {
        mvc.perform(post("/api/v1/rooms").with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input(4))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.hostUserId").value(host.getUserId()))
                .andExpect(jsonPath("$.data.participantCount").value(1)).andExpect(jsonPath("$.data.host.phoneNumber").doesNotExist());
        mvc.perform(get("/api/v1/rooms?destination=강남").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1));
        mvc.perform(get("/api/v1/rooms?destination=없는역").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(post("/api/v1/rooms").with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input(5))))
                .andExpect(status().isBadRequest());
    }

    @Test void hostOnlyApprovalAndCapacityLimit() throws Exception {
        var room = create(2);
        var a = participation.requestParticipation(room.roomId(), first.getUserId());
        var b = participation.requestParticipation(room.roomId(), second.getUserId());
        String base = "/api/v1/rooms/" + room.roomId() + "/participations/";
        mvc.perform(post(base + a.participationId() + "/approve").with(user(as(second))).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post(base + a.participationId() + "/approve").with(user(as(host))).with(csrf())).andExpect(status().isOk());
        mvc.perform(post(base + a.participationId() + "/approve").with(user(as(host))).with(csrf())).andExpect(status().isConflict());
        mvc.perform(post(base + b.participationId() + "/approve").with(user(as(host))).with(csrf())).andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("ROOM_FULL"));
        assertThat(roomService.getRoomById(room.roomId()).participantCount()).isEqualTo(2);
        assertThat(participation.getParticipations(room.roomId(), first.getUserId())).extracting(ParticipationResponse::userId).doesNotContain(second.getUserId());
    }

    @Test void cancellationUpdatesCountButBoardingAcceptancePreventsCancellation() throws Exception {
        var room = create(3); var a = participation.requestParticipation(room.roomId(), first.getUserId());
        participation.change(room.roomId(), a.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        participation.change(room.roomId(), a.participationId(), first.getUserId(), ParticipationStatus.CANCELLED);
        assertThat(roomService.getRoomById(room.roomId()).participantCount()).isEqualTo(1);
        var retry = participation.requestParticipation(room.roomId(), first.getUserId());
        participation.change(room.roomId(), retry.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        var entity = members.findById(retry.participationId()).orElseThrow(); entity.setStatus(ParticipationStatus.BOARDING_CONFIRMED); members.saveAndFlush(entity);
        mvc.perform(post("/api/v1/rooms/" + room.roomId() + "/participations/" + retry.participationId() + "/cancel").with(user(as(first))).with(csrf()))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("CANCEL_NOT_ALLOWED"));
    }

    @Test void settlementEnforcesRideStageHostAuthorityAndIntegerRemainder() throws Exception {
        var room = create(3);
        for (var user : List.of(first, second)) { var member = participation.requestParticipation(room.roomId(), user.getUserId()); participation.change(room.roomId(), member.participationId(), host.getUserId(), ParticipationStatus.APPROVED); }
        String path = "/api/v1/rooms/" + room.roomId() + "/settlement";
        mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":10003}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("SETTLEMENT_NOT_READY"));
        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.SETTLING); rooms.saveAndFlush(entity);
        mvc.perform(post(path).with(user(as(first))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":10003}"))
                .andExpect(status().isForbidden());
        mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":10003}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.farePerPerson").value(3334)).andExpect(jsonPath("$.data.remainderFare").value(1));
        mvc.perform(patch(path + "/receipts/" + first.getUserId()).with(user(as(first))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isForbidden());
        for (var user : List.of(first, second)) mvc.perform(patch(path + "/receipts/" + user.getUserId()).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isOk());
        assertThat(roomService.getRoomById(room.roomId()).status()).isEqualTo(RoomStatus.COMPLETED);
        mvc.perform(get(path).with(user(as(second)))).andExpect(status().isOk()).andExpect(jsonPath("$.data.receipts[2].received").value(true));
    }

    @Test void simultaneousApprovalsCannotExceedCapacity() throws Exception {
        var room = create(2); var a = participation.requestParticipation(room.roomId(), first.getUserId()); var b = participation.requestParticipation(room.roomId(), second.getUserId());
        var start = new CountDownLatch(1); var executor = Executors.newFixedThreadPool(2);
        try {
            var tasks = List.of(a, b).stream().map(member -> executor.submit(() -> {
                start.await();
                try { participation.change(room.roomId(), member.participationId(), host.getUserId(), ParticipationStatus.APPROVED); return true; }
                catch (ApiException exception) { assertThat(exception.getCode()).isEqualTo("ROOM_FULL"); return false; }
            })).toList();
            start.countDown();
            int success = 0; for (var task : tasks) if (task.get(10, TimeUnit.SECONDS)) success++;
            assertThat(success).isEqualTo(1); assertThat(roomService.getRoomById(room.roomId()).participantCount()).isEqualTo(2);
        } finally { executor.shutdownNow(); }
    }

    @Test void myRoomsRemainAvailableAfterRecruitmentAndAreScopedToSessionUser() throws Exception {
        var room = create(3);
        var request = participation.requestParticipation(room.roomId(), first.getUserId());
        var ownRoom = roomService.createRoom(second.getUserId(), input(2));
        mvc.perform(get("/api/v1/rooms/mine")).andExpect(status().isUnauthorized());
        // A query parameter cannot impersonate the host.
        mvc.perform(get("/api/v1/rooms/mine?userId=" + host.getUserId()).with(user(as(second))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].roomId").value(ownRoom.roomId()));
        mvc.perform(get("/api/v1/rooms/mine").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].roomId").value(room.roomId()));
        participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.COMPLETED); rooms.saveAndFlush(entity);
        mvc.perform(get("/api/v1/rooms").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1));
        for (var viewer : List.of(host, first)) mvc.perform(get("/api/v1/rooms/mine").with(user(as(viewer))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.data[0].host.phoneNumber").doesNotExist());
    }

    @Test void cancelledRejectedAndTimedOutRequestsAreExcludedFromMyRooms() throws Exception {
        var room = create(3);
        var request = participation.requestParticipation(room.roomId(), first.getUserId());
        participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.REJECTED);
        mvc.perform(get("/api/v1/rooms/mine").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        request = participation.requestParticipation(room.roomId(), first.getUserId());
        participation.change(room.roomId(), request.participationId(), first.getUserId(), ParticipationStatus.CANCELLED);
        mvc.perform(get("/api/v1/rooms/mine").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        request = participation.requestParticipation(room.roomId(), first.getUserId());
        var entity = members.findById(request.participationId()).orElseThrow(); entity.setStatus(ParticipationStatus.TIMED_OUT); members.saveAndFlush(entity);
        mvc.perform(get("/api/v1/rooms/mine").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(post("/api/v1/rooms/" + room.roomId() + "/participations").with(user(as(first))).with(csrf()))
                .andExpect(status().isConflict());
    }


    @Test void settlementRejectsFractionalAndOutOfRangeAmountsAndAcceptsMaximumFare() throws Exception {
        var room = create(2);
        var request = participation.requestParticipation(room.roomId(), first.getUserId());
        participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.SETTLING); rooms.saveAndFlush(entity);
        String path = "/api/v1/rooms/" + room.roomId() + "/settlement";
        for (String amount : List.of("0", "-1", "10000001", "1.5")) {
            mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":" + amount + "}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
        }
        assertThat(settlements.findByRoomRoomId(room.roomId())).isEmpty();
        mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":10000000}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.totalFare").value(10000000))
                .andExpect(jsonPath("$.data.farePerPerson").value(5000000)).andExpect(jsonPath("$.data.remainderFare").value(0));
        // Fractional capacities must not silently truncate to an allowed integer either.
        String fractionalCapacity = json.writeValueAsString(input(3)).replace("\"capacity\":3", "\"capacity\":3.5");
        mvc.perform(post("/api/v1/rooms").with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(fractionalCapacity))
                .andExpect(status().isBadRequest());
    }

    @Test void onlyAllReceiptsCompleteSettlementAndOutsidersCannotAccessIt() throws Exception {
        var room = create(3);
        for (var passenger : List.of(first, second)) {
            var request = participation.requestParticipation(room.roomId(), passenger.getUserId());
            participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        }
        var outsider = users.save(new User("outsider", "다른회원", "unused-test-hash"));
        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.SETTLING); rooms.saveAndFlush(entity);
        String path = "/api/v1/rooms/" + room.roomId() + "/settlement";
        mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":10003}"))
                .andExpect(status().isCreated());
        mvc.perform(get(path).with(user(as(outsider)))).andExpect(status().isForbidden());
        mvc.perform(patch(path + "/receipts/" + first.getUserId()).with(user(as(outsider))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch(path + "/receipts/" + outsider.getUserId()).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch(path + "/receipts/" + first.getUserId()).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":false}"))
                .andExpect(status().isBadRequest());
        for (int retry = 0; retry < 2; retry++) mvc.perform(patch(path + "/receipts/" + first.getUserId()).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isOk());
        assertThat(roomService.getRoomById(room.roomId()).status()).isEqualTo(RoomStatus.SETTLING);
        mvc.perform(post(path).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"totalFare\":20000}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("SETTLEMENT_EXISTS"));
        mvc.perform(get(path).with(user(as(second)))).andExpect(jsonPath("$.data.totalFare").value(10003));
        mvc.perform(patch(path + "/receipts/" + second.getUserId()).with(user(as(host))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"received\":true}"))
                .andExpect(status().isOk());
        assertThat(roomService.getRoomById(room.roomId()).status()).isEqualTo(RoomStatus.COMPLETED);
    }

    @Test void cannotCancelAnotherUsersRequestOrApproveItInAnotherRoom() throws Exception {
        var room = create(3); var otherRoom = create(2);
        var request = participation.requestParticipation(room.roomId(), first.getUserId());
        String path = "/api/v1/rooms/" + room.roomId() + "/participations/" + request.participationId();
        for (var other : List.of(host, second)) mvc.perform(post(path + "/cancel").with(user(as(other))).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/rooms/" + otherRoom.roomId() + "/participations/" + request.participationId() + "/approve").with(user(as(host))).with(csrf()))
                .andExpect(status().isNotFound());
        assertThat(members.findById(request.participationId()).orElseThrow().getStatus()).isEqualTo(ParticipationStatus.PENDING);
        assertThat(roomService.getRoomById(room.roomId()).participantCount()).isEqualTo(1);
    }


    private Instant departure(LocalTime time) {
        return LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(2).atTime(time).atZone(ZoneId.of("Asia/Seoul")).toInstant();
    }
    private RoomCreateRequest searchInput(String origin, Instant departureAt) {
        return new RoomCreateRequest(new LocationInfo(origin, 37.2657, 127.0007),
                new LocationInfo("강남역", 37.4979, 127.0276), departureAt, 4);
    }
    @Test void searchFiltersOriginAndPeriodBeforeTakingHundredRows() throws Exception {
        var fixtures = new ArrayList<TaxiRoom>();
        for (int i = 0; i < 100; i++) fixtures.add(new TaxiRoom(host, searchInput("서울역", departure(LocalTime.of(8, 0)).plusSeconds(i))));
        rooms.saveAllAndFlush(fixtures);
        var target = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.of(19, 0))));
        mvc.perform(get("/api/v1/rooms").param("destination", "강남").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(100));
        // The only match is the 101st room in the old destination-only result set.
        mvc.perform(get("/api/v1/rooms").param("destination", "강남").param("origin", " 수원 ").param("period", "EVENING").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].roomId").value(target.roomId()));
        mvc.perform(get("/api/v1/rooms").param("destination", "강남").param("origin", "수원").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].roomId").value(target.roomId()));
        mvc.perform(get("/api/v1/rooms").param("destination", "강남").param("period", "EVENING").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].roomId").value(target.roomId()));
    }
    @Test void searchUsesKoreanMidnightNoonAndEveningBoundaries() throws Exception {
        var midnight = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.MIDNIGHT)));
        var beforeNoon = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.of(11, 59, 59))));
        var noon = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.NOON)));
        var beforeEvening = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.of(17, 59, 59))));
        var evening = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.of(18, 0))));
        var beforeMidnight = roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.of(23, 59, 59))));
        for (var entry : java.util.Map.of("MORNING", List.of(midnight.roomId(), beforeNoon.roomId()),
                "AFTERNOON", List.of(noon.roomId(), beforeEvening.roomId()),
                "EVENING", List.of(evening.roomId(), beforeMidnight.roomId())).entrySet()) {
            var response = mvc.perform(get("/api/v1/rooms").param("origin", "수원").param("period", entry.getKey()).with(user(as(first))))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
            var actual = new ArrayList<Long>();
            json.readTree(response).get("data").forEach(room -> actual.add(room.get("roomId").asLong()));
            assertThat(actual).containsExactlyElementsOf(entry.getValue());
        }
    }
    @Test void searchRejectsUnknownPeriodAndTreatsNamesAsLiteralSubstrings() throws Exception {
        var target = roomService.createRoom(host.getUserId(), searchInput("수원%_역", departure(LocalTime.NOON)));
        roomService.createRoom(host.getUserId(), searchInput("수원역", departure(LocalTime.NOON)));
        mvc.perform(get("/api/v1/rooms").param("period", "invalid").with(user(as(first))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
        mvc.perform(get("/api/v1/rooms").param("origin", "%_").param("period", "ALL").with(user(as(first))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].roomId").value(target.roomId()));
    }

}
