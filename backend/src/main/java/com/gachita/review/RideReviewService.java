package com.gachita.review;

import com.gachita.common.ApiException;
import com.gachita.room.*;
import com.gachita.settlement.Settlement;
import com.gachita.settlement.SettlementRepository;
import com.gachita.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class RideReviewService {
    private final RoomRepository rooms; private final RoomCompletionRepository completions;
    private final SettlementRepository settlements; private final UserRepository users; private final RideReviewRepository reviews;
    public RideReviewService(RoomRepository rooms, RoomCompletionRepository completions, SettlementRepository settlements,
                             UserRepository users, RideReviewRepository reviews) {
        this.rooms = rooms; this.completions = completions; this.settlements = settlements; this.users = users; this.reviews = reviews;
    }
    private ApiException error(HttpStatus status, String code, String message) { return new ApiException(status, code, message); }
    private Settlement completedSettlement(Long roomId, boolean lock) {
        var room = (lock ? rooms.findLockedById(roomId) : rooms.findById(roomId))
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "REVIEW_NOT_READY", "정산 완료된 동승 기록이 없습니다."));
        if (room.getStatus() != RoomStatus.COMPLETED && !(room.getStatus() == RoomStatus.CANCELLED && completions.existsById(roomId)))
            throw error(HttpStatus.CONFLICT, "REVIEW_NOT_READY", "정산이 완료된 뒤 후기를 작성할 수 있어요.");
        return settlements.findByRoomRoomId(roomId)
                .orElseThrow(() -> error(HttpStatus.CONFLICT, "REVIEW_NOT_READY", "정산 내역이 없어 후기를 작성할 수 없어요."));
    }
    private void requireRider(Settlement settlement, Long userId) {
        if (settlement.getReceipts().stream().noneMatch(receipt -> receipt.getUser().getUserId().equals(userId)))
            throw error(HttpStatus.FORBIDDEN, "REVIEW_FORBIDDEN", "실제로 함께 탄 사람만 후기를 확인할 수 있어요.");
    }
    public RideReviewResponse create(Long roomId, Long reviewerId, RideReviewRequest input) {
        var settlement = completedSettlement(roomId, true);
        requireRider(settlement, reviewerId);
        if (reviewerId.equals(input.revieweeUserId())) throw error(HttpStatus.BAD_REQUEST, "SELF_REVIEW", "본인에게는 후기를 쓸 수 없어요.");
        requireRider(settlement, input.revieweeUserId());
        if (reviews.existsByRoomRoomIdAndReviewerUserIdAndRevieweeUserId(roomId, reviewerId, input.revieweeUserId()))
            throw error(HttpStatus.CONFLICT, "REVIEW_EXISTS", "이미 이 동승자에게 후기를 작성했어요.");
        var comment = input.comment() == null ? "" : input.comment().strip();
        if (comment.length() > 500) throw error(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "후기는 500자 이내로 입력해 주세요.");
        return RideReviewResponse.from(reviews.saveAndFlush(new RideReview(settlement.getRoom(), users.getReferenceById(reviewerId),
                users.getReferenceById(input.revieweeUserId()), input.rating(), comment)));
    }
    @Transactional(readOnly = true) public List<RideReviewResponse> forRoom(Long roomId, Long userId) {
        var settlement = completedSettlement(roomId, false);
        requireRider(settlement, userId);
        return reviews.findByRoomRoomIdOrderByCreatedAtDescReviewIdDesc(roomId).stream().map(RideReviewResponse::from).toList();
    }
    @Transactional(readOnly = true) public RideReviewOverview mine(Long userId) {
        var received = reviews.findTop100ByRevieweeUserIdOrderByCreatedAtDescReviewIdDesc(userId).stream().map(RideReviewResponse::from).toList();
        var written = reviews.findTop100ByReviewerUserIdOrderByCreatedAtDescReviewIdDesc(userId).stream().map(RideReviewResponse::from).toList();
        return new RideReviewOverview(received, written, reviews.countByRevieweeUserId(userId), reviews.averageRatingFor(userId));
    }
}
