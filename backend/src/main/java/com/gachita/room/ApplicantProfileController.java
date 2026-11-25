package com.gachita.room;
import com.gachita.common.*;
import com.gachita.participation.*;
import com.gachita.review.RideReviewRepository;
import jakarta.persistence.EntityManager;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/rooms/{roomId}/applicants/{userId}/profile")
public class ApplicantProfileController {
 private final RoomRepository rooms; private final ParticipationRepository members; private final RideReviewRepository reviews; private final EntityManager em;
 public ApplicantProfileController(RoomRepository rooms,ParticipationRepository members,RideReviewRepository reviews,EntityManager em){this.rooms=rooms;this.members=members;this.reviews=reviews;this.em=em;}
 public record Review(int rating,String comment) {}
 public record Profile(Double averageRating,long reviewCount,long rideCount,List<Review> reviews) {}
 @GetMapping @Transactional(readOnly=true) public ApiResponse<Profile> get(@PathVariable Long roomId,@PathVariable Long userId,Principal principal){
  var room=rooms.findById(roomId).filter(r->r.getStatus()!=RoomStatus.CANCELLED).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"ROOM_NOT_FOUND","택시방이 없습니다."));
  if(!room.getHost().getUserId().equals(Long.valueOf(principal.getName())))throw new ApiException(HttpStatus.FORBIDDEN,"FORBIDDEN","방장만 신청자의 프로필을 확인할 수 있어요.");
  var member=members.findByRoomRoomIdAndUserUserId(roomId,userId).filter(m->List.of(ParticipationStatus.PENDING,ParticipationStatus.APPROVED,ParticipationStatus.BOARDING_CONFIRMED).contains(m.getStatus()));
  if(member.isEmpty())throw new ApiException(HttpStatus.NOT_FOUND,"APPLICANT_NOT_FOUND","현재 신청자가 아닙니다.");
  long count=em.createQuery("select count(p) from SettlementParticipant p where p.user.userId=:userId and exists (select c.roomId from RoomCompletion c where c.roomId=p.settlement.room.roomId)",Long.class).setParameter("userId",userId).getSingleResult();
  return ApiResponse.ok(new Profile(reviews.averageRatingFor(userId),reviews.countByRevieweeUserId(userId),count,reviews.findTop100ByRevieweeUserIdOrderByCreatedAtDescReviewIdDesc(userId).stream().map(r->new Review(r.getRating(),r.getComment())).toList()),"프로필 요약을 조회했어요.");
 }
}
