package controller;

import java.io.IOException;
import java.sql.Date;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.DAO.SeasonDAO;
import model.DTO.SeasonDTO;
import model.DAO.SeasonClassRuleDAO;
import model.DTO.SeasonClassRuleDTO;
import model.DAO.SystemConfigDAO;
import model.DTO.SystemConfigDTO;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@WebServlet(name = "SeasonController", urlPatterns = {"/SeasonController"})
public class SeasonController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");
        
        String action = request.getParameter("action");
        SeasonDAO seasonDAO = new SeasonDAO();

        if ("init".equals(action)) {
            String name = request.getParameter("name");
            String startDateStr = request.getParameter("startDate");
            String endDateStr = request.getParameter("endDate");
            String classRuleMethod = request.getParameter("classRuleMethod");
            String[] selectedClasses = request.getParameterValues("selectedClasses");

            if (name != null && startDateStr != null && endDateStr != null) {
                try {
                    java.text.SimpleDateFormat dateParser = new java.text.SimpleDateFormat("dd/MM/yyyy");
                    Date startDate = new Date(dateParser.parse(startDateStr).getTime());
                    Date endDate = new Date(dateParser.parse(endDateStr).getTime());
                    
                    java.time.LocalDate startLocal = startDate.toLocalDate();
                    java.time.LocalDate endLocal = endDate.toLocalDate();
                    java.time.LocalDate today = java.time.LocalDate.now();
                    
                    if (endLocal.isBefore(startLocal)) {
                        request.getSession().setAttribute("error", "End date cannot be before start date.");
                        response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
                        return;
                    } else {
                        List<SeasonDTO> existingSeasons = seasonDAO.getAll();
                        if (existingSeasons != null) {
                            for (SeasonDTO s : existingSeasons) {
                                java.sql.Date sStart = s.getStartDate();
                                java.sql.Date sEnd = s.getEndDate();
                                if (sStart != null && sEnd != null) {
                                    if (!startDate.after(sEnd) && !endDate.before(sStart)) {
                                        request.getSession().setAttribute("error", "Season dates overlap with an existing season: " + s.getName() + " (" + dateParser.format(sStart) + " to " + dateParser.format(sEnd) + ").");
                                        response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
                                        return;
                                    }
                                }
                            }
                        }

                        SeasonDTO season = new SeasonDTO();
                        season.setName(name);
                        season.setStartDate(startDate);
                        season.setEndDate(endDate);
                        season.setStatus("ACTIVE"); 

                        if (seasonDAO.insert(season)) {
                            SystemConfigDAO configDAO = new SystemConfigDAO();
                            SeasonClassRuleDAO ruleDAO = new SeasonClassRuleDAO();
                            List<SeasonClassRuleDTO> createdRules = new ArrayList<>();
                            boolean isManual = "MANUAL".equals(classRuleMethod);
                            
                            for (int i = 1; i <= 5; i++) {
                                SeasonClassRuleDTO rule = new SeasonClassRuleDTO();
                                rule.setSeasonId(season.getId());
                                rule.setClassLevel("Class " + i);
                                rule.setClassName("Class " + i + " Division");
                                
                                String minRStr, maxRStr, minPStr, maxPStr;
                                if (isManual) {
                                    minRStr = request.getParameter("manual_class_" + i + "_minRating");
                                    maxRStr = request.getParameter("manual_class_" + i + "_maxRating");
                                    minPStr = request.getParameter("manual_class_" + i + "_minPrize");
                                    maxPStr = request.getParameter("manual_class_" + i + "_maxPrize");
                                } else {
                                    minRStr = configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MIN_RATING", getDefaultMinRating(i));
                                    maxRStr = configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MAX_RATING", getDefaultMaxRating(i));
                                    minPStr = configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MIN_PRIZE", getDefaultMinPrize(i));
                                    maxPStr = configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MAX_PRIZE", getDefaultMaxPrize(i));
                                }
                                
                                rule.setMinRating(minRStr == null || minRStr.trim().isEmpty() ? null : Integer.parseInt(minRStr.trim()));
                                rule.setMaxRating(maxRStr == null || maxRStr.trim().isEmpty() ? null : Integer.parseInt(maxRStr.trim()));
                                rule.setMinPrize(minPStr == null || minPStr.trim().isEmpty() ? null : new java.math.BigDecimal(minPStr.trim()));
                                rule.setMaxPrize(maxPStr == null || maxPStr.trim().isEmpty() ? null : new java.math.BigDecimal(maxPStr.trim()));
                                
                                ruleDAO.insert(rule);
                                createdRules.add(rule);
                            }
                            
                            if (isManual) {
                                request.getSession().setAttribute("success", "Season and manual class rules initialized successfully.");
                                response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
                                return;
                            } else {
                                request.setAttribute("rules", createdRules);
                                request.setAttribute("season", season);
                                request.setAttribute("currentView", "season-rules");
                                utils.DashboardUtils.updatePendingCount(request);
                                request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
                                return;
                            }
                        } else {
                            request.getSession().setAttribute("error", "Failed to initialize season.");
                            response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
                            return;
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("error", "Error creating season: " + e.getMessage());
                    response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
                    return;
                }
            }
            response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
        } else if ("saveRules".equals(action)) {
            String seasonIdStr = request.getParameter("seasonId");
            if (seasonIdStr != null) {
                try {
                    int seasonId = Integer.parseInt(seasonIdStr);
                    SeasonClassRuleDAO ruleDAO = new SeasonClassRuleDAO();
                    List<SeasonClassRuleDTO> rules = ruleDAO.getBySeasonId(seasonId);
                    if (rules != null) {
                        for (SeasonClassRuleDTO rule : rules) {
                            String minRatingStr = request.getParameter("minRating_" + rule.getId());
                            String maxRatingStr = request.getParameter("maxRating_" + rule.getId());
                            String minPrizeStr = request.getParameter("minPrize_" + rule.getId());
                            String maxPrizeStr = request.getParameter("maxPrize_" + rule.getId());
                            
                            if (minRatingStr != null && !minRatingStr.trim().isEmpty()) {
                                rule.setMinRating(Integer.parseInt(minRatingStr.trim()));
                            } else {
                                rule.setMinRating(null);
                            }
                            
                            if (maxRatingStr != null && !maxRatingStr.trim().isEmpty()) {
                                rule.setMaxRating(Integer.parseInt(maxRatingStr.trim()));
                            } else {
                                rule.setMaxRating(null);
                            }
                            
                            if (minPrizeStr != null && !minPrizeStr.trim().isEmpty()) {
                                rule.setMinPrize(new java.math.BigDecimal(minPrizeStr.trim()));
                            } else {
                                rule.setMinPrize(null);
                            }
                            
                            if (maxPrizeStr != null && !maxPrizeStr.trim().isEmpty()) {
                                rule.setMaxPrize(new java.math.BigDecimal(maxPrizeStr.trim()));
                            } else {
                                rule.setMaxPrize(null);
                            }
                            
                            ruleDAO.update(rule);
                        }
                    }
                    request.getSession().setAttribute("success", "Season class rules finalized successfully.");
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("error", "Error saving season class rules: " + e.getMessage());
                }
            }
            response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");

        } else if ("toggleStatus".equals(action)) {
            String seasonIdStr = request.getParameter("seasonId");
            if (seasonIdStr != null) {
                try {
                    Integer seasonId = Integer.parseInt(seasonIdStr);
                    SeasonDTO season = seasonDAO.getById(seasonId);
                    if (season != null) {
                        if ("ACTIVE".equals(season.getStatus())) {
                            season.setStatus("CLOSED");
                            request.getSession().setAttribute("success", "Season marked as Closed.");
                        } else {
                            season.setStatus("ACTIVE");
                            request.getSession().setAttribute("success", "Season marked as Active.");
                        }
                        seasonDAO.update(season);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/SeasonController?view=season");
        } else {
            List<SeasonDTO> list = seasonDAO.getAll();
            request.setAttribute("seasons", list);
            SystemConfigDAO configDAO = new SystemConfigDAO();
            request.setAttribute("templateRules", getDefaultRulesTemplate(configDAO));
            request.setAttribute("currentView", "season");
            utils.DashboardUtils.updatePendingCount(request);
            request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
        }
    }

    private List<Map<String, Object>> getDefaultRulesTemplate(SystemConfigDAO configDAO) {
        List<Map<String, Object>> template = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("classLevel", "Class " + i);
            row.put("minRating", configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MIN_RATING", getDefaultMinRating(i)));
            row.put("maxRating", configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MAX_RATING", getDefaultMaxRating(i)));
            row.put("minPrize", configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MIN_PRIZE", getDefaultMinPrize(i)));
            row.put("maxPrize", configDAO.getConfigValueOrDefault("DEFAULT_CLASS_" + i + "_MAX_PRIZE", getDefaultMaxPrize(i)));
            template.add(row);
        }
        return template;
    }

    private String getDefaultMinRating(int level) {
        if (level == 1) return "95";
        if (level == 2) return "80";
        if (level == 3) return "60";
        if (level == 4) return "40";
        return "0";
    }

    private String getDefaultMaxRating(int level) {
        if (level == 1) return "";
        if (level == 2) return "94";
        if (level == 3) return "79";
        if (level == 4) return "59";
        return "39";
    }

    private String getDefaultMinPrize(int level) {
        if (level == 1) return "300000.00";
        if (level == 2) return "200000.00";
        if (level == 3) return "100000.00";
        if (level == 4) return "50000.00";
        return "20000.00";
    }

    private String getDefaultMaxPrize(int level) {
        if (level == 1) return "1000000.00";
        if (level == 2) return "299999.00";
        if (level == 3) return "199999.00";
        if (level == 4) return "99999.00";
        return "49999.00";
    }



    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }
}
