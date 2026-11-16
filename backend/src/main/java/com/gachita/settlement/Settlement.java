package com.gachita.settlement;
import com.gachita.room.TaxiRoom;
import jakarta.persistence.*;
import java.util.*;
@Entity @Table(name = "settlements")
public class Settlement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "settlement_id") private Long settlementId;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "room_id", unique = true) private TaxiRoom room;
    @Column(name = "total_fare", nullable = false) private int totalFare;
    @Column(name = "fare_per_person", nullable = false) private int farePerPerson;
    @Column(name = "remainder_fare", nullable = false) private int remainderFare;
    @Column(name = "participant_count", nullable = false) private int participantCount;
    @OneToMany(mappedBy = "settlement", cascade = CascadeType.ALL) @OrderBy("receiptId ASC") private List<SettlementParticipant> receipts = new ArrayList<>();
    protected Settlement() {}
    public Settlement(TaxiRoom room, int totalFare, int count) { this.room = room; this.totalFare = totalFare; participantCount = count; farePerPerson = totalFare / count; remainderFare = totalFare % count; }
    public Long getSettlementId() { return settlementId; } public TaxiRoom getRoom() { return room; }
    public int getTotalFare() { return totalFare; } public int getFarePerPerson() { return farePerPerson; }
    public int getRemainderFare() { return remainderFare; } public int getParticipantCount() { return participantCount; }
    public List<SettlementParticipant> getReceipts() { return receipts; }
}
