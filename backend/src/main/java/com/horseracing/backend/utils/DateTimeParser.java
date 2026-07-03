package com.horseracing.backend.utils;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class DateTimeParser {
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("d-M-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-M-d")
    };

    private static final DateTimeFormatter[] TIMESTAMP_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy'T'HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
    };

    public static Date parseDate(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        input = input.trim();
        if (input.contains(" ")) {
            input = input.split("\\s+")[0];
        } else if (input.contains("T")) {
            input = input.split("T")[0];
        }
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate localDate = LocalDate.parse(input, formatter);
                return Date.valueOf(localDate);
            } catch (DateTimeParseException ignored) {}
        }
        try {
            return Date.valueOf(input);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid date format: " + input + ". Expected dd-MM-yyyy or yyyy-MM-dd");
        }
    }

    public static Timestamp parseTimestamp(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        input = input.trim();
        // If it's date-only, append default time
        if (!input.contains(":") && !input.contains("T")) {
            input = input + " 00:00:00";
        }
        // Normalize multiple spaces or T
        input = input.replace('T', ' ');
        // If seconds are missing (e.g. HH:mm), append :00
        String[] parts = input.split(" ");
        if (parts.length > 1) {
            String timePart = parts[1];
            long colonCount = timePart.chars().filter(ch -> ch == ':').count();
            if (colonCount == 1) {
                input = parts[0] + " " + timePart + ":00";
            }
        }

        for (DateTimeFormatter formatter : TIMESTAMP_FORMATTERS) {
            try {
                LocalDateTime localDateTime = LocalDateTime.parse(input, formatter);
                return Timestamp.valueOf(localDateTime);
            } catch (DateTimeParseException ignored) {}
        }
        try {
            return Timestamp.valueOf(input);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid timestamp format: " + input + ". Expected dd-MM-yyyy HH:mm:ss or yyyy-MM-dd HH:mm:ss");
        }
    }
}
