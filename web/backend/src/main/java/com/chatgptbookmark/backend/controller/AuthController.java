package com.chatgptbookmark.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import jakarta.validation.Valid;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.chatgptbookmark.backend.dto.AuthenticatedUserResponse;
import com.chatgptbookmark.backend.dto.AuthMessageResponse;
import com.chatgptbookmark.backend.dto.LoginRequest;
import com.chatgptbookmark.backend.dto.LoginResponse;
import com.chatgptbookmark.backend.dto.SignupRequest;
import com.chatgptbookmark.backend.service.AuthService;
import com.chatgptbookmark.backend.service.AuthService.AuthenticatedLoginResult;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final String authCookieName;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(
        AuthService authService,
        @Value("${app.auth.cookie-name}") String authCookieName,
        @Value("${app.auth.cookie-secure}") boolean cookieSecure,
        @Value("${app.auth.cookie-same-site}") String cookieSameSite
    ) {
        this.authService = authService;
        this.authCookieName = authCookieName;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthenticatedLoginResult loginResult = authService.login(
            loginRequest.getEmail(),
            loginRequest.getPassword(),
            loginRequest.isRememberMe()
        );

        // loginResult.getAuthToken() is a string
        // authService.getCookieMaxAgeSeconds(loginRequest.isRememberMe())).toString()) is a string representing the max age in seconds for the cookie (if rememberMe is true, it will return a positive number, otherwise it will return -1 to indicate a session cookie)
        // loginResult.getResponse() is the LoginResponse object containing the login message and authenticated user info to be returned in the response body
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildAuthCookie(loginResult.getAuthToken(), authService.getCookieMaxAgeSeconds(loginRequest.isRememberMe())).toString())
            .body(loginResult.getResponse());
    }

    @PostMapping("/signup")
    public AuthMessageResponse signup(@Valid @RequestBody SignupRequest signupRequest) {
        return authService.signup(
            signupRequest.getFullName(),
            signupRequest.getEmail(),
            signupRequest.getPassword(),
            signupRequest.getCompany()
        );
    }

    @GetMapping("/verify-email")
    public ResponseEntity<LoginResponse> verifyEmail(@RequestParam("token") String token) {
        AuthenticatedLoginResult verifyResult = authService.verifyEmail(token);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildAuthCookie(verifyResult.getAuthToken(), authService.getCookieMaxAgeSeconds(false)).toString())
            .body(verifyResult.getResponse());
    }

    // get the authenticated user info based on the auth token from the cookie, return 401 if token is missing or invalid, return 403 if email is not verified
    @GetMapping("/me")
    public AuthenticatedUserResponse me(@CookieValue(name = "${app.auth.cookie-name}", required = false) String authToken) {
        return authService.getAuthenticatedUser(authToken);
    }

    // logout by clearing the auth cookie, return a success message in the response body
    @PostMapping("/logout")
    public ResponseEntity<AuthMessageResponse> logout() {
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, buildAuthCookie("", 0).toString())
            .body(new AuthMessageResponse("Logged out"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<AuthMessageResponse> handleResponseStatusException(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
            .body(new AuthMessageResponse(exception.getReason() == null ? "Request failed" : exception.getReason()));
    }

    @ExceptionHandler(RuntimeException.class)
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.BAD_REQUEST)
    public AuthMessageResponse handleRuntimeException(RuntimeException exception) {
        return new AuthMessageResponse(exception.getMessage());
    }

    // build a Set-Cookie header value for the auth cookie with the given token and max age in seconds (if maxAgeSeconds is negative, do not set Max-Age)
    private ResponseCookie buildAuthCookie(String token, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(authCookieName, token)
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/")
            .sameSite(cookieSameSite);

        if (maxAgeSeconds >= 0) {
            builder.maxAge(maxAgeSeconds);
        }

        return builder.build();
    }
}
