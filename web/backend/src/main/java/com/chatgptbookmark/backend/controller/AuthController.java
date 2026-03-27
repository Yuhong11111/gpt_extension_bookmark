package com.chatgptbookmark.backend.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chatgptbookmark.backend.dto.LoginRequest;
import com.chatgptbookmark.backend.dto.SignupRequest;

// This controller will expose authentication endpoints such as login and signup.
@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        // In a real application, you would handle authentication logic here.
        String email = loginRequest.getEmail();
        // String password = loginRequest.getPassword();
        // boolean rememberMe = loginRequest.isRememberMe();
        System.out.println("email: " + email);
        return "Login endpoint - implement authentication logic here.";
    }

    @PostMapping("/signup")
    public String signup(@Valid @RequestBody SignupRequest signupRequest) {
        // In a real application, you would handle user registration logic here.
        System.out.println("signup email: " + signupRequest.getEmail());
        return "Signup endpoint - implement user registration logic here.";
    }
}
