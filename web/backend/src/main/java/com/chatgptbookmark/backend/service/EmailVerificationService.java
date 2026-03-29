package com.chatgptbookmark.backend.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.chatgptbookmark.backend.entity.User;

@Service
public class EmailVerificationService {
    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);

    private final JavaMailSender mailSender;
    private final String frontendBaseUrl;
    private final String fromAddress;
    private final String verificationPath;

    public EmailVerificationService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        @Value("${app.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
        @Value("${app.mail.from:chatgptbookmark@gmail.com}") String fromAddress,
        @Value("${app.verification-path:/verify-email}") String verificationPath
    ) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.frontendBaseUrl = frontendBaseUrl;
        this.fromAddress = fromAddress;
        this.verificationPath = verificationPath;
    }

    public boolean sendVerificationEmail(User user, String token) {
        String verificationUrl = buildVerificationUrl(token);

        if (mailSender == null) {
            logger.warn("Verification email not sent because no JavaMailSender bean is configured. Verification URL for {}: {}", user.getEmail(), verificationUrl);
            return false;
        }

        if (!StringUtils.hasText(fromAddress)) {
            logger.warn("Verification email not sent because app.mail.from is blank. Verification URL for {}: {}", user.getEmail(), verificationUrl);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromAddress.trim());
            message.setSubject("Verify your email");
            message.setText(buildEmailBody(user, verificationUrl));
            // send the email, log success, and return true if successful
            mailSender.send(message);
            logger.info("Verification email sent to {}", user.getEmail());
            return true;
        } catch (Exception exception) {
            logger.warn("Verification email could not be sent to {}. Verification URL: {}", user.getEmail(), verificationUrl, exception);
            return false;
        }
    }

    // build the verification URL by combining the frontend base URL, verification path, and token as a query parameter
    private String buildVerificationUrl(String token) {
        String normalizedBaseUrl = frontendBaseUrl.trim().endsWith("/")
            ? frontendBaseUrl.trim().substring(0, frontendBaseUrl.trim().length() - 1)
            : frontendBaseUrl.trim();
        String normalizedPath = verificationPath.startsWith("/") ? verificationPath : "/" + verificationPath;
        return normalizedBaseUrl + normalizedPath + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    // create the email body with a personalized greeting using the user's full name if available, otherwise use "there", and include instructions to verify the email and what to do if they did not create the account
    private String buildEmailBody(User user, String verificationUrl) {
        String name = StringUtils.hasText(user.getFullName()) ? user.getFullName() : "there";
        return "Hi " + name + ",\n\n"
            + "Please verify your email by opening the link below:\n"
            + verificationUrl + "\n\n"
            + "If you did not create this account, you can ignore this email.";
    }
}
