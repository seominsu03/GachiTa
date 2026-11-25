package com.gachita.friend;

import com.gachita.user.User;
import com.gachita.user.UserRepository;
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
class FriendshipIntegrationTest {
    @Autowired MockMvc mvc; @Autowired UserRepository users; @Autowired FriendshipRepository friendships;

    @Test void requestAcceptRemoveAndSearchAreSharedBetweenAccounts() throws Exception {
        var sender = users.save(new User("friend-alice", "앨리스", "unused-test-hash"));
        var receiver = users.save(new User("friend-bob", "밥", "unused-test-hash"));
        mvc.perform(get("/api/v1/friends/search").param("query", "friend-b").with(user(sender.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].username").value("friend-bob"))
                .andExpect(jsonPath("$.data[0].passwordHash").doesNotExist());
        mvc.perform(post("/api/v1/friends/requests").with(user(sender.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"userId\":" + receiver.getUserId() + "}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.status").value("PENDING"));
        var friendship = friendships.findByLowerUserUserIdAndHigherUserUserId(sender.getUserId(), receiver.getUserId()).orElseThrow();
        mvc.perform(get("/api/v1/friends").with(user(receiver.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.incoming[0].user.username").value("friend-alice"));
        mvc.perform(post("/api/v1/friends/requests/" + friendship.getFriendshipId() + "/accept")
                .with(user(receiver.getUserId().toString())).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("ACCEPTED"));
        mvc.perform(get("/api/v1/friends").with(user(sender.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.friends[0].user.username").value("friend-bob"));
        mvc.perform(delete("/api/v1/friends/" + friendship.getFriendshipId()).with(user(sender.getUserId().toString())).with(csrf()))
                .andExpect(status().isOk());
        assertThat(friendships.count()).isZero();
    }

    @Test void duplicateSelfAndUnrelatedActionsAreRejectedAndPendingCanBeRejected() throws Exception {
        var first = users.save(new User("friend-first", "첫째", "unused-test-hash"));
        var second = users.save(new User("friend-second", "둘째", "unused-test-hash"));
        var outsider = users.save(new User("friend-outsider", "외부", "unused-test-hash"));
        String path = "/api/v1/friends/requests";
        mvc.perform(post(path).with(user(first.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":" + first.getUserId() + "}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("SELF_FRIEND"));
        mvc.perform(post(path).with(user(first.getUserId().toString())).contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":" + second.getUserId() + "}"))
                .andExpect(status().isForbidden());
        mvc.perform(post(path).with(user(first.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":" + second.getUserId() + "}"))
                .andExpect(status().isCreated());
        var friendship = friendships.findByLowerUserUserIdAndHigherUserUserId(first.getUserId(), second.getUserId()).orElseThrow();
        mvc.perform(post(path).with(user(second.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":" + first.getUserId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("FRIENDSHIP_EXISTS"));
        mvc.perform(post(path + "/" + friendship.getFriendshipId() + "/accept").with(user(first.getUserId().toString())).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/v1/friends/" + friendship.getFriendshipId()).with(user(outsider.getUserId().toString())).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/friends/" + friendship.getFriendshipId()).with(user(second.getUserId().toString())).with(csrf()))
                .andExpect(status().isOk());
        assertThat(friendships.count()).isZero();
        mvc.perform(post(path).with(user(second.getUserId().toString())).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":" + first.getUserId() + "}"))
                .andExpect(status().isCreated());
    }
}
