package com.gachita.boarding;

import com.gachita.common.ApiException;
import com.gachita.participation.*;
import com.gachita.room.*;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class BoardingService {
    private final RoomRepository rooms;
    private final ParticipationRepository participations;
    private final BoardingCheckRepository checks;
    private final BoardingResponseRepository responses;
    private final EntityManager entityManager;

    public BoardingService(RoomRepository rooms, ParticipationRepository participations,
            BoardingCheckRepository checks, BoardingResponseRepository responses, EntityManager entityManager) {
        this.rooms = rooms; this.participations = participations;
        this.checks = checks; this.responses = responses; this.entityManager = entityManager;
    }

    private ApiException error(HttpStatus status, String code, String message) {
        return new ApiException(status, code, message);
    }

    private TaxiRoom lockRoom(Long roomId) {
        return rooms.findLockedById(roomId).filter(room -> room.getStatus() != RoomStatus.CANCELLED)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다."));
    }

    private BoardingCheckResponse snapshot(BoardingCheck check) {
        return BoardingCheckResponse.from(check,
                responses.findByBoardingCheckBoardingCheckIdOrderByBoardingResponseId(check.getBoardingCheckId()));
    }

    public BoardingCheckResponse requestBoardingCheck(Long roomId, Long userId) {
        var room = lockRoom(roomId);
        if (!room.getHost().getUserId().equals(userId))
            throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "방장만 탑승 확인을 요청할 수 있습니다.");
        if (room.getStatus() != RoomStatus.RECRUITING || !room.getDepartureAt().isAfter(Instant.now()))
            throw error(HttpStatus.CONFLICT, "ROOM_NOT_RECRUITING", "현재 탑승 확인을 요청할 수 없습니다.");
        var approved = participations.findByRoomRoomIdOrderByParticipationId(roomId).stream()
                .filter(member -> member.getStatus() == ParticipationStatus.APPROVED).toList();
        if (approved.isEmpty()) throw error(HttpStatus.CONFLICT, "NO_APPROVED_PARTICIPANTS", "승인된 동승자가 없습니다.");
        var now = Instant.now();
        var check = checks.save(new BoardingCheck(room, now, now.plusSeconds(60)));
        for (var member : approved) responses.save(new BoardingResponse(check, member.getUser()));
        room.setStatus(RoomStatus.BOARDING_CHECK);
        return snapshot(check);
    }

    public BoardingCheckResponse getCurrentBoardingCheck(Long roomId, Long userId) {
        var room = lockRoom(roomId);
        var check = checks.findFirstByRoomRoomIdOrderByBoardingCheckIdDesc(roomId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "BOARDING_CHECK_NOT_FOUND", "탑승 확인 요청이 없습니다."));
        if (!room.getHost().getUserId().equals(userId) &&
                participations.findByRoomRoomIdAndUserUserId(roomId, userId)
                        .filter(member -> member.getStatus() == ParticipationStatus.APPROVED ||
                                member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED).isEmpty())
            throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "탑승 확인을 볼 수 없습니다.");
        expire(check, room, Instant.now());
        return snapshot(check);
    }

    public BoardingCheckResponse acceptBoardingCheck(Long roomId, Long boardingCheckId, Long userId) {
        var room = lockRoom(roomId);
        var check = checks.findById(boardingCheckId)
                .filter(value -> value.getRoom().getRoomId().equals(roomId))
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "BOARDING_CHECK_NOT_FOUND", "탑승 확인 요청이 없습니다."));
        var response = responses.findByBoardingCheckBoardingCheckIdAndUserUserId(boardingCheckId, userId)
                .orElseThrow(() -> error(HttpStatus.FORBIDDEN, "FORBIDDEN", "탑승 확인 대상이 아닙니다."));
        var member = participations.findByRoomRoomIdAndUserUserId(roomId, userId)
                .orElseThrow(() -> error(HttpStatus.FORBIDDEN, "FORBIDDEN", "승인된 동승자가 아닙니다."));
        var now = Instant.now();
        expire(check, room, now);
        if (check.getStatus() != BoardingCheckStatus.PENDING || response.getStatus() != BoardingResponseStatus.PENDING ||
                member.getStatus() != ParticipationStatus.APPROVED)
            throw error(HttpStatus.CONFLICT, "BOARDING_ALREADY_PROCESSED", "탑승 확인 요청이 만료되었거나 이미 처리됐습니다.");
        response.record(BoardingResponseStatus.ACCEPTED, now);
        member.setStatus(ParticipationStatus.BOARDING_CONFIRMED);
        if (responses.findByBoardingCheckBoardingCheckIdOrderByBoardingResponseId(boardingCheckId).stream()
                .noneMatch(value -> value.getStatus() == BoardingResponseStatus.PENDING))
            check.setStatus(BoardingCheckStatus.COMPLETED);
        return snapshot(check);
    }

    private void expire(BoardingCheck check, TaxiRoom room, Instant now) {
        if (check.getStatus() != BoardingCheckStatus.PENDING || now.isBefore(check.getExpiresAt())) return;
        for (var response : responses.findByBoardingCheckBoardingCheckIdOrderByBoardingResponseId(check.getBoardingCheckId())) {
            if (response.getStatus() != BoardingResponseStatus.PENDING) continue;
            var member = participations.findByRoomRoomIdAndUserUserId(room.getRoomId(), response.getUser().getUserId()).orElse(null);
            if (member != null && member.getStatus() == ParticipationStatus.APPROVED) {
                member.setStatus(ParticipationStatus.TIMED_OUT);
                room.setParticipantCount(room.getParticipantCount() - 1);
                response.record(BoardingResponseStatus.TIMED_OUT, now);
            } else {
                response.record(BoardingResponseStatus.CANCELLED, now);
            }
        }
        check.setStatus(BoardingCheckStatus.EXPIRED);
        if (room.getParticipantCount() < room.getCapacity() && room.getDepartureAt().isAfter(now))
            room.setStatus(RoomStatus.RECRUITING);
    }

    public void expireDueChecks() {
        var now = Instant.now();
        List<BoardingCheck> due = checks.findByStatusAndExpiresAtLessThanEqual(BoardingCheckStatus.PENDING, now);
        for (var candidate : due) {
            var room = lockRoom(candidate.getRoom().getRoomId());
            var check = checks.findById(candidate.getBoardingCheckId()).orElse(null);
            if (check != null) {
                // The candidate was read before the room lock; refresh its status after acquiring it.
                entityManager.refresh(check);
                expire(check, room, now);
            }
        }
    }

    // Called after ParticipationService has locked the room and cancelled an approved member.
    public void markCancelled(Long roomId, Long userId) {
        var check = checks.findFirstByRoomRoomIdOrderByBoardingCheckIdDesc(roomId).orElse(null);
        if (check == null || check.getStatus() != BoardingCheckStatus.PENDING) return;
        var response = responses.findByBoardingCheckBoardingCheckIdAndUserUserId(check.getBoardingCheckId(), userId).orElse(null);
        if (response == null || response.getStatus() != BoardingResponseStatus.PENDING) return;
        response.record(BoardingResponseStatus.CANCELLED, Instant.now());
        if (responses.findByBoardingCheckBoardingCheckIdOrderByBoardingResponseId(check.getBoardingCheckId()).stream()
                .noneMatch(value -> value.getStatus() == BoardingResponseStatus.PENDING))
            check.setStatus(BoardingCheckStatus.COMPLETED);
        var room = check.getRoom();
        if (check.getStatus() == BoardingCheckStatus.COMPLETED &&
                room.getParticipantCount() < room.getCapacity() && room.getDepartureAt().isAfter(Instant.now()))
            room.setStatus(RoomStatus.RECRUITING);
    }
}
