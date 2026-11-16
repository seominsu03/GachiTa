package com.gachita.auth;

import com.gachita.common.ApiResponse;
import com.gachita.user.UserResponse;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final SecurityContextRepository contexts;
    private final CsrfTokenRepository csrfTokens;

    public AuthController(AuthService auth, SecurityContextRepository contexts, CsrfTokenRepository csrfTokens) {
        this.auth = auth;
        this.contexts = contexts;
        this.csrfTokens = csrfTokens;
    }

    public record CsrfResponse(String token, String headerName) {}

    @GetMapping("/csrf")
    public ApiResponse<CsrfResponse> csrf(CsrfToken token) {
        return ApiResponse.ok(new CsrfResponse(token.getToken(), token.getHeaderName()), "요청을 준비했습니다.");
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(auth.signup(request), "회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        UserResponse user = auth.login(body);
        request.getSession(true);
        request.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                user.userId().toString(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        csrfTokens.saveToken(null, request, response);
        return ApiResponse.ok(user, "로그인되었습니다.");
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        var session = request.getSession(false);
        if (session != null) { session.invalidate(); }
        SecurityContextHolder.clearContext();
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true).secure(request.isSecure()).sameSite("Lax").path("/").maxAge(0).build().toString());
        return ApiResponse.ok(null, "로그아웃되었습니다.");
    }
}
