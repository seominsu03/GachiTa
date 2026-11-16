package com.gachita.user;

import jakarta.persistence.*;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_username", columnNames = "username"))
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    @Column(nullable = false, length = 20)
    private String username;
    @Column(nullable = false, length = 20)
    private String nickname;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Column(length = 50)
    private String name;
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    protected User() {}
    public User(String username, String nickname, String passwordHash) {
        this.username = username;
        this.nickname = nickname;
        this.passwordHash = passwordHash;
    }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getNickname() { return nickname; }
    public String getPasswordHash() { return passwordHash; }
    public String getName() { return name; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setSignupDetails(String name, String phoneNumber) {
        this.name = name;
        this.phoneNumber = phoneNumber;
    }
}
