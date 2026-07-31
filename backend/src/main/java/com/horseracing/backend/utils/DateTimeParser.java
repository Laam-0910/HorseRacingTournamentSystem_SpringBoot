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

    // Chuyển đổi chuỗi ngày nhận từ client sang đối tượng java.sql.Date
    public static Date parseDate(String input) {
        // Kiểm tra nếu chuỗi ngày đầu vào bị rỗng hoặc null
        if (input == null || input.trim().isEmpty()) {
            return null; // Trả về null nếu không có dữ liệu
        }
        input = input.trim(); // Cắt bỏ khoảng trắng thừa ở hai đầu chuỗi
        if (input.contains(" ")) { // Nếu chuỗi chứa giờ ngăn cách bởi khoảng trắng
            input = input.split("\\s+")[0]; // Trích xuất chỉ lấy phần ngày trước khoảng trắng
        } else if (input.contains("T")) { // Nếu chuỗi chứa định dạng ISO có ký tự 'T'
            input = input.split("T")[0]; // Trích xuất chỉ lấy phần ngày trước ký tự 'T'
        }
        // Thử parse ngày bằng lần lượt các định dạng định sẵn trong DATE_FORMATTERS
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate localDate = LocalDate.parse(input, formatter); // Chuyển đổi sang LocalDate
                return Date.valueOf(localDate); // Đổi sang java.sql.Date và trả về
            } catch (DateTimeParseException ignored) {} // Bỏ qua ngoại lệ nếu không khớp định dạng này
        }
        try {
            return Date.valueOf(input); // Thử dùng phương thức parse mặc định yyyy-MM-dd của java.sql.Date
        } catch (IllegalArgumentException e) {
            // Ném ngoại lệ thông báo định dạng ngày không hợp lệ
            throw new IllegalArgumentException("Invalid date format: " + input + ". Expected dd-MM-yyyy or yyyy-MM-dd");
        }
    }

    // Chuyển đổi chuỗi ngày giờ nhận từ client sang đối tượng java.sql.Timestamp
    public static Timestamp parseTimestamp(String input) {
        // Kiểm tra nếu chuỗi thời gian đầu vào bị rỗng hoặc null
        if (input == null || input.trim().isEmpty()) {
            return null; // Trả về null nếu không có dữ liệu
        }
        input = input.trim(); // Cắt bỏ khoảng trắng thừa
        // Nếu chuỗi chỉ có ngày mà không có giờ (không chứa ':' hay 'T')
        if (!input.contains(":") && !input.contains("T")) {
            input = input + " 00:00:00"; // Bổ sung mặc định mốc giờ 00:00:00
        }
        // Chuẩn hóa ký tự 'T' phân cách ngày giờ thành khoảng trắng
        input = input.replace('T', ' ');
        // Tách chuỗi thành 2 phần: Ngày và Giờ
        String[] parts = input.split(" ");
        if (parts.length > 1) {
            String timePart = parts[1]; // Phần chuỗi biểu diễn thời gian
            long colonCount = timePart.chars().filter(ch -> ch == ':').count(); // Đếm số dấu hai chấm
            if (colonCount == 1) { // Nếu thiếu phần giây (VD: 14:30)
                input = parts[0] + " " + timePart + ":00"; // Bổ sung :00 vào cuối chuỗi
            }
        }

        // Thử parse ngày giờ bằng lần lượt các định dạng trong TIMESTAMP_FORMATTERS
        for (DateTimeFormatter formatter : TIMESTAMP_FORMATTERS) {
            try {
                LocalDateTime localDateTime = LocalDateTime.parse(input, formatter); // Parse sang LocalDateTime
                return Timestamp.valueOf(localDateTime); // Đổi sang java.sql.Timestamp và trả về
            } catch (DateTimeParseException ignored) {} // Bỏ qua ngoại lệ nếu không khớp định dạng này
        }
        try {
            return Timestamp.valueOf(input); // Thử dùng phương thức parse mặc định của Timestamp
        } catch (IllegalArgumentException e) {
            // Ném ngoại lệ thông báo định dạng ngày giờ không hợp lệ
            throw new IllegalArgumentException("Invalid timestamp format: " + input + ". Expected dd-MM-yyyy HH:mm:ss or yyyy-MM-dd HH:mm:ss");
        }
    }
}
