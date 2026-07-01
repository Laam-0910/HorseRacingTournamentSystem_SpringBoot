package com.horseracing.backend.runner;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

@Component
@Slf4j
public class PythonStartupRunner {

    private Process pythonProcess;

    @PostConstruct
    public void startPythonServer() {
        log.info("Starting Python AI Server...");
        String scriptPath = "./python_ai/app.py";
        File scriptFile = new File(scriptPath);
        if (!scriptFile.exists()) {
            log.warn("Python AI script not found at {}. Skipping startup.", scriptFile.getAbsolutePath());
            return;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("python", scriptFile.getName());
            pb.directory(scriptFile.getParentFile());
            pb.redirectErrorStream(true);
            pythonProcess = pb.start();
            log.info("Python AI Server process started with 'python' command.");
        } catch (IOException e) {
            log.warn("Failed to start with 'python' command, trying 'python3'...");
            try {
                ProcessBuilder pb = new ProcessBuilder("python3", scriptFile.getName());
                pb.directory(scriptFile.getParentFile());
                pb.redirectErrorStream(true);
                pythonProcess = pb.start();
                log.info("Python AI Server process started with 'python3' command.");
            } catch (IOException ex) {
                log.error("Failed to start Python AI Server: {}", ex.getMessage());
            }
        }
    }

    @PreDestroy
    public void stopPythonServer() {
        if (pythonProcess != null && pythonProcess.isAlive()) {
            log.info("Stopping Python AI Server...");
            pythonProcess.destroy();
            log.info("Python AI Server stopped.");
        }
    }
}
