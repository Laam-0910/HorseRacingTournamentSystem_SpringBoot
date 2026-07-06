package com.horseracing.backend.runner;

import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordEncryptionRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking for unencrypted passwords in database...");
        List<User> users = userRepository.findAll();
        int updateCount = 0;
        for (User user : users) {
            String hash = user.getPasswordHash();
            if (hash != null) {
                // If it doesn't look like a BCrypt hash, we encrypt it
                if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
                    log.info("Encrypting password for user: {}", user.getUsername());
                    String encrypted = passwordEncoder.encode(hash);
                    user.setPasswordHash(encrypted);
                    userRepository.save(user);
                    updateCount++;
                }
            }
        }
        if (updateCount > 0) {
            log.info("Successfully encrypted {} plain-text password hashes in the database.", updateCount);
        } else {
            log.info("All passwords are already encrypted.");
        }
    }
}
