package controller;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

@WebListener
public class PythonStartupListener implements ServletContextListener {

    private Process pythonProcess;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            String pythonPath = "python"; // hoặc "python3" tùy máy
            String scriptPath = sce.getServletContext()
                                   .getRealPath("/WEB-INF/python/app.py");
            ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptPath);
            pb.redirectErrorStream(true);
            pythonProcess = pb.start();
            System.out.println("Python AI server started.");
        } catch (Exception e) {
            System.err.println("Failed to start Python: " + e.getMessage());
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (pythonProcess != null) {
            pythonProcess.destroy();
            System.out.println("Python AI server stopped.");
        }
    }
}