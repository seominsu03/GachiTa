package com.gachita.boarding;

import java.time.Instant;
import java.util.List;

public record BoardingCheckResponse(Long boardingCheckId, Long roomId, Instant requestedAt,
        Instant expiresAt, Instant serverNow, BoardingCheckStatus status, List<MemberResponse> responses) {
    public record MemberResponse(Long userId, BoardingResponseStatus status, Instant respondedAt) {
        static MemberResponse from(BoardingResponse response) {
            return new MemberResponse(response.getUser().getUserId(), response.getStatus(), response.getRespondedAt());
        }
    }
    static BoardingCheckResponse from(BoardingCheck check, List<BoardingResponse> responses) {
        return new BoardingCheckResponse(check.getBoardingCheckId(), check.getRoom().getRoomId(),
                check.getRequestedAt(), check.getExpiresAt(), Instant.now(), check.getStatus(),
                responses.stream().map(MemberResponse::from).toList());
    }
}
