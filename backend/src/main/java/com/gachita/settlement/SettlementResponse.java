package com.gachita.settlement;
import java.util.List;
public record SettlementResponse(Long roomId, int totalFare, int farePerPerson, int remainderFare, int participantCount, List<ReceiptResponse> receipts) {
    public record ReceiptResponse(Long userId, String nickname, boolean received) {}
    public static SettlementResponse from(Settlement settlement) {
        return new SettlementResponse(settlement.getRoom().getRoomId(), settlement.getTotalFare(), settlement.getFarePerPerson(), settlement.getRemainderFare(), settlement.getParticipantCount(),
                settlement.getReceipts().stream().map(receipt -> new ReceiptResponse(receipt.getUser().getUserId(), receipt.getUser().getNickname(), receipt.isReceived())).toList());
    }
}
