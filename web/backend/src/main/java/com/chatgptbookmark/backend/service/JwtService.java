package com.chatgptbookmark.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.chatgptbookmark.backend.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// generate and validate JWT tokens for user authentication, and calculate cookie max age based on token expiry settings
// rememberMe flag is used to determine whether to generate a token with a longer expiry time and to set the cookie max age accordingly
@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long tokenExpiryHours;
    private final long rememberMeTokenExpiryDays;

    public JwtService(
        @Value("${app.auth.jwt-secret}") String jwtSecret,
        @Value("${app.auth.token-expiry-hours}") long tokenExpiryHours,
        @Value("${app.auth.remember-me-token-expiry-days}") long rememberMeTokenExpiryDays
    ) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.tokenExpiryHours = tokenExpiryHours;
        this.rememberMeTokenExpiryDays = rememberMeTokenExpiryDays;
    }

    public String generateToken(User user, boolean rememberMe) {
        Instant now = Instant.now();
        Instant expiresAt = rememberMe
            ? now.plus(rememberMeTokenExpiryDays, ChronoUnit.DAYS)
            : now.plus(tokenExpiryHours, ChronoUnit.HOURS);

        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("fullName", user.getFullName())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey)
            .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public long getCookieMaxAgeSeconds(boolean rememberMe) {
        if (!rememberMe) {
            return -1;
        }
        return ChronoUnit.DAYS.getDuration().multipliedBy(rememberMeTokenExpiryDays).getSeconds();
    }
}
