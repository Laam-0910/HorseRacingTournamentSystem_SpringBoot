package controller;

import java.io.IOException;
import java.util.Enumeration;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import model.DAO.SystemConfigDAO;
import model.DTO.SystemConfigDTO;

@WebServlet(name = "SystemConfigController", urlPatterns = {"/admin/system-config"})
public class SystemConfigController extends HttpServlet {

    private final SystemConfigDAO configDAO = new SystemConfigDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // Initialize default values if not present
        initDefaultConfigs();
        
        List<SystemConfigDTO> configs = configDAO.getAll();
        request.setAttribute("configs", configs);
        
        request.setAttribute("currentView", "config");
        utils.DashboardUtils.updatePendingCount(request);
        request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // Form submits all inputs with their name as config_key and value as config_value
        Enumeration<String> parameterNames = request.getParameterNames();
        while (parameterNames.hasMoreElements()) {
            String key = parameterNames.nextElement();
            String value = request.getParameter(key);
            
            SystemConfigDTO config = new SystemConfigDTO();
            config.setConfigKey(key);
            config.setConfigValue(value);
            config.setDescription(key + " configuration");
            config.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            
            configDAO.saveOrUpdate(config);
        }
        
        // Set success message and reload
        request.setAttribute("message", "System Configurations updated successfully!");
        
        List<SystemConfigDTO> configs = configDAO.getAll();
        request.setAttribute("configs", configs);
        request.setAttribute("currentView", "config");
        utils.DashboardUtils.updatePendingCount(request);
        request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
    }
    
    private void initDefaultConfigs() {
        // Prediction Weights
        createIfNotExist("PREDICT_WEIGHT_HORSE", "0.40", "Weight for Horse Win Rate in Prediction Score");
        createIfNotExist("PREDICT_WEIGHT_JOCKEY", "0.25", "Weight for Jockey Skill in Prediction Score");
        createIfNotExist("PREDICT_WEIGHT_CLASS", "0.20", "Weight for Class Score in Prediction Score");
        createIfNotExist("PREDICT_WEIGHT_FORM", "0.15", "Weight for Recent Form in Prediction Score");
        
        // Ranking Scoring
        createIfNotExist("RANKING_WEIGHT_POSITION", "0.50", "Weight for Position Points in Final Score");
        createIfNotExist("RANKING_WEIGHT_WIN_RATE", "0.30", "Weight for Win Rate in Final Score");
        createIfNotExist("RANKING_WEIGHT_EARNINGS", "0.20", "Weight for Earnings Score in Final Score");
        
        // OTP Configuration
        createIfNotExist("REQUIRE_EMAIL_OTP", "true", "Require email OTP verification for Spectator, Horse Owner, and Jockey roles (true/false)");
    }
    
    private void createIfNotExist(String key, String defaultValue, String description) {
        SystemConfigDTO config = configDAO.getByConfigKey(key);
        if (config == null) {
            config = new SystemConfigDTO();
            config.setConfigKey(key);
            config.setConfigValue(defaultValue);
            config.setDescription(description);
            config.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            configDAO.saveOrUpdate(config);
        }
    }
}
