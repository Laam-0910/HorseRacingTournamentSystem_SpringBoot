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

            // Check and add min_entries to Race table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'min_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD min_entries INT NOT NULL DEFAULT 3; " +
                "END"
            );

            // Check and add max_entries to Race table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'max_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD max_entries INT NOT NULL DEFAULT 14; " +
                "END"
            );

            // Check and add steward_report to Race table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'steward_report') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD steward_report NVARCHAR(MAX) NULL; " +
                "END"
            );

            // Check and add youtube_live_url to Race table
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'youtube_live_url') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD youtube_live_url VARCHAR(500) NULL; " +
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

            // Check and create ChatMessage table if missing
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('ChatMessage') AND type = 'U') " +
                "BEGIN " +
                "    CREATE TABLE ChatMessage ( " +
                "        id INT IDENTITY(1,1) PRIMARY KEY, " +
                "        race_id INT NOT NULL, " +
                "        username NVARCHAR(100) NOT NULL, " +
                "        message_text NVARCHAR(MAX) NOT NULL, " +
                "        sent_at DATETIME NOT NULL DEFAULT GETDATE(), " +
                "        CONSTRAINT FK_ChatMessage_Race FOREIGN KEY (race_id) REFERENCES Race(id) ON DELETE CASCADE " +
                "    ); " +
                "END"
            );

            System.out.println("Database columns, ChatMessage table, and HorseRetirementRequest table verified and added successfully if missing.");
        } catch (Exception e) {
            System.err.println("Failed to update database schema: " + e.getMessage());
        }
    }
}
