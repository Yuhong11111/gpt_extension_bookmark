package com.chatgptbookmark.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.chatgptbookmark.backend.dto.AuthMessageResponse;
import com.chatgptbookmark.backend.entity.EmailVerificationToken;
import com.chatgptbookmark.backend.entity.User;
import com.chatgptbookmark.backend.repository.EmailVerificationTokenRepository;
import com.chatgptbookmark.backend.repository.UserRepository;

@Service
public class AuthService {
    private static final int EMAIL_TOKEN_EXPIRY_HOURS = 24;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailVerificationService emailVerificationService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        EmailVerificationTokenRepository tokenRepository,
        EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.emailVerificationService = emailVerificationService;
    }

    // create a new user account, generate email verification token, and send verification email
    @Transactional
    public AuthMessageResponse signup(String fullName, String email, String rawPassword, String company) {
        String normalizedEmail = normalizeEmail(email);

        // check if email is already registered, throw exception if it is
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("User already exists");
        }
 
        // create new user with emailVerified set to false, save to database, generate email verification token, and send verification email
        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCompany(StringUtils.hasText(company) ? company.trim() : null);
        user.setEmailVerified(false);
        userRepository.save(user);

        // generate email verification token, save to database, and send verification email
        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setUser(user);
        verificationToken.setToken(UUID.randomUUID().toString());
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(EMAIL_TOKEN_EXPIRY_HOURS));
        tokenRepository.save(verificationToken);

        boolean emailSent = emailVerificationService.sendVerificationEmail(user, verificationToken.getToken());
        if (emailSent) {
            return new AuthMessageResponse("Account created. Check your email to verify your account before logging in.");
        }

        return new AuthMessageResponse("Account created, but the verification email could not be sent. Check the server logs for the verification link.");
    }

    @Transactional(readOnly = true)
    public AuthMessageResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmail(normalizeEmail(email))
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Verify your email before logging in");
        }

        return new AuthMessageResponse("Login successful");
    }

    // verify user's email using the verification token
    @Transactional
    public AuthMessageResponse verifyEmail(String token) {
        // find the verification token in the database, throw exception if it doesn't exist, is already used, or has expired
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verificationToken.isUsed()) {
            throw new RuntimeException("Verification link has already been used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification link has expired");
        }

        // mark the user's email as verified, mark the token as used, and save both to the database
        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        verificationToken.setUsed(true);
        userRepository.save(user);
        tokenRepository.save(verificationToken);

        return new AuthMessageResponse("Email verified. You can now log in.");
    }

    // normalize email by trimming whitespace and converting to lowercase, return null if input is null
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
