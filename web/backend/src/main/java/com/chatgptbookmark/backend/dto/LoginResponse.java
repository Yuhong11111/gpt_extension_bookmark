package com.chatgptbookmark.backend.dto;

public class LoginResponse {
    private final String message;
    private final AuthenticatedUserResponse user;

    public LoginResponse(String message, AuthenticatedUserResponse user) {
        this.message = message;
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public AuthenticatedUserResponse getUser() {
        return user;
    }
}
