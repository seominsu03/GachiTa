package com.gachita.settlement;
import com.gachita.common.ApiException;
import com.gachita.participation.*;
import com.gachita.room.*;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class SettlementService {
    private final RoomRepository rooms; private final ParticipationRepository members; private final SettlementRepository settlements;
    private final RoomCompletionRepository completions;
    public SettlementService(RoomRepository rooms, ParticipationRepository members, SettlementRepository settlements, RoomCompletionRepository completions) {
        this.rooms = rooms; this.members = members; this.settlements = settlements; this.completions = completions;
    }
    private ApiException error(HttpStatus status, String code, String message) { return new ApiException(status, code, message); }
    private TaxiRoom findRoom(Long roomId, boolean lock) { return (lock ? rooms.findLockedById(roomId) : rooms.findById(roomId))
            .filter(room -> room.getStatus() != RoomStatus.CANCELLED)
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "택시방이 없습니다.")); }
    private void requireHost(TaxiRoom room, Long userId) { if (!room.getHost().getUserId().equals(userId)) throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "방장만 정산을 처리할 수 있습니다."); }
    private void requireMember(TaxiRoom room, Long userId) {
        if (room.getHost().getUserId().equals(userId)) return;
        var member = members.findByRoomRoomIdAndUserUserId(room.getRoomId(), userId).orElse(null);
        if (member == null || (member.getStatus() != ParticipationStatus.APPROVED && member.getStatus() != ParticipationStatus.BOARDING_CONFIRMED)) throw error(HttpStatus.FORBIDDEN, "FORBIDDEN", "확정된 동승자만 정산을 조회할 수 있습니다.");
    }
    public SettlementResponse createSettlement(Long roomId, Long userId, int totalFare) {
        var room = findRoom(roomId, true); requireHost(room, userId);
        if (room.getStatus() != RoomStatus.SETTLING) throw error(HttpStatus.CONFLICT, "SETTLEMENT_NOT_READY", "운행이 끝나 정산 단계가 된 후 요금을 입력해 주세요.");
        if (settlements.findByRoomRoomId(roomId).isPresent()) throw error(HttpStatus.CONFLICT, "SETTLEMENT_EXISTS", "이미 최종 요금이 등록되었습니다.");
        var approved = members.findByRoomRoomIdOrderByParticipationId(roomId).stream().filter(member -> member.getStatus() == ParticipationStatus.APPROVED || member.getStatus() == ParticipationStatus.BOARDING_CONFIRMED).toList();
        int count = approved.size() + 1;
        if (totalFare < 1 || totalFare > 10000000 || count > 4 || count != room.getParticipantCount()) throw error(HttpStatus.CONFLICT, "INVALID_SETTLEMENT", "요금과 실제 탑승 인원을 확인해 주세요.");
        var settlement = new Settlement(room, totalFare, count);
        settlement.getReceipts().add(new SettlementParticipant(settlement, room.getHost(), true));
        approved.forEach(member -> settlement.getReceipts().add(new SettlementParticipant(settlement, member.getUser(), false)));
        if (count == 1) {
            room.setStatus(RoomStatus.COMPLETED);
            completions.save(new RoomCompletion(room, Instant.now()));
        }
        return SettlementResponse.from(settlements.saveAndFlush(settlement));
    }
    @Transactional(readOnly = true) public SettlementResponse getSettlement(Long roomId, Long userId) {
        var room = findRoom(roomId, false); requireMember(room, userId);
        return SettlementResponse.from(settlements.findByRoomRoomId(roomId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "SETTLEMENT_NOT_FOUND", "아직 최종 요금이 등록되지 않았습니다.")));
    }
    public SettlementResponse confirmReceipt(Long roomId, Long hostUserId, Long userId) {
        var room = findRoom(roomId, true); requireHost(room, hostUserId);
        var settlement = settlements.findByRoomRoomId(roomId).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "SETTLEMENT_NOT_FOUND", "정산 정보가 없습니다."));
        var receipt = settlement.getReceipts().stream().filter(value -> value.getUser().getUserId().equals(userId)).findFirst().orElseThrow(() -> error(HttpStatus.NOT_FOUND, "RECEIPT_NOT_FOUND", "정산 참여자가 없습니다."));
        receipt.confirm();
        if (room.getStatus() != RoomStatus.COMPLETED && settlement.getReceipts().stream().allMatch(SettlementParticipant::isReceived)) {
            room.setStatus(RoomStatus.COMPLETED);
            completions.save(new RoomCompletion(room, Instant.now()));
        }
        return SettlementResponse.from(settlement);
    }
}
