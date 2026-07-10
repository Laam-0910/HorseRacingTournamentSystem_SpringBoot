package com.horseracing.backend.runner;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Paths;

@Component
@Slf4j
public class PythonStartupRunner {

    private Process pythonProcess;

    // ── CHÚ THÍCH PHÂN TÍCH: ───────────────────────────────────────
    // 1. @PostConstruct LÀ GÌ? Đây là một annotation của Spring. Khác với Hàm khởi tạo (Constructor),
    //    nó chỉ chạy sau khi Spring Bean này đã được tạo xong và tất cả các Dependency (như logger, config, các Bean khác)
    //    đã được tiêm (inject) đầy đủ. Sử dụng Constructor ở đây sẽ dễ bị lỗi NullPointerException do thiếu dependency.
    // 2. ProcessBuilder LÀ GÌ? Đây là lớp của Java dùng để khởi tạo một Tiến trình Hệ điều hành thực tế (Native OS Process).
    //    Ở đây ta gọi trình biên dịch "python" (hoặc "python3", "py") để thực thi tệp "ai_service.py" độc lập hoàn toàn với JVM.
    // 3. TẠI SAO PHẢI CÓ LUỒNG RIÊNG (Thread / Multithreading)? Hàm readLine() để đọc log từ tiến trình con là một hàm
    //    "gọi chặn" (blocking call). Nếu chạy vòng lặp while (readLine()) này trực tiếp trên luồng chính (Main Thread)
    //    của Spring Boot, Main Thread sẽ bị treo vĩnh viễn (đóng băng) và Spring Boot sẽ không thể khởi động thành công.
    //    Sử dụng luồng phụ "python-ai-log-reader" chạy song song (background thread) giúp ứng dụng chính khởi động bình thường
    //    trong khi vẫn in log từ con AI ra màn hình.
    @PostConstruct
    public void startPythonServer() {
        // Tính đường dẫn tới thư mục ai_service (ở thư mục hiện tại hoặc thư mục cha nếu đang chạy từ backend/)
        File workDir = Paths.get(System.getProperty("user.dir"), "ai_service").toFile();
        if (!workDir.exists()) {
            workDir = Paths.get(System.getProperty("user.dir"), "..", "ai_service").toFile();
        }
        File scriptFile = new File(workDir, "ai_service.py");

        if (!scriptFile.exists()) {
            log.warn("[PythonRunner] Không tìm thấy script tại: {}. Bỏ qua khởi động.", scriptFile.getAbsolutePath());
            return;
        }

        log.info("[PythonRunner] Khởi động Python AI Server từ: {}", workDir.getAbsolutePath());

        // Thử các lệnh python theo thứ tự ưu tiên
        String[] pythonCommands = {"python", "python3", "py"};
        for (String cmd : pythonCommands) {
            try {
                ProcessBuilder pb = new ProcessBuilder(cmd, "-Xutf8", "ai_service.py");
                pb.directory(workDir);
                pb.redirectErrorStream(true); // gộp stderr vào stdout
                pythonProcess = pb.start();

                // Luồng riêng để đọc và in log từ Python
                final Process proc = pythonProcess;
                Thread logThread = new Thread(() -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(proc.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            log.info("[PythonAI] {}", line);
                        }
                    } catch (IOException ignored) {}
                }, "python-ai-log-reader");
                logThread.setDaemon(true);
                logThread.start();

                // Đợi 2 giây để Python kịp bind port 5000
                Thread.sleep(2000);

                if (pythonProcess.isAlive()) {
                    log.info("[PythonRunner] ✅ Python AI Server đã khởi động thành công bằng lệnh '{}'.", cmd);
                    return;
                } else {
                    log.warn("[PythonRunner] Lệnh '{}' khởi động nhưng process chết ngay.", cmd);
                }
            } catch (IOException e) {
                log.warn("[PythonRunner] Lệnh '{}' không khả dụng: {}", cmd, e.getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("[PythonRunner] Bị gián đoạn khi chờ Python khởi động.");
                return;
            }
        }

        log.error("[PythonRunner] ❌ Không thể khởi động Python AI Server. Hãy chắc chắn Python đã được cài đặt.");
    }

    @PreDestroy
    public void stopPythonServer() {
        if (pythonProcess != null && pythonProcess.isAlive()) {
            log.info("[PythonRunner] Đang dừng Python AI Server...");
            pythonProcess.destroy();
            try {
                pythonProcess.waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log.info("[PythonRunner] ✅ Python AI Server đã dừng.");
        }
    }
}
