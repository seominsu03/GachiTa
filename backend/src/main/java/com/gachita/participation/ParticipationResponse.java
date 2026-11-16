package com.gachita.participation;
public record ParticipationResponse(Long participationId, Long roomId, Long userId, String nickname, ParticipationStatus status) {
    public static ParticipationResponse from(Participation member) { return new ParticipationResponse(member.getParticipationId(), member.getRoom().getRoomId(), member.getUser().getUserId(), member.getUser().getNickname(), member.getStatus()); }
}
