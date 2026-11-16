package com.gachita.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachita.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired ObjectMapper json;

    private static final String SIGNUP = "{\"username\":\"Rider_01\",\"nickname\":\"같이타\",\"password\":\"Password123!\"}";
    private static final String LOGIN = "{\"username\":\"rider_01\",\"password\":\"Password123!\"}";

    @BeforeEach void reset() { users.deleteAll(); }

    void signup() throws Exception {
        mvc.perform(post("/api/v1/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(SIGNUP))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").isNumber()).andExpect(jsonPath("$.data.username").value("rider_01"))
                .andExpect(jsonPath("$.data.nickname").value("같이타"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist()).andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test void signupStoresHashAndRejectsCaseInsensitiveDuplicates() throws Exception {
        signup();
        var user = users.findByUsername("rider_01").orElseThrow();
        assertThat(user.getPasswordHash()).isNotEqualTo("Password123!");
        assertThat(passwords.matches("Password123!", user.getPasswordHash())).isTrue();
        mvc.perform(post("/api/v1/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(SIGNUP))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("USERNAME_TAKEN"));
        assertThat(users.count()).isEqualTo(1);
    }

    @Test void invalidInputAndCredentialsUseCommonErrors() throws Exception {
        mvc.perform(post("/api/v1/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"a\",\"nickname\":\"n\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
        signup();
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN.replace("Password123!", "WrongPassword!")))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test void sessionAuthenticatesProfileAndLogoutInvalidatesIt() throws Exception {
        signup();
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
        var login = mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session).isNotNull();
        mvc.perform(get("/api/v1/users/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.username").value("rider_01"));
        mvc.perform(post("/api/v1/auth/logout").session(session).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true));
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test void realCsrfHandshakeRotatesSessionAndTokenOnLogin() throws Exception {
        var handshake = mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) handshake.getRequest().getSession(false);
        String token = json.readTree(handshake.getResponse().getContentAsString()).at("/data/token").asText();
        String sessionId = session.getId();
        mvc.perform(post("/api/v1/auth/signup").session(session).header("X-CSRF-TOKEN", token)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNUP)).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/auth/login").session(session).header("X-CSRF-TOKEN", token)
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN)).andExpect(status().isOk());
        assertThat(session.getId()).isNotEqualTo(sessionId);
        mvc.perform(post("/api/v1/auth/logout").session(session).header("X-CSRF-TOKEN", token))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error.code").value("CSRF_INVALID"));
        var renewed = mvc.perform(get("/api/v1/auth/csrf").session(session)).andReturn();
        String renewedToken = json.readTree(renewed.getResponse().getContentAsString()).at("/data/token").asText();
        mvc.perform(post("/api/v1/auth/logout").session(session).header("X-CSRF-TOKEN", renewedToken)).andExpect(status().isOk());
    }

    @Test void csrfAndUntrustedOriginsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(SIGNUP))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error.code").value("CSRF_INVALID"));
        mvc.perform(options("/api/v1/auth/login").header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test void signupPersistsNameAndPhoneWithoutExposingCredentials() throws Exception {
        String input = SIGNUP.substring(0, SIGNUP.length() - 1) + ",\"name\":\"홍길동\",\"phoneNumber\":\"010-1234-5678\"}";
        mvc.perform(post("/api/v1/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(input))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.name").value("홍길동"))
                .andExpect(jsonPath("$.data.phoneNumber").value("01012345678")).andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        var user = users.findByUsername("rider_01").orElseThrow();
        assertThat(user.getName()).isEqualTo("홍길동"); assertThat(user.getPhoneNumber()).isEqualTo("01012345678");
    }
}
