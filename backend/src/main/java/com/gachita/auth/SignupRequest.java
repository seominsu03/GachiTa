package com.gachita.auth;

import jakarta.validation.constraints.*;

public record SignupRequest(
        @NotBlank(message = "아이디를 입력해 주세요.")
        @Pattern(regexp = "[a-zA-Z0-9_]{4,20}", message = "아이디는 영문, 숫자, 밑줄 4~20자로 입력해 주세요.") String username,
        @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(min = 2, max = 20, message = "닉네임은 2~20자로 입력해 주세요.") String nickname,
        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Pattern(regexp = "[\\x21-\\x7E]{8,64}", message = "비밀번호는 공백 없는 영문, 숫자, 기호 8~64자로 입력해 주세요.") String password,
        @Size(min = 2, max = 50, message = "이름은 2~50자로 입력해 주세요.") String name,
        @Pattern(regexp = "01[016789]-?[0-9]{3,4}-?[0-9]{4}", message = "휴대폰 번호를 확인해 주세요.") String phoneNumber
) {
    @Override public String toString() { return "SignupRequest[credentials=REDACTED]"; }
}
