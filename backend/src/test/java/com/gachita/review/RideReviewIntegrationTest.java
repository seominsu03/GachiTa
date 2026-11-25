package com.gachita.review;

import com.gachita.common.LocationInfo;
import com.gachita.participation.ParticipationService;
import com.gachita.participation.ParticipationStatus;
import com.gachita.room.*;
import com.gachita.settlement.SettlementService;
import com.gachita.user.User;
import com.gachita.user.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class RideReviewIntegrationTest {
    @Autowired MockMvc mvc; @Autowired UserRepository users; @Autowired RoomService roomService;
    @Autowired RoomRepository rooms; @Autowired ParticipationService participation;
    @Autowired SettlementService settlements; @Autowired RideReviewRepository reviews;
    @Autowired CompletedRoomRetentionService retention;

    @Test void actualRidersCanReviewOnceAfterSettlementAndArchivedRoomKeepsReviews() throws Exception {
        var host = users.save(new User("review-host", "방장", "unused-test-hash"));
        var rider = users.save(new User("review-rider", "동승자", "unused-test-hash"));
        var outsider = users.save(new User("review-outsider", "외부인", "unused-test-hash"));
        var room = roomService.createRoom(host.getUserId(), new RoomCreateRequest(new LocationInfo("수원", 37.26, 127.0),
                new LocationInfo("강남", 37.49, 127.02), Instant.now().plusSeconds(3600), 2));
        var request = participation.requestParticipation(room.roomId(), rider.getUserId());
        participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        String path = "/api/v1/rooms/" + room.roomId() + "/reviews";
        String payload = "{\"revieweeUserId\":" + rider.getUserId() + ",\"rating\":5,\"comment\":\"좋은 동승이었어요\"}";
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("REVIEW_NOT_READY"));

        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.SETTLING); rooms.saveAndFlush(entity);
        settlements.createSettlement(room.roomId(), host.getUserId(), 4500);
        settlements.confirmReceipt(room.roomId(), host.getUserId(), rider.getUserId());
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.revieweeNickname").value("동승자"));
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("REVIEW_EXISTS"));
        mvc.perform(post(path).with(user(rider.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"revieweeUserId\":" + host.getUserId() + ",\"rating\":4}"))
                .andExpect(status().isCreated());
        assertThat(reviews.count()).isEqualTo(2);
        mvc.perform(get(path).with(user(rider.getUserId().toString()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
        mvc.perform(get("/api/v1/reviews/mine").with(user(rider.getUserId().toString()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.receivedCount").value(1))
                .andExpect(jsonPath("$.data.averageRating").value(5.0))
                .andExpect(jsonPath("$.data.written.length()").value(1));
        mvc.perform(get(path).with(user(outsider.getUserId().toString()))).andExpect(status().isForbidden());
        mvc.perform(post(path).with(user(outsider.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden());
        retention.archiveDue(Instant.now().plusSeconds(7 * 86400L));
        assertThat(rooms.findById(room.roomId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.CANCELLED);
        mvc.perform(get(path).with(user(host.getUserId().toString()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test void invalidTargetsRatingsAndCsrfAreRejected() throws Exception {
        var host = users.save(new User("review-host-2", "방장", "unused-test-hash"));
        var rider = users.save(new User("review-rider-2", "동승자", "unused-test-hash"));
        var outsider = users.save(new User("review-outsider-2", "외부인", "unused-test-hash"));
        var room = roomService.createRoom(host.getUserId(), new RoomCreateRequest(new LocationInfo("수원", 37.26, 127.0),
                new LocationInfo("강남", 37.49, 127.02), Instant.now().plusSeconds(3600), 2));
        var request = participation.requestParticipation(room.roomId(), rider.getUserId());
        participation.change(room.roomId(), request.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        var entity = rooms.findById(room.roomId()).orElseThrow(); entity.setStatus(RoomStatus.SETTLING); rooms.saveAndFlush(entity);
        settlements.createSettlement(room.roomId(), host.getUserId(), 4500);
        settlements.confirmReceipt(room.roomId(), host.getUserId(), rider.getUserId());
        String path = "/api/v1/rooms/" + room.roomId() + "/reviews";
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"revieweeUserId\":" + host.getUserId() + ",\"rating\":5}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("SELF_REVIEW"));
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"revieweeUserId\":" + outsider.getUserId() + ",\"rating\":5}"))
                .andExpect(status().isForbidden());
        for (int rating : new int[]{0, 6}) mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"revieweeUserId\":" + rider.getUserId() + ",\"rating\":" + rating + "}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post(path).with(user(host.getUserId().toString())).contentType(MediaType.APPLICATION_JSON)
                .content("{\"revieweeUserId\":" + rider.getUserId() + ",\"rating\":5}"))
                .andExpect(status().isForbidden());
        assertThat(reviews.count()).isZero();
    }
}
