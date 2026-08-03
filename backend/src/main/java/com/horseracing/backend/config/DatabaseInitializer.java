package com.horseracing.backend.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Lớp khởi tạo DatabaseInitializer - Kiểm tra và cập nhật cấu trúc cơ sở dữ liệu (Database Schema Evolution).
 * - Triển khai từ InitializingBean để chạy ngay sau khi Spring Boot thiết lập cấu hình thuộc tính xong.
 * - Sử dụng JdbcTemplate để thực thi các lệnh SQL trực tiếp.
 * - Kiểm tra sự tồn tại của các cột bổ sung trong bảng Horse, [User], Race và tự động chạy lệnh ALTER TABLE để thêm cột mới nếu chưa có.
 * - Tự động tạo mới các bảng HorseRetirementRequest và ChatMessage nếu chưa tồn tại trong cơ sở dữ liệu.
 */
@Component
public class DatabaseInitializer implements InitializingBean {

    @Autowired
    private JdbcTemplate jdbcTemplate; // Đối tượng tương tác trực tiếp với database qua JDBC

    @Autowired
    private PasswordEncoder passwordEncoder; // BCrypt encoder để hash mật khẩu chuẩn

    @Override
    public void afterPropertiesSet() throws Exception {
        try {
            // 1. Kiểm tra và thêm cột description (mô tả) vào bảng Horse
            jdbcTemplate.execute(
                "IF OBJECT_ID('Horse', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'description') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD description NVARCHAR(MAX) NULL; " +
                "END"
            );
            
            // 2. Kiểm tra và thêm cột avatar (ảnh đại diện) dạng base64/URL vào bảng Horse
            jdbcTemplate.execute(
                "IF OBJECT_ID('Horse', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // 3. Kiểm tra và thêm cột avatar vào bảng User
            jdbcTemplate.execute(
                "IF OBJECT_ID('[User]', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // 4. Kiểm tra và thêm cột biography (tiểu sử) vào bảng User
            jdbcTemplate.execute(
                "IF OBJECT_ID('[User]', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'biography') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD biography NVARCHAR(MAX) NULL; " +
                "END"
            );

            // 4b. Kiểm tra và thêm cột balance (số dư ví) vào bảng User
            jdbcTemplate.execute(
                "IF OBJECT_ID('[User]', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'balance') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD balance DECIMAL(15,2) NOT NULL DEFAULT 0.00; " +
                "END"
            );

            // 4c. Kiểm tra và thêm cột min_prize, max_prize vào bảng SeasonClassRule nếu chưa có
            jdbcTemplate.execute(
                "IF OBJECT_ID('SeasonClassRule', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SeasonClassRule') AND name = 'min_prize') " +
                "BEGIN " +
                "    ALTER TABLE SeasonClassRule ADD min_prize DECIMAL(15,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SeasonClassRule', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SeasonClassRule') AND name = 'max_prize') " +
                "BEGIN " +
                "    ALTER TABLE SeasonClassRule ADD max_prize DECIMAL(15,2) NULL; " +
                "END"
            );

            // Seed default class rules for Season 1 if missing
            jdbcTemplate.execute(
                "IF OBJECT_ID('SeasonClassRule', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SeasonClassRule WHERE season_id = 1) " +
                "BEGIN " +
                "    INSERT INTO SeasonClassRule (season_id, class_level, class_name, min_rating, max_rating, min_prize, max_prize) VALUES " +
                "    (1, 'Class 1', 'Elite Championship',    95, NULL, 300000000.00, 1000000000.00), " +
                "    (1, 'Class 2', 'Premium Group',         80, 94,   200000000.00, 299999000.00), " +
                "    (1, 'Class 3', 'Advanced Tier',         60, 79,   100000000.00, 199999000.00), " +
                "    (1, 'Class 4', 'Intermediate Level',    40, 59,   50000000.00,  99999000.00), " +
                "    (1, 'Class 5', 'Entry Division',        0,  39,   20000000.00,  49999000.00); " +
                "END"
            );

            // 5. Kiểm tra và thêm cột min_entries (số lượng ngựa chạy tối thiểu, mặc định là 3) vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'min_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD min_entries INT NOT NULL DEFAULT 3; " +
                "END"
            );

            // 6. Kiểm tra và thêm cột max_entries (số lượng ngựa chạy tối đa, mặc định là 14) vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'max_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD max_entries INT NOT NULL DEFAULT 14; " +
                "END"
            );

            // 7. Kiểm tra và thêm cột steward_report (báo cáo của trọng tài) vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'steward_report') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD steward_report NVARCHAR(MAX) NULL; " +
                "END"
            );

            // 8. Kiểm tra và thêm cột youtube_live_url (đường dẫn livestream) vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'youtube_live_url') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD youtube_live_url VARCHAR(500) NULL; " +
                "END"
            );

            // 8b. Kiểm tra và thêm cột jockey_share_percentage vào bảng RaceInvitation và RaceEntry
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'jockey_share_percentage') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD jockey_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceEntry') AND name = 'jockey_share_percentage') " +
                "BEGIN " +
                "    ALTER TABLE RaceEntry ADD jockey_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00; " +
                "END"
            );

            // 8.01 Kiểm tra và thêm cột stream_mode (YOUTUBE hoặc WEBCAM) vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'stream_mode') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD stream_mode VARCHAR(20) NOT NULL DEFAULT 'YOUTUBE'; " +
                "END"
            );

            // 8.1 Thêm các cột phân chia tiền thưởng vào bảng Race
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'total_prize_pool') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD total_prize_pool DECIMAL(12,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'first_place_prize') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD first_place_prize DECIMAL(12,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'second_place_prize') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD second_place_prize DECIMAL(12,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('Race', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'third_place_prize') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD third_place_prize DECIMAL(12,2) NULL; " +
                "END"
            );

            // 8.2 Thêm các cột hoa hồng tiền mời và phí thuê nài ngựa vào bảng RaceInvitation
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceInvitation', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'commission_amount') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD commission_amount DECIMAL(12,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceInvitation', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'commission_rate') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD commission_rate DECIMAL(5,2) NULL; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceInvitation', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'payout_status') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD payout_status VARCHAR(30) NULL DEFAULT 'PENDING'; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceInvitation', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'hire_fee') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD hire_fee DECIMAL(12,2) NULL DEFAULT 500.00; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceInvitation', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceInvitation') AND name = 'jockey_prize_percentage') " +
                "BEGIN " +
                "    ALTER TABLE RaceInvitation ADD jockey_prize_percentage DECIMAL(5,2) NULL DEFAULT 20.00; " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('RaceEntry', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RaceEntry') AND name = 'jockey_prize_percentage') " +
                "BEGIN " +
                "    ALTER TABLE RaceEntry ADD jockey_prize_percentage DECIMAL(5,2) NULL DEFAULT 20.00; " +
                "END"
            );

            // 8.3 Thêm cột wallet_balance vào bảng [User]
            jdbcTemplate.execute(
                "IF OBJECT_ID('[User]', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'wallet_balance') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD wallet_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00; " +
                "END"
            );

            // 8.4 Tạo bảng WalletTransaction nếu chưa tồn tại
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('WalletTransaction') AND type = 'U') " +
                "BEGIN " +
                "    CREATE TABLE WalletTransaction ( " +
                "        id INT IDENTITY(1,1) PRIMARY KEY, " +
                "        user_id INT NOT NULL, " +
                "        amount DECIMAL(18,2) NOT NULL, " +
                "        transaction_type VARCHAR(50) NOT NULL, " +
                "        description NVARCHAR(MAX) NULL, " +
                "        created_at DATETIME DEFAULT GETDATE() " +
                "    ); " +
                "END"
            );
            // 8.5 Khởi tạo cấu hình mặc định cho Phí thuê Nài ngựa và Giới hạn Vé trong SystemConfig
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'DEFAULT_JOCKEY_HIRE_FEE') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('DEFAULT_JOCKEY_HIRE_FEE', '500000.00', 'Default hire fee paid by horse owner to jockey per accepted mount (10,000 VND - 10,000,000 VND)'); " +
                "END " +
                "ELSE " +
                "BEGIN " +
                "    UPDATE SystemConfig SET config_value = '500000.00' WHERE config_key = 'DEFAULT_JOCKEY_HIRE_FEE' AND (config_value = '500.00' OR config_value = '500'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'MIN_TICKET_PRICE') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('MIN_TICKET_PRICE', '10000.00', 'Minimum allowed ticket price for a Race Meeting in VND'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'MAX_TICKET_PRICE') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('MAX_TICKET_PRICE', '5000000.00', 'Maximum allowed ticket price for a Race Meeting in VND'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PRIZE_SHARE_1ST') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PRIZE_SHARE_1ST', '50.00', 'Percentage of purse allocated to 1st place (Must be > 2nd place and total sum = 100%)'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PRIZE_SHARE_2ND') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PRIZE_SHARE_2ND', '30.00', 'Percentage of purse allocated to 2nd place'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PRIZE_SHARE_3RD') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PRIZE_SHARE_3RD', '20.00', 'Percentage of purse allocated to 3rd place'); " +
                "END"
            );

            // 8.6 Khởi tạo cấu hình Cổng Thanh Toán (Payment Gateway Mode & API Keys)
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PAYMENT_GATEWAY_MODE') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PAYMENT_GATEWAY_MODE', 'MOCK', 'Payment Gateway Mode: MOCK (Virtual Money Demo) or LIVE (Real Money Gateway)'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PAYOS_CLIENT_ID') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PAYOS_CLIENT_ID', 'NOT_SET', 'PayOS Payment Gateway Client ID (for LIVE real money mode)'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PAYOS_API_KEY') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PAYOS_API_KEY', 'NOT_SET', 'PayOS Payment Gateway API Key (for LIVE real money mode)'); " +
                "END"
            );
            jdbcTemplate.execute(
                "IF OBJECT_ID('SystemConfig', 'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM SystemConfig WHERE config_key = 'PAYOS_CHECKSUM_KEY') " +
                "BEGIN " +
                "    INSERT INTO SystemConfig (config_key, config_value, description) VALUES ('PAYOS_CHECKSUM_KEY', 'NOT_SET', 'PayOS Payment Gateway Checksum Key (for LIVE real money mode)'); " +
                "END"
            );

            // 9. Kiểm tra và tạo bảng HorseRetirementRequest (yêu cầu giải nghệ ngựa) nếu chưa tồn tại
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

            // 10. Kiểm tra và tạo bảng ChatMessage (lịch sử trò chuyện trong trận đấu) nếu chưa tồn tại
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

            // 11. Tự động kiểm tra và khởi tạo dữ liệu lượt thi đấu (RaceEntry) mẫu cho tất cả các trận đua chưa có thí sinh
            try {
                // Truy vấn danh sách ID các trận đua chưa có bất kỳ lượt đăng ký thi đấu (RaceEntry) nào
                List<Integer> raceIdsWithoutEntries = jdbcTemplate.queryForList(
                    "SELECT r.id FROM Race r WHERE NOT EXISTS (SELECT 1 FROM RaceEntry re WHERE re.race_id = r.id)",
                    Integer.class
                );
                // Truy vấn danh sách ID các chiến mã đang ở trạng thái hoạt động (ACTIVE)
                List<Integer> horseIds = jdbcTemplate.queryForList("SELECT id FROM Horse WHERE status = 'ACTIVE' OR status IS NULL", Integer.class);
                // Truy vấn danh sách ID các nài ngựa (User có role_id = 3)
                List<Integer> jockeyIds = jdbcTemplate.queryForList("SELECT id FROM [User] WHERE role_id = 3", Integer.class);

                // Kiểm tra xem có đủ dữ liệu trận đua, chiến mã và nài ngựa để khởi tạo dữ liệu mẫu hay không
                if (!raceIdsWithoutEntries.isEmpty() && !horseIds.isEmpty() && !jockeyIds.isEmpty()) {
                    // Duyệt qua từng ID trận đua chưa có thí sinh
                    for (Integer rId : raceIdsWithoutEntries) {
                        // Tính toán số lượng thí sinh sẽ chèn mẫu (tối đa 3 hoặc theo số lượng ngựa/nài hiện có)
                        int countToInsert = Math.min(3, Math.min(horseIds.size(), jockeyIds.size()));
                        // Lặp để tạo từng lượt đăng ký thi đấu
                        for (int i = 0; i < countToInsert; i++) {
                            // Lấy ID chiến mã tương ứng theo vị trí vòng lặp
                            Integer hId = horseIds.get(i % horseIds.size());
                            // Lấy ID nài ngựa tương ứng theo vị trí vòng lặp
                            Integer jId = jockeyIds.get(i % jockeyIds.size());
                            // Tính toán số cổng xuất phát (Gate number bắt đầu từ 1)
                            int gate = i + 1;
                            // Thực thi lệnh SQL INSERT thêm lượt thi đấu mẫu với trạng thái APPROVED và trọng lượng 55.0kg
                            jdbcTemplate.update(
                                "INSERT INTO RaceEntry (race_id, horse_id, jockey_id, gate_number, status, carried_weight) VALUES (?, ?, ?, ?, 'APPROVED', 55.0)",
                                rId, hId, jId, gate
                            );
                        }
                    }
                }
            } catch (Exception ex) {
                // In thông báo lỗi ra stderr nếu quá trình khởi tạo dữ liệu mẫu RaceEntry thất bại
                System.err.println("Failed to auto-seed RaceEntry: " + ex.getMessage());
            }

            // Synchronize passwords: dynamically read plaintext password (e.g. '123456') from DB and BCrypt hash each user individually
            // Each call to passwordEncoder.encode() generates a NEW random salt → unique hash per user even with same password.
            // Only re-hash users whose password_hash is NOT already a valid 60-character BCrypt hash (starts with $2a$, $2b$, or $2y$)
            try {
                List<java.util.Map<String, Object>> unhashedUsers = jdbcTemplate.queryForList(
                    "SELECT id, password_hash FROM [User] WHERE " +
                    "password_hash IS NULL OR " +
                    "LEN(password_hash) <> 60 OR " +
                    "(" +
                    "  password_hash NOT LIKE '$2a$%' AND " +
                    "  password_hash NOT LIKE '$2b$%' AND " +
                    "  password_hash NOT LIKE '$2y$%'" +
                    ")"
                );
                for (java.util.Map<String, Object> row : unhashedUsers) {
                    Integer uid = (Integer) row.get("id");
                    String rawPassword = (String) row.get("password_hash");
                    if (rawPassword == null || rawPassword.trim().isEmpty()) {
                        rawPassword = "123456";
                    }
                    // Each call generates a unique BCrypt salt
                    String uniqueHash = passwordEncoder.encode(rawPassword.trim());
                    jdbcTemplate.update("UPDATE [User] SET password_hash = ? WHERE id = ?", uniqueHash, uid);
                }
                if (!unhashedUsers.isEmpty()) {
                    System.out.println("Re-hashed " + unhashedUsers.size() + " user(s) with unique BCrypt salts.");
                } else {
                    System.out.println("All users already have valid BCrypt hashes — no re-hashing needed.");
                }
            } catch (Exception ex) {
                System.err.println("Failed to synchronize password hashes: " + ex.getMessage());
            }


            // Clean up any stale RaceEntry records & reset gate_number under inactive meetings or closed seasons
            try {
                jdbcTemplate.update(
                    "UPDATE RaceEntry SET status = 'REJECTED', gate_number = 0 WHERE status <> 'FINISHED' AND race_id IN (" +
                    "  SELECT r.id FROM Race r JOIN RaceMeeting m ON r.race_meeting_id = m.id LEFT JOIN Season s ON m.season_id = s.id WHERE m.status <> 'ACTIVE' OR s.status <> 'ACTIVE'" +
                    ")"
                );
                jdbcTemplate.update(
                    "UPDATE Race SET status = 'DECLARATION_OPEN' WHERE status <> 'FINISHED' AND race_meeting_id IN (" +
                    "  SELECT m.id FROM RaceMeeting m LEFT JOIN Season s ON m.season_id = s.id WHERE m.status <> 'ACTIVE' OR s.status <> 'ACTIVE'" +
                    ")"
                );
            } catch (Exception ex) {
                System.err.println("Note on RaceEntry stale & gate reset cleanup: " + ex.getMessage());
            }

            // Clean up any errant JOCKEY_HIRE_REFUND transactions where no matching JOCKEY_HIRE_FEE exists for that user
            try {
                jdbcTemplate.update(
                    "DELETE FROM WalletTransaction WHERE transaction_type = 'JOCKEY_HIRE_REFUND' " +
                    "AND user_id NOT IN (SELECT DISTINCT user_id FROM WalletTransaction WHERE transaction_type = 'JOCKEY_HIRE_FEE')"
                );
            } catch (Exception ex) {
                System.err.println("Note on transaction cleanup: " + ex.getMessage());
            }

            // Deduplicate RaceEntry records: keep only 1 entry per (race_id, horse_id)
            try {
                jdbcTemplate.update(
                    "DELETE FROM RaceEntry WHERE id NOT IN (" +
                    "  SELECT MIN(id) FROM RaceEntry GROUP BY race_id, horse_id" +
                    ")"
                );
            } catch (Exception ex) {
                System.err.println("Note on RaceEntry deduplication: " + ex.getMessage());
            }

            // Sync specific base balances per user, plus sum of WalletTransactions
            try {
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 60000.00, balance = 60000.00 WHERE username = 'owner_jackson'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 85000.00, balance = 85000.00 WHERE username = 'owner_miller'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 120000.00, balance = 120000.00 WHERE username = 'owner_chen'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 15000.00, balance = 15000.00 WHERE username = 'jockey_ryan'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 18500.00, balance = 18500.00 WHERE username = 'jockey_emma'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 22000.00, balance = 22000.00 WHERE username = 'jockey_carlos'");
                jdbcTemplate.update("UPDATE [User] SET wallet_balance = 12000.00, balance = 12000.00 WHERE username = 'jockey_naomi'");

                jdbcTemplate.update(
                    "UPDATE u SET u.wallet_balance = u.wallet_balance + ISNULL(txSum.total, 0), u.balance = u.balance + ISNULL(txSum.total, 0) " +
                    "FROM [User] u " +
                    "JOIN (SELECT user_id, SUM(amount) AS total FROM WalletTransaction GROUP BY user_id) txSum ON u.id = txSum.user_id"
                );
            } catch (Exception ex) {
                System.err.println("Note on wallet balance sync: " + ex.getMessage());
            }

            System.out.println("Database columns, ChatMessage table, HorseRetirementRequest table, and RaceEntry auto-seeding verified successfully.");
        } catch (Exception e) {
            System.err.println("Failed to update database schema: " + e.getMessage());
        }
    }
}
