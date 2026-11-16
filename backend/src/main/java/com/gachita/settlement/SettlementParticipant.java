package com.gachita.settlement;
import com.gachita.user.User;
import jakarta.persistence.*;
@Entity @Table(name = "settlement_receipts", uniqueConstraints = @UniqueConstraint(name = "uk_receipt_settlement_user", columnNames = {"settlement_id", "user_id"}))
public class SettlementParticipant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "receipt_id") private Long receiptId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "settlement_id") private Settlement settlement;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false) private boolean received;
    protected SettlementParticipant() {}
    public SettlementParticipant(Settlement settlement, User user, boolean received) { this.settlement = settlement; this.user = user; this.received = received; }
    public User getUser() { return user; } public boolean isReceived() { return received; } public void confirm() { received = true; }
}
