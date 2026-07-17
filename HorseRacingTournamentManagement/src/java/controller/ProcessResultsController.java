package controller;

import java.io.IOException;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.DAO.RaceDAO;
import model.DAO.RaceMeetingDAO;
import model.DAO.SeasonClassRuleDAO;
import model.DTO.RaceDTO;
import model.DTO.RaceMeetingDTO;
import model.DTO.SeasonClassRuleDTO;

@WebServlet(name = "ProcessResultsController", urlPatterns = {"/ProcessResultsController"})
public class ProcessResultsController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        
        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();
        
        RaceMeetingDAO raceMeetingDAO = new RaceMeetingDAO();
        RaceDAO raceDAO = new RaceDAO();
        SeasonClassRuleDAO seasonClassRuleDAO = new SeasonClassRuleDAO();

        // Get all race meetings
        List<RaceMeetingDTO> raceMeetings = raceMeetingDAO.getAll();
        request.setAttribute("raceMeetings", raceMeetings);

        // Get all races
        List<RaceDTO> races = raceDAO.getAll();
        request.setAttribute("races", races);

        // Get all class rules
        List<SeasonClassRuleDTO> classRules = seasonClassRuleDAO.getAll();
        request.setAttribute("classRules", classRules);

        // Forward to admin dashboard with view=results
        request.setAttribute("currentView", "results");
        utils.DashboardUtils.updatePendingCount(request);
        request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
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
