package com.chatgptbookmark.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.chatgptbookmark.backend.dto.AuthenticatedUserResponse;
import com.chatgptbookmark.backend.dto.AuthMessageResponse;
import com.chatgptbookmark.backend.dto.LoginResponse;
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
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        EmailVerificationTokenRepository tokenRepository,
        EmailVerificationService emailVerificationService,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.emailVerificationService = emailVerificationService;
        this.jwtService = jwtService;
    }

    // create a new user account, generate email verification token, and send verification email
    @Transactional
    public AuthMessageResponse signup(String fullName, String email, String rawPassword, String company) {
        String normalizedEmail = normalizeEmail(email);

        User existingUser = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (existingUser != null) {
            if (Boolean.TRUE.equals(existingUser.getEmailVerified())) {
                throw new RuntimeException("User already exists");
            }

            EmailVerificationToken existingToken = tokenRepository.findByUser(existingUser).orElse(null);
            if (existingToken != null && !existingToken.isUsed() && existingToken.getExpiresAt().isAfter(LocalDateTime.now())) {
                return new AuthMessageResponse("Account already exists but is still pending verification. Please confirm your email.");
            }

            EmailVerificationToken refreshedToken = createOrRefreshVerificationToken(existingUser, existingToken);
            boolean emailSent = emailVerificationService.sendVerificationEmail(existingUser, refreshedToken.getToken());
            if (emailSent) {
                return new AuthMessageResponse("Your previous verification link expired. We sent a new verification email.");
            }

            return new AuthMessageResponse("Your previous verification link expired, but the new verification email could not be sent. Please try again later.");
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
        EmailVerificationToken verificationToken = createOrRefreshVerificationToken(user, null);

        boolean emailSent = emailVerificationService.sendVerificationEmail(user, verificationToken.getToken());
        if (emailSent) {
            return new AuthMessageResponse("Account created. Check your email to verify your account before logging in.");
        }

        return new AuthMessageResponse("Account created, but the verification email could not be sent. Please try again later.");
    }

    @Transactional(readOnly = true)
    public AuthenticatedLoginResult login(String email, String rawPassword, boolean rememberMe) {
        // validate user credentials, throw exception if authentication fails or email is not verified, and generate auth token if authentication succeeds
        User user = authenticateUser(email, rawPassword);
        return new AuthenticatedLoginResult(
            new LoginResponse("Login successful", buildAuthenticatedUserResponse(user)),
            jwtService.generateToken(user, rememberMe)
        );
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse getAuthenticatedUser(String token) {

        // if token is null or empty, throw 401 Unauthorized with message "Authentication required"
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Long userId;
        // extract user ID from token, throw 401 Unauthorized with message "Authentication required" if token is invalid or expired
        try {
            userId = jwtService.extractUserId(token);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        // find the user in the database by ID, throw 401 Unauthorized with message "Authentication required" if user is not found, and throw 403 Forbidden with message "Verify your email before logging in" if email is not verified
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verify your email before logging in");
        }

        return buildAuthenticatedUserResponse(user);
    }

    // verify user's email using the verification token
    @Transactional
    public AuthenticatedLoginResult verifyEmail(String token) {
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

        // after successful email verification, generate auth token and return the authenticated user info along with a success message
        return new AuthenticatedLoginResult(
            new LoginResponse("Email verified. Redirecting you to the dashboard.", buildAuthenticatedUserResponse(user)),
            jwtService.generateToken(user, false)
        );
    }

    // normalize email by trimming whitespace and converting to lowercase, return null if input is null
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public long getCookieMaxAgeSeconds(boolean rememberMe) {
        return jwtService.getCookieMaxAgeSeconds(rememberMe);
    }

    // authenticate user by email and password, throw exception if authentication fails or email is not verified
    private User authenticateUser(String email, String rawPassword) {
        User user = userRepository.findByEmail(normalizeEmail(email))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verify your email before logging in");
        }

        return user;
    }

    // build AuthenticatedUserResponse from User entity
    private AuthenticatedUserResponse buildAuthenticatedUserResponse(User user) {
        return new AuthenticatedUserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getCompany()
        );
    }

    // create or refresh email verification token for a user, save to database, and return the token
    private EmailVerificationToken createOrRefreshVerificationToken(User user, EmailVerificationToken token) {
        EmailVerificationToken verificationToken = token != null ? token : new EmailVerificationToken();
        verificationToken.setUser(user);
        verificationToken.setToken(UUID.randomUUID().toString());
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(EMAIL_TOKEN_EXPIRY_HOURS));
        verificationToken.setUsed(false);
        return tokenRepository.save(verificationToken);
    }
    // a simple wrapper class to hold both the LoginResponse and the auth token generated during login
    public static class AuthenticatedLoginResult {
        private final LoginResponse response;
        private final String authToken;

        public AuthenticatedLoginResult(LoginResponse response, String authToken) {
            this.response = response;
            this.authToken = authToken;
        }

        public LoginResponse getResponse() {
            return response;
        }

        public String getAuthToken() {
            return authToken;
        }
    }
}
