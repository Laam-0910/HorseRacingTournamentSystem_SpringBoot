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

@Configuration
public class JacksonConfig {

    @Bean
    public Module dateTimeModule() {
        SimpleModule module = new SimpleModule();
        
        module.addDeserializer(Timestamp.class, new JsonDeserializer<Timestamp>() {
            @Override
            public Timestamp deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                String val = p.getText();
                return DateTimeParser.parseTimestamp(val);
            }
        });

        module.addDeserializer(Date.class, new JsonDeserializer<Date>() {
            @Override
            public Date deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                String val = p.getText();
                return DateTimeParser.parseDate(val);
            }
        });

        return module;
    }
}
