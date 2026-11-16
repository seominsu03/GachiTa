package com.gachita.user;

import com.gachita.common.ApiResponse;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService users;
    public UserController(UserService users) { this.users = users; }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyProfile(Principal principal) {
        return ApiResponse.ok(users.getMyProfile(Long.valueOf(principal.getName())), "내 정보를 조회했습니다.");
    }
}
