package com.chatgptbookmark.backend.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.chatgptbookmark.backend.entity.EmailVerificationToken;
import com.chatgptbookmark.backend.entity.User;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findByUser(User user);

    @Transactional
    long deleteByUsedTrueOrExpiresAtBefore(LocalDateTime expiresAt);
}
