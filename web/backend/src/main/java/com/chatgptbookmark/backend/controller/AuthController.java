package com.chatgptbookmark.backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chatgptbookmark.backend.dto.AuthMessageResponse;
import com.chatgptbookmark.backend.dto.LoginRequest;
import com.chatgptbookmark.backend.dto.SignupRequest;
import com.chatgptbookmark.backend.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthMessageResponse login(@Valid @RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest.getEmail(), loginRequest.getPassword());
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
    public AuthMessageResponse verifyEmail(@RequestParam("token") String token) {
        return authService.verifyEmail(token);
    }

    @ExceptionHandler(RuntimeException.class)
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.BAD_REQUEST)
    public AuthMessageResponse handleRuntimeException(RuntimeException exception) {
        return new AuthMessageResponse(exception.getMessage());
    }
}
