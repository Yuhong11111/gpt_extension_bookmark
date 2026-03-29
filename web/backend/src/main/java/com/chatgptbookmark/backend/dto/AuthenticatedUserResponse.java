package com.chatgptbookmark.backend.dto;

public class AuthenticatedUserResponse {
    private final Long id;
    private final String fullName;
    private final String email;
    private final String company;

    public AuthenticatedUserResponse(Long id, String fullName, String email, String company) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.company = company;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getCompany() {
        return company;
    }
}
