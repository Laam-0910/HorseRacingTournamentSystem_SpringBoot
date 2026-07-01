package com.horseracing.backend.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements InitializingBean {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void afterPropertiesSet() throws Exception {
        try {
            // Check and add description to Horse table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'description') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD description NVARCHAR(MAX) NULL; " +
                "END"
            );
            
            // Check and add image_url to Horse table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'image_url') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD image_url NVARCHAR(500) NULL; " +
                "END"
            );
            System.out.println("Database columns verified and added successfully if missing.");
        } catch (Exception e) {
            System.err.println("Failed to update database schema: " + e.getMessage());
        }
    }
}
