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
            
            // Check and add avatar to Horse table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // Check and add avatar to User table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // Check and create HorseRetirementRequest table if it does not exist
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('HorseRetirementRequest') AND type = 'U') " +
                "BEGIN " +
                "    CREATE TABLE HorseRetirementRequest ( " +
                "        id INT IDENTITY(1,1) PRIMARY KEY, " +
                "        horse_id INT NOT NULL, " +
                "        owner_id INT NOT NULL, " +
                "        reason NVARCHAR(MAX) NOT NULL, " +
                "        status VARCHAR(30) NOT NULL DEFAULT 'PENDING', " +
                "        admin_remarks NVARCHAR(MAX) NULL, " +
                "        created_at DATETIME DEFAULT GETDATE(), " +
                "        processed_at DATETIME NULL, " +
                "        CONSTRAINT FK_Retire_Horse FOREIGN KEY (horse_id) REFERENCES Horse(id), " +
                "        CONSTRAINT FK_Retire_Owner FOREIGN KEY (owner_id) REFERENCES [User](id) " +
                "    ); " +
                "END"
            );

            System.out.println("Database columns and HorseRetirementRequest table verified and added successfully if missing.");
        } catch (Exception e) {
            System.err.println("Failed to update database schema: " + e.getMessage());
        }
    }
}
