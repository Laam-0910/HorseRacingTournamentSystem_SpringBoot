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

    @PostConstruct
    public void startPythonServer() {
        // Tính đường dẫn tuyệt đối tới thư mục python_ai
        File workDir = Paths.get(System.getProperty("user.dir"), "python_ai").toFile();
        if (!workDir.exists()) {
            // Thử relative từ backend/
            workDir = new File("python_ai");
        }
        File scriptFile = new File(workDir, "app.py");

        if (!scriptFile.exists()) {
            log.warn("[PythonRunner] Không tìm thấy script tại: {}. Bỏ qua khởi động.", scriptFile.getAbsolutePath());
            return;
        }

        log.info("[PythonRunner] Khởi động Python AI Server từ: {}", workDir.getAbsolutePath());

        // Thử các lệnh python theo thứ tự ưu tiên
        String[] pythonCommands = {"python", "python3", "py"};
        for (String cmd : pythonCommands) {
            try {
                ProcessBuilder pb = new ProcessBuilder(cmd, "-Xutf8", "app.py");
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
