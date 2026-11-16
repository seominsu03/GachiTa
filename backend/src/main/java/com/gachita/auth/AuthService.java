package com.gachita.auth;

import com.gachita.common.ApiException;
import com.gachita.user.*;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder passwords) {
        this.users = users;
        this.passwords = passwords;
        this.dummyHash = passwords.encode("invalid-account-placeholder");
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String username = request.username().toLowerCase(Locale.ROOT);
        if (users.existsByUsername(username)) { throw duplicate(); }
        String nickname = request.nickname().strip();
        if (nickname.length() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "닉네임은 2~20자로 입력해 주세요.");
        }
        try {
            User user = new User(username, nickname, passwords.encode(request.password()));
            if (request.name() != null && request.name().strip().length() < 2) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "이름을 확인해 주세요.");
            }
            user.setSignupDetails(request.name() == null ? null : request.name().strip(),
                    request.phoneNumber() == null ? null : request.phoneNumber().replace("-", ""));
            return UserResponse.from(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            throw duplicate();
        }
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        User user = users.findByUsername(request.username().toLowerCase(Locale.ROOT)).orElse(null);
        boolean matches = passwords.matches(request.password(), user == null ? dummyHash : user.getPasswordHash());
        if (user == null || !matches) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return UserResponse.from(user);
    }

    private ApiException duplicate() {
        return new ApiException(HttpStatus.CONFLICT, "USERNAME_TAKEN", "이미 사용 중인 아이디입니다.");
    }
}
