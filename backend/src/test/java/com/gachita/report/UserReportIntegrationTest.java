package com.gachita.report;

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
class UserReportIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired UserReportRepository reports;

    @Test void acceptedReportIsVisibleOnlyInReportersHistoryAndDuplicateIsRejected() throws Exception {
        var reporter = users.save(new User("reporter-one", "신고자", "unused-test-hash"));
        var target = users.save(new User("reported-one", "신고 대상", "unused-test-hash"));
        var other = users.save(new User("reporter-other", "다른 사용자", "unused-test-hash"));
        String body = "{\"reportedUserId\":" + target.getUserId()
                + ",\"reason\":\"UNSAFE_BEHAVIOR\",\"description\":\"  운행 중 위험한 행동을 여러 번 했습니다.  \"}";

        mvc.perform(post("/api/v1/reports").with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.reportedUserId").value(target.getUserId()))
                .andExpect(jsonPath("$.data.reason").value("UNSAFE_BEHAVIOR"))
                .andExpect(jsonPath("$.data.description").value("운행 중 위험한 행동을 여러 번 했습니다."));
        assertThat(reports.count()).isEqualTo(1);
        mvc.perform(get("/api/v1/reports").with(user(reporter.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].reportedUsername").value("reported-one"));
        mvc.perform(get("/api/v1/reports").with(user(other.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get("/api/v1/reports").with(user(target.getUserId().toString())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(post("/api/v1/reports").with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("REPORT_RECENTLY_SUBMITTED"));
        assertThat(reports.count()).isEqualTo(1);
    }

    @Test void selfReportInvalidDescriptionMissingTargetAndMissingCsrfAreRejected() throws Exception {
        var reporter = users.save(new User("reporter-two", "신고자", "unused-test-hash"));
        var target = users.save(new User("reported-two", "신고 대상", "unused-test-hash"));
        String endpoint = "/api/v1/reports";
        String validBody = "{\"reportedUserId\":" + target.getUserId()
                + ",\"reason\":\"OTHER\",\"description\":\"약속 장소에서 문제가 발생했습니다.\"}";

        mvc.perform(post(endpoint).with(user(reporter.getUserId().toString())).contentType(MediaType.APPLICATION_JSON)
                .content(validBody)).andExpect(status().isForbidden());
        mvc.perform(post(endpoint).with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"reportedUserId\":" + reporter.getUserId()
                        + ",\"reason\":\"OTHER\",\"description\":\"약속 장소에서 문제가 발생했습니다.\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("SELF_REPORT"));
        mvc.perform(post(endpoint).with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"reportedUserId\":" + target.getUserId()
                        + ",\"reason\":\"OTHER\",\"description\":\"  짧아요  \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("REPORT_TOO_SHORT"));
        mvc.perform(post(endpoint).with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"reportedUserId\":9999999,\"reason\":\"OTHER\",\"description\":\"존재하지 않는 사용자에 대한 신고입니다.\"}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("USER_NOT_FOUND"));
        mvc.perform(post(endpoint).with(user(reporter.getUserId().toString())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"reportedUserId\":" + target.getUserId()
                        + ",\"reason\":\"OTHER\",\"description\":\"   \"}"))
                .andExpect(status().isBadRequest());
        assertThat(reports.count()).isZero();
    }
}
