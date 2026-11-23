package com.gachita.taxi;

import com.gachita.boarding.BoardingService;
import com.gachita.common.LocationInfo;
import com.gachita.participation.ParticipationService;
import com.gachita.participation.ParticipationStatus;
import com.gachita.room.RoomCreateRequest;
import com.gachita.room.RoomService;
import com.gachita.settlement.SettlementRepository;
import com.gachita.user.User;
import com.gachita.user.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class TaxiFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired RoomService rooms;
    @Autowired ParticipationService participations;
    @Autowired BoardingService boarding;
    @Autowired SettlementRepository settlements;

    ResultActions advance(String base, User caller, String expected) throws Exception {
        return mvc.perform(post(base + "/advance").with(user(caller.getUserId().toString())).with(csrf())
                .contentType("application/json").content("{\"expectedStatus\":\"" + expected + "\"}"));
    }

    @Test void confirmedMembersCanSeeRideOnlyHostCanAdvanceAndFinishForSettlement() throws Exception {
        User host = users.save(new User("taxi-host", "방장", "unused-test-hash"));
        User rider = users.save(new User("taxi-rider", "동승자", "unused-test-hash"));
        User outsider = users.save(new User("taxi-outsider", "다른회원", "unused-test-hash"));
        var room = rooms.createRoom(host.getUserId(), new RoomCreateRequest(
                new LocationInfo("수원역", 37.2657, 127.0007),
                new LocationInfo("강남역", 37.4979, 127.0276), Instant.now().plusSeconds(3600), 2));
        String base = "/api/v1/rooms/" + room.roomId() + "/taxi";
        advance(base, host, "RECRUITING")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("TAXI_STAGE_INVALID"));

        var request = participations.requestParticipation(room.roomId(), rider.getUserId());
        participations.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        var check = boarding.requestBoardingCheck(room.roomId(), host.getUserId());
        mvc.perform(get(base).with(user(outsider.getUserId().toString()))).andExpect(status().isForbidden());
        mvc.perform(get(base).with(user(rider.getUserId().toString()))).andExpect(status().isForbidden());
        advance(base, host, "BOARDING_CHECK")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("BOARDING_NOT_READY"));
        boarding.acceptBoardingCheck(room.roomId(), check.boardingCheckId(), rider.getUserId());

        mvc.perform(get(base).with(user(rider.getUserId().toString()))).andExpect(status().isOk());
        advance(base, rider, "BOARDING_CHECK")
                .andExpect(status().isForbidden());
        String previous = "BOARDING_CHECK";
        for (String stage : new String[]{"TAXI_CALLING", "TAXI_ASSIGNED", "IN_RIDE", "SETTLING"}) {
            advance(base, host, previous)
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value(stage));
            advance(base, host, previous)
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("TAXI_STAGE_CHANGED"));
            mvc.perform(get(base).with(user(rider.getUserId().toString())))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value(stage));
            previous = stage;
        }
        advance(base, host, "SETTLING")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("TAXI_STAGE_INVALID"));
        mvc.perform(post("/api/v1/rooms/" + room.roomId() + "/settlement")
                .with(user(host.getUserId().toString())).with(csrf())
                .contentType("application/json").content("{\"totalFare\":10003}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.farePerPerson").value(5001));
        assertThat(settlements.findByRoomRoomId(room.roomId())).isPresent();
    }
}
