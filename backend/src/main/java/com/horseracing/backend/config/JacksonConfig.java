package com.horseracing.backend.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.horseracing.backend.utils.DateTimeParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.sql.Date;
import java.sql.Timestamp;

/**
 * Lớp cấu hình JacksonConfig - Tùy chỉnh quá trình Serialization/Deserialization JSON của Jackson.
 * - Đăng ký các bộ giải mã (Deserializer) tùy biến để xử lý việc chuyển đổi định dạng ngày tháng từ chuỗi JSON sang java.sql.Timestamp và java.sql.Date.
 * - Giải quyết các định dạng ngày giờ phi tiêu chuẩn được gửi từ client lên API Spring Boot.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Module dateTimeModule() {
        SimpleModule module = new SimpleModule();
        
        // Đăng ký bộ giải mã tùy biến cho java.sql.Timestamp
        module.addDeserializer(Timestamp.class, new JsonDeserializer<Timestamp>() {
            @Override
            public Timestamp deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                String val = p.getText(); // Đọc văn bản thô từ JSON
                return DateTimeParser.parseTimestamp(val); // Sử dụng tiện ích DateTimeParser để phân tích cú pháp
            }
        });

        // Đăng ký bộ giải mã tùy biến cho java.sql.Date
        module.addDeserializer(Date.class, new JsonDeserializer<Date>() {
            @Override
            public Date deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                String val = p.getText(); // Đọc văn bản thô từ JSON
                return DateTimeParser.parseDate(val); // Sử dụng tiện ích DateTimeParser để phân tích cú pháp
            }
        });

        return module;
    }
}
