package com.gachita.chat;

import com.gachita.common.LocationInfo;
import com.gachita.participation.ParticipationService;
import com.gachita.participation.ParticipationStatus;
import com.gachita.room.RoomCreateRequest;
import com.gachita.room.RoomService;
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
class ChatIntegrationTest {
    @Autowired MockMvc mvc; @Autowired UserRepository users; @Autowired RoomService rooms;
    @Autowired ParticipationService participation; @Autowired ChatMessageRepository messages;

    @Test void approvedRidersExchangePersistedMessagesAndOthersAreDenied() throws Exception {
        var host = users.save(new User("chat-host", "방장", "unused-test-hash"));
        var rider = users.save(new User("chat-rider", "동승자", "unused-test-hash"));
        var pending = users.save(new User("chat-pending", "대기자", "unused-test-hash"));
        var outsider = users.save(new User("chat-outsider", "외부인", "unused-test-hash"));
        var room = rooms.createRoom(host.getUserId(), new RoomCreateRequest(new LocationInfo("수원", 37.26, 127.0),
                new LocationInfo("강남", 37.49, 127.02), Instant.now().plusSeconds(3600), 4));
        var approved = participation.requestParticipation(room.roomId(), rider.getUserId());
        participation.change(room.roomId(), approved.participationId(), host.getUserId(), ParticipationStatus.APPROVED);
        participation.requestParticipation(room.roomId(), pending.getUserId());
        String path = "/api/v1/rooms/" + room.roomId() + "/messages";

        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\" 안녕하세요 \"}")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.text").value("안녕하세요"))
                .andExpect(jsonPath("$.data.nickname").value("방장"));
        mvc.perform(get(path).with(user(rider.getUserId().toString()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].text").value("안녕하세요"));
        assertThat(messages.count()).isEqualTo(1);
        for (var denied : java.util.List.of(pending, outsider)) {
            mvc.perform(get(path).with(user(denied.getUserId().toString()))).andExpect(status().isForbidden());
            mvc.perform(post(path).with(user(denied.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"몰래 전송\"}")).andExpect(status().isForbidden());
        }
        mvc.perform(post(path).with(user(rider.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"네, 확인했습니다\"}")).andExpect(status().isCreated());
        var firstMessageId = messages.findTop100ByRoomRoomIdOrderByMessageIdDesc(room.roomId()).get(1).getMessageId();
        mvc.perform(get(path + "?after=" + firstMessageId).with(user(host.getUserId().toString()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].nickname").value("동승자"));
        participation.change(room.roomId(), approved.participationId(), rider.getUserId(), ParticipationStatus.CANCELLED);
        mvc.perform(get(path).with(user(rider.getUserId().toString()))).andExpect(status().isForbidden());
    }

    @Test void messageValidationAndRoomIsolation() throws Exception {
        var host = users.save(new User("chat-host-2", "방장", "unused-test-hash"));
        var room = rooms.createRoom(host.getUserId(), new RoomCreateRequest(new LocationInfo("수원", 37.26, 127.0),
                new LocationInfo("강남", 37.49, 127.02), Instant.now().plusSeconds(3600), 2));
        var other = rooms.createRoom(host.getUserId(), new RoomCreateRequest(new LocationInfo("안양", 37.39, 126.9),
                new LocationInfo("서울", 37.55, 127.03), Instant.now().plusSeconds(3600), 2));
        String path = "/api/v1/rooms/" + room.roomId() + "/messages";
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"   \"}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"" + "a".repeat(501) + "\"}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).with(user(host.getUserId().toString())).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"CSRF 없음\"}")).andExpect(status().isForbidden());
        mvc.perform(post(path).with(user(host.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"이 방의 메시지\"}")).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/rooms/" + other.roomId() + "/messages").with(user(host.getUserId().toString())))
                .andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get(path + "?after=-1").with(user(host.getUserId().toString()))).andExpect(status().isBadRequest());
    }
}
