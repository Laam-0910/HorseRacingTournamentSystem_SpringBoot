package com.horseracing.backend.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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

    @Override
    public void afterPropertiesSet() throws Exception {
        try {
            // 1. Kiểm tra và thêm cột description (mô tả) vào bảng Horse
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'description') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD description NVARCHAR(MAX) NULL; " +
                "END"
            );
            
            // 2. Kiểm tra và thêm cột avatar (ảnh đại diện) dạng base64/URL vào bảng Horse
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Horse') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE Horse ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // 3. Kiểm tra và thêm cột avatar vào bảng User
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'avatar') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD avatar VARCHAR(MAX) NULL; " +
                "END"
            );

            // 4. Kiểm tra và thêm cột biography (tiểu sử) vào bảng User
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[User]') AND name = 'biography') " +
                "BEGIN " +
                "    ALTER TABLE [User] ADD biography NVARCHAR(MAX) NULL; " +
                "END"
            );

            // 5. Kiểm tra và thêm cột min_entries (số lượng ngựa chạy tối thiểu, mặc định là 3) vào bảng Race
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'min_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD min_entries INT NOT NULL DEFAULT 3; " +
                "END"
            );

            // 6. Kiểm tra và thêm cột max_entries (số lượng ngựa chạy tối đa, mặc định là 14) vào bảng Race
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'max_entries') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD max_entries INT NOT NULL DEFAULT 14; " +
                "END"
            );

            // 7. Kiểm tra và thêm cột steward_report (báo cáo của trọng tài) vào bảng Race
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'steward_report') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD steward_report NVARCHAR(MAX) NULL; " +
                "END"
            );

            // 8. Kiểm tra và thêm cột youtube_live_url (đường dẫn livestream) vào bảng Race
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Race') AND name = 'youtube_live_url') " +
                "BEGIN " +
                "    ALTER TABLE Race ADD youtube_live_url VARCHAR(500) NULL; " +
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

            System.out.println("Database columns, ChatMessage table, HorseRetirementRequest table, and RaceEntry auto-seeding verified successfully.");
        } catch (Exception e) {
            System.err.println("Failed to update database schema: " + e.getMessage());
        }
    }
}
