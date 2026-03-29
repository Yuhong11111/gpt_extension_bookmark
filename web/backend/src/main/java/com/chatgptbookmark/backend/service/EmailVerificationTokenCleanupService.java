package com.chatgptbookmark.backend.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chatgptbookmark.backend.repository.EmailVerificationTokenRepository;

@Service
public class EmailVerificationTokenCleanupService {
    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationTokenCleanupService.class);

    private final EmailVerificationTokenRepository tokenRepository;

    public EmailVerificationTokenCleanupService(EmailVerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Scheduled(cron = "${app.email-verification.cleanup-cron:0 0 * * * *}")
    @Transactional
    public void cleanupTokens() {
        long deletedCount = tokenRepository.deleteByUsedTrueOrExpiresAtBefore(LocalDateTime.now());
        if (deletedCount > 0) {
            logger.info("Deleted {} email verification tokens", deletedCount);
        }
    }
}
