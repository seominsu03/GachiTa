package com.gachita.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "아이디를 입력해 주세요.") @Size(max = 20) String username,
        @NotBlank(message = "비밀번호를 입력해 주세요.") @Size(max = 64) String password
) {
    @Override public String toString() { return "LoginRequest[credentials=REDACTED]"; }
}
