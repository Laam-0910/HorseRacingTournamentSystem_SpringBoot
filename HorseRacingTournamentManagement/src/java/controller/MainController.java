package controller;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 * MainController - Central Router / Dispatcher
 * Receives all requests from the front end and distributes them to sub-controllers.
 */
@WebServlet(name = "MainController", urlPatterns = {"/MainController"})
public class MainController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("text/html;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        // Dynamically update race statuses based on the current time
        utils.DashboardUtils.updateRaceStatuses();

        String action = request.getParameter("action");
        String url = "/WEB-INF/landing/landing.jsp"; // Default page if no action is provided

        if (action == null || "home".equals(action) || "about".equals(action)) {
            prepareLandingData(request);
            if ("about".equals(action)) {
                prepareAboutData(request);
            }
            request.getRequestDispatcher(url).forward(request, response);
            return;
        }

        HttpSession session = request.getSession();

        try {
            switch (action) {
                // ================== USER & AUTH ACTIONS ==================
                case "loginPage":
                    url = "/WEB-INF/auth/login.jsp";
                    break;
                case "registerPage":
                    url = "/WEB-INF/auth/register.jsp";
                    break;
                case "forgotPasswordPage":
                    url = "/WEB-INF/auth/forgot-password.jsp";
                    break;
                case "verifyRegisterPage":
                    url = "/WEB-INF/auth/verify-register.jsp";
                    break;
                case "verifyLoginPage":
                    url = "/WEB-INF/auth/verify-login.jsp";
                    break;
                case "verifyForgotPasswordPage":
                    url = "/WEB-INF/auth/verify-forgot.jsp";
                    break;
                case "login":
                case "logout":
                case "register":
                case "forgotPassword":
                case "verifyLogin":
                case "verifyRegister":
                case "verifyForgotPassword":
                    url = "UserController";
                    break;
                case "home":
                    url = "/WEB-INF/landing/landing.jsp";
                    break;
                case "dashboard":
                    if (session.getAttribute("user") == null) {
                        request.setAttribute("message", "Please sign in to access your dashboard.");
                        url = "/WEB-INF/auth/login.jsp";
                    } else {
                        model.DTO.UserDTO u = (model.DTO.UserDTO) session.getAttribute("user");
                        int roleId = u.getRoleId();
                        
                        model.DAO.RaceMeetingDAO rmDAO = new model.DAO.RaceMeetingDAO();
                        model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
                        model.DAO.HorseDAO horseDAO = new model.DAO.HorseDAO();
                        model.DAO.SeasonDAO seasonDAO = new model.DAO.SeasonDAO();

                        // Load data for embedded components
                        java.util.List<model.DTO.RaceMeetingDTO> meetings = rmDAO.getAll();
                        request.setAttribute("meetings", meetings);
                        request.setAttribute("upcomingMeetings", meetings);
                        request.setAttribute("resultMeetings", meetings);
                        request.setAttribute("liveRaces", raceDAO.getLiveRaces());
                        request.setAttribute("allRaces", raceDAO.getAll());
                        request.setAttribute("allHorses", horseDAO.findAll());
                        request.setAttribute("activeSeasons", seasonDAO.getAll().stream()
                                .filter(s -> "ACTIVE".equals(s.getStatus()))
                                .collect(java.util.stream.Collectors.toList()));

                        String view = request.getParameter("view");
                        if ("races".equals(view)) {
                            prepareRacecardData(request, rmDAO, raceDAO);
                        } else if ("results".equals(view)) {
                            prepareResultsData(request, rmDAO, raceDAO);
                        }
                        
                        if (roleId == 1) url = "AdminUserController";
                        else if (roleId == 5) url = "RefereeController";
                        else if (roleId == 4) url = "/WEB-INF/landing/landing.jsp";
                        else if (roleId == 2) url = "HorseOwnerController";
                        else if (roleId == 3) url = "JockeyController";
                        else url = "/WEB-INF/landing/landing.jsp";
                    }
                    break;

                // ================== PUBLIC LANDING PAGES ==================
                case "racecard":
                case "results":
                case "fixtures":
                case "statistics":
                case "horses":
                case "jockeys_owners":
                case "incident":
                    url = "/WEB-INF/landing/landing.jsp";
                    break;

                // ================== HORSE OWNER ACTIONS ==================
                case "registerOwner":
                case "addHorseToStable":
                case "updateHorse":
                case "getHorseHistory":
                case "registerAdditionalHorses":
                case "registerHorseForRace":
                case "inviteJockey":
                case "confirmJockey":
                case "viewDashboard":
                    if (session.getAttribute("user") == null) {
                        request.setAttribute("message", "Please sign in to access this feature.");
                        url = "/WEB-INF/auth/login.jsp";
                    } else {
                        url = "HorseOwnerController";
                    }
                    break;

                // ================== JOCKEY ACTIONS ==================
                case "jockeyViewDashboard":
                case "jockeyRegisterMeeting":
                case "jockeyRespondInvitation":
                    if (session.getAttribute("user") == null) {
                        request.setAttribute("message", "Please sign in to access this feature.");
                        url = "/WEB-INF/auth/login.jsp";
                    } else {
                        url = "JockeyController";
                    }
                    break;

                // ================== REFEREE ACTIONS ==================
                case "refereeViewDashboard":
                case "refereeAddViolation":
                case "refereeConfirmResults":
                case "refereePreRaceCheck":
                case "refereeStartRace":
                    if (session.getAttribute("user") == null) {
                        request.setAttribute("message", "Please sign in to access this feature.");
                        url = "/WEB-INF/auth/login.jsp";
                    } else {
                        url = "RefereeController";
                    }
                    break;

                default:
                    url = "/WEB-INF/landing/landing.jsp"; // Safe fallback
                    break;
            }

            // Prepare data for landing page if needed
            if (url.equals("/WEB-INF/landing/landing.jsp")) {
                model.DAO.SeasonDAO seasonDAO = new model.DAO.SeasonDAO();
                java.util.List<model.DTO.SeasonDTO> activeSeasons = seasonDAO.getAll().stream()
                        .filter(s -> "ACTIVE".equals(s.getStatus()))
                        .collect(java.util.stream.Collectors.toList());
                request.setAttribute("activeSeasons", activeSeasons);

                model.DAO.RaceMeetingDAO rmDAO = new model.DAO.RaceMeetingDAO();
                java.util.List<model.DTO.RaceMeetingDTO> meetings = rmDAO.getAll();
                request.setAttribute("upcomingMeetings", meetings);
                request.setAttribute("meetings", meetings);

                model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
                java.util.List<model.DTO.RaceDTO> allRaces = raceDAO.getAll();
                java.util.List<model.DTO.RaceDTO> scheduledRaces = allRaces.stream()
                        .filter(r -> "SCHEDULED".equals(r.getStatus()) || "DECLARATION_OPEN".equals(r.getStatus()) || "DECLARATION_CLOSED".equals(r.getStatus()))
                        .collect(java.util.stream.Collectors.toList());
                request.setAttribute("scheduledRaces", scheduledRaces);
                request.setAttribute("liveRaces", raceDAO.getLiveRaces());
                request.setAttribute("allRaces", allRaces);

                model.DAO.HorseDAO genericHorseDAO = new model.DAO.HorseDAO();
                model.DAO.UserDAO genericUserDAO = new model.DAO.UserDAO();
                java.util.List<model.DTO.HorseDTO> rawHorses = genericHorseDAO.findAll();
                java.util.List<java.util.Map<String, Object>> enrichedHorses = new java.util.ArrayList<>();
                if (rawHorses != null) {
                    for (model.DTO.HorseDTO h : rawHorses) {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", h.getId());
                        map.put("name", h.getName());
                        map.put("breed", h.getBreed());
                        map.put("currentRating", h.getCurrentRating());
                        map.put("totalRaces", h.getTotalRaces());
                        map.put("totalWins", h.getTotalWins());
                        map.put("status", h.getStatus());
                        map.put("ownerId", h.getOwnerId());
                        
                        model.DTO.UserDTO owner = genericUserDAO.getById(h.getOwnerId());
                        map.put("ownerName", owner != null ? owner.getUsername() : "Unknown");
                        enrichedHorses.add(map);
                    }
                }
                request.setAttribute("allHorses", enrichedHorses);

                if (action != null) {
                    switch (action) {
                        case "racecard": {
                            prepareRacecardData(request, rmDAO, raceDAO);
                            break;
                        }
                        case "fixtures": {
                            prepareFixturesData(request, rmDAO, raceDAO);
                            break;
                        }
                        case "statistics": {
                            prepareStatisticsData(request);
                            break;
                        }
                        case "horses": {
                            model.DAO.HorseDAO hHorseDAO = new model.DAO.HorseDAO();
                            model.DAO.UserDAO hUserDAO = new model.DAO.UserDAO();
                            String horseIdParam = request.getParameter("horseId");
                            if (horseIdParam != null && !horseIdParam.trim().isEmpty()) {
                                try {
                                    int horseId = Integer.parseInt(horseIdParam);
                                    model.DTO.HorseDTO hDTO = hHorseDAO.findById(horseId);
                                    if (hDTO != null) {
                                        java.util.Map<String, Object> horseMap = new java.util.HashMap<>();
                                        horseMap.put("id", hDTO.getId());
                                        horseMap.put("name", hDTO.getName());
                                        horseMap.put("breed", hDTO.getBreed());
                                        horseMap.put("currentRating", hDTO.getCurrentRating());
                                        horseMap.put("totalRaces", hDTO.getTotalRaces());
                                        horseMap.put("totalWins", hDTO.getTotalWins());
                                        
                                        int age = 4;
                                        if (hDTO.getDateOfBirth() != null) {
                                            java.util.Calendar dob = java.util.Calendar.getInstance();
                                            dob.setTime(hDTO.getDateOfBirth());
                                            int birthYear = dob.get(java.util.Calendar.YEAR);
                                            int currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR);
                                            age = currentYear - birthYear;
                                        }
                                        horseMap.put("age", age);
                                        horseMap.put("sex", "N/A");
                                        horseMap.put("trainer", "N/A");
                                        horseMap.put("sire", "N/A");
                                        horseMap.put("dam", "N/A");
                                        
                                        model.DTO.UserDTO ownerUser = hUserDAO.getById(hDTO.getOwnerId());
                                        horseMap.put("owner", ownerUser != null ? ownerUser.getUsername() : "Unknown");
                                        request.setAttribute("horse", horseMap);

                                        model.DAO.RaceEntryDAO hEntryDAO = new model.DAO.RaceEntryDAO();
                                        java.util.List<model.DTO.RaceEntryDTO> entries = hEntryDAO.getByHorseId(horseId);
                                        java.util.List<java.util.Map<String, Object>> recentRuns = new java.util.ArrayList<>();
                                        for (model.DTO.RaceEntryDTO entry : entries) {
                                            java.util.Map<String, Object> runMap = new java.util.HashMap<>();
                                            runMap.put("raceNumber", entry.getRaceId());
                                            
                                            model.DTO.RaceDTO race = new model.DAO.RaceDAO().getById(entry.getRaceId());
                                            if (race != null) {
                                                runMap.put("raceName", "Class " + race.getClassLevel() + " Stakes");
                                                runMap.put("date", race.getStartTime());
                                            } else {
                                                runMap.put("raceName", "Unknown Stakes");
                                                runMap.put("date", new java.util.Date());
                                            }
                                            
                                            model.DTO.UserDTO jockeyUser = hUserDAO.getById(entry.getJockeyId());
                                            runMap.put("jockey", jockeyUser != null ? jockeyUser.getUsername() : "Unknown");
                                            runMap.put("position", entry.getFinalPosition() != null ? entry.getFinalPosition() : 0);
                                            runMap.put("margin", "N/A");
                                            runMap.put("odds", "N/A");
                                            recentRuns.add(runMap);
                                        }
                                        request.setAttribute("recentRuns", recentRuns);
                                    }
                                } catch (NumberFormatException e) {
                                    e.printStackTrace();
                                }
                            } else {
                                java.util.List<model.DTO.HorseDTO> rawHorsesList = hHorseDAO.findAll();
                                java.util.List<java.util.Map<String, Object>> enrichedHorsesList = new java.util.ArrayList<>();
                                for (model.DTO.HorseDTO hDTO : rawHorsesList) {
                                    java.util.Map<String, Object> horseMap = new java.util.HashMap<>();
                                    horseMap.put("id", hDTO.getId());
                                    horseMap.put("name", hDTO.getName());
                                    horseMap.put("breed", hDTO.getBreed());
                                    horseMap.put("currentRating", hDTO.getCurrentRating());
                                    horseMap.put("totalRaces", hDTO.getTotalRaces());
                                    horseMap.put("totalWins", hDTO.getTotalWins());
                                    horseMap.put("status", hDTO.getStatus());
                                    
                                    model.DTO.UserDTO ownerUser = hUserDAO.getById(hDTO.getOwnerId());
                                    horseMap.put("ownerName", ownerUser != null ? ownerUser.getUsername() : "Unknown");
                                    enrichedHorsesList.add(horseMap);
                                }
                                request.setAttribute("allHorses", enrichedHorsesList);
                            }
                            break;
                        }
                        
                        case "jockeys_owners": {
                            model.DAO.UserDAO joUserDAO = new model.DAO.UserDAO();
                            model.DAO.HorseDAO joHorseDAO = new model.DAO.HorseDAO();
                            
                            java.util.List<model.DTO.UserDTO> rawJockeys = joUserDAO.getByRoleId(3);
                            java.util.List<java.util.Map<String, Object>> jockeys = new java.util.ArrayList<>();
                            for (model.DTO.UserDTO u : rawJockeys) {
                                java.util.Map<String, Object> map = new java.util.HashMap<>();
                                map.put("id", u.getId());
                                map.put("name", u.getUsername());
                                map.put("email", u.getEmail());
                                map.put("phone", "N/A");
                                map.put("totalRaces", u.getTotalRacesParticipated() != null ? u.getTotalRacesParticipated() : 0);
                                map.put("status", u.getStatus() != null ? u.getStatus() : "Active");
                                jockeys.add(map);
                            }
                            
                            java.util.List<model.DTO.UserDTO> rawOwners = joUserDAO.getByRoleId(2);
                            java.util.List<java.util.Map<String, Object>> owners = new java.util.ArrayList<>();
                            for (model.DTO.UserDTO u : rawOwners) {
                                java.util.Map<String, Object> map = new java.util.HashMap<>();
                                map.put("id", u.getId());
                                map.put("name", u.getUsername());
                                map.put("email", u.getEmail());
                                map.put("phone", "N/A");
                                
                                java.util.List<model.DTO.HorseDTO> ownedList = joHorseDAO.findByOwnerId(u.getId());
                                map.put("horsesOwned", ownedList != null ? ownedList.size() : 0);
                                map.put("status", u.getStatus() != null ? u.getStatus() : "Active");
                                owners.add(map);
                            }
                            
                            java.util.Map<String, Object> stats = new java.util.HashMap<>();
                            stats.put("totalJockeys", jockeys.size());
                            stats.put("totalOwners", owners.size());
                            
                            int activeJockeysCount = 0;
                            for (java.util.Map<String, Object> j : jockeys) {
                                if ("ACTIVE".equalsIgnoreCase((String) j.get("status")) || "Active".equalsIgnoreCase((String) j.get("status"))) {
                                    activeJockeysCount++;
                                }
                            }
                            int activeOwnersCount = 0;
                            for (java.util.Map<String, Object> o : owners) {
                                if ("ACTIVE".equalsIgnoreCase((String) o.get("status")) || "Active".equalsIgnoreCase((String) o.get("status"))) {
                                    activeOwnersCount++;
                                }
                            }
                            stats.put("activeMembers", activeJockeysCount + activeOwnersCount);
                            
                            request.setAttribute("jockeys", jockeys);
                            request.setAttribute("owners", owners);
                            request.setAttribute("stats", stats);
                            break;
                        }
                        
                        case "incident": {
                            model.DAO.ViolationDAO incViolationDAO = new model.DAO.ViolationDAO();
                            model.DAO.HorseDAO incHorseDAO = new model.DAO.HorseDAO();
                            model.DAO.UserDAO incUserDAO = new model.DAO.UserDAO();
                            
                            java.util.List<model.DTO.ViolationDTO> rawViolations = incViolationDAO.getAll();
                            java.util.List<java.util.Map<String, Object>> incidents = new java.util.ArrayList<>();
                            
                            int total = rawViolations.size();
                            int resolvedCount = 0;
                            int underReviewCount = 0;
                            
                            for (model.DTO.ViolationDTO v : rawViolations) {
                                java.util.Map<String, Object> map = new java.util.HashMap<>();
                                map.put("id", v.getId());
                                map.put("description", v.getDescription());
                                map.put("penalty", v.getPenalty());
                                
                                model.DTO.RaceDTO race = new model.DAO.RaceDAO().getById(v.getRaceId());
                                if (race != null) {
                                    map.put("raceName", "Class " + race.getClassLevel() + " Stakes");
                                    map.put("date", race.getStartTime());
                                } else {
                                    map.put("raceName", "Race #" + v.getRaceId());
                                    map.put("date", new java.util.Date());
                                }
                                
                                model.DTO.HorseDTO horse = incHorseDAO.findById(v.getHorseId());
                        map.put("horseName", horse != null ? horse.getName() : "Horse #" + v.getHorseId());
                                
                                model.DTO.UserDTO jockey = incUserDAO.getById(v.getJockeyId());
                                map.put("jockeyName", jockey != null ? jockey.getUsername() : "Jockey #" + v.getJockeyId());
                                
                                 String descLower = v.getDescription() != null ? v.getDescription().toLowerCase() : "";
                                 String severity = "Low";
                                 if (descLower.contains("dangerous") || descLower.contains("dq") || descLower.contains("disqualified") || descLower.contains("nguy hiểm") || descLower.contains("truất quyền")) {
                                     severity = "High";
                                 } else if (descLower.contains("warn") || descLower.contains("careless") || descLower.contains("cảnh cáo") || descLower.contains("bất cẩn")) {
                                     severity = "Medium";
                                 } else if (!descLower.isEmpty()) {
                                     severity = "Medium";
                                 }
                                 map.put("severity", severity);
                                
                                String status = "Under Review";
                                if (v.getPenalty() != null && !v.getPenalty().trim().isEmpty() && !v.getPenalty().equalsIgnoreCase("none")) {
                                    status = "Resolved";
                                    resolvedCount++;
                                } else {
                                    underReviewCount++;
                                }
                                map.put("status", status);
                                
                                incidents.add(map);
                            }
                            
                            java.util.Map<String, Object> stats = new java.util.HashMap<>();
                            stats.put("total", total);
                            stats.put("resolved", resolvedCount);
                            stats.put("underReview", underReviewCount);
                            
                            request.setAttribute("incidents", incidents);
                            request.setAttribute("stats", stats);
                            break;
                        }
                        
                        case "results": {
                            prepareResultsData(request, rmDAO, raceDAO);
                            break;
                        }
                    }
                }
            }

            // Forward to the corresponding child controller
            request.getRequestDispatcher(url).forward(request, response);

        } catch (Exception e) {
            log("Error at MainController: " + e.toString());
            if (!response.isCommitted()) {
                response.sendRedirect("WEB-INF/auth/login.jsp"); 
            } else {
                System.out.println("Response committed, cannot redirect.");
            }
        }
    }

    private void prepareLandingData(HttpServletRequest request) {
        model.DAO.SeasonDAO seasonDAO = new model.DAO.SeasonDAO();
        java.util.List<model.DTO.SeasonDTO> activeSeasons = seasonDAO.getAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        request.setAttribute("activeSeasons", activeSeasons);

        model.DAO.RaceMeetingDAO rmDAO = new model.DAO.RaceMeetingDAO();
        java.util.List<model.DTO.RaceMeetingDTO> meetings = rmDAO.getAll();
        request.setAttribute("upcomingMeetings", meetings);
        request.setAttribute("meetings", meetings);

        model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
        java.util.List<model.DTO.RaceDTO> scheduledRaces = raceDAO.getAll().stream()
                .filter(r -> "SCHEDULED".equals(r.getStatus()) || "DECLARATION_OPEN".equals(r.getStatus()) || "DECLARATION_CLOSED".equals(r.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        request.setAttribute("scheduledRaces", scheduledRaces);

        java.util.List<model.DTO.RaceDTO> liveRaces = raceDAO.getLiveRaces();
        request.setAttribute("liveRaces", liveRaces);
    }

    private void prepareAboutData(HttpServletRequest request) {
        model.DAO.SeasonDAO seasonDAO = new model.DAO.SeasonDAO();
        model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
        model.DAO.HorseDAO horseDAO = new model.DAO.HorseDAO();
        model.DAO.UserDAO userDAO = new model.DAO.UserDAO();

        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        java.util.List<model.DTO.SeasonDTO> activeSeasons = seasonDAO.getAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        String activeSeason = !activeSeasons.isEmpty() ? activeSeasons.get(0).getName() : "None";
        stats.put("activeSeason", activeSeason);

        long seasonsCompleted = seasonDAO.getAll().stream()
                .filter(s -> !"ACTIVE".equals(s.getStatus()))
                .count();
        stats.put("seasonsCompleted", seasonsCompleted);

        java.util.List<model.DTO.RaceDTO> finishedRaces = raceDAO.getAll().stream()
                .filter(r -> "FINISHED".equals(r.getStatus()) || "COMPLETED".equals(r.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        stats.put("totalRacesRun", finishedRaces.size());

        double totalPrizeDistributed = finishedRaces.stream()
                .mapToDouble(r -> r.getPurse() != null ? r.getPurse().doubleValue() : 0.0)
                .sum();
        stats.put("totalPrizeDistributed", totalPrizeDistributed);

        long totalActiveHorses = horseDAO.findAll().stream()
                .filter(h -> "ACTIVE".equals(h.getStatus()))
                .count();
        stats.put("totalActiveHorses", totalActiveHorses);

        long totalActiveJockeys = userDAO.getByRoleId(3).stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .count();
        stats.put("totalActiveJockeys", totalActiveJockeys);

        request.setAttribute("stats", stats);
    }

    private void prepareRacecardData(HttpServletRequest request, model.DAO.RaceMeetingDAO rmDAO, model.DAO.RaceDAO raceDAO) {
        java.util.List<model.DTO.RaceMeetingDTO> meetings = rmDAO.getAll();
        String meetingIdStr = request.getParameter("meetingId");
        model.DTO.RaceMeetingDTO selectedMeeting = null;
        if (meetingIdStr != null && !meetingIdStr.trim().isEmpty()) {
            try {
                int meetingId = Integer.parseInt(meetingIdStr);
                selectedMeeting = rmDAO.getById(meetingId);
            } catch (NumberFormatException e) {}
        }
        if (selectedMeeting == null && meetings != null && !meetings.isEmpty()) {
            selectedMeeting = meetings.get(0);
        }
        request.setAttribute("selectedMeeting", selectedMeeting);

        java.util.List<model.DTO.RaceDTO> races = new java.util.ArrayList<>();
        if (selectedMeeting != null) {
            races = raceDAO.getByRaceMeetingId(selectedMeeting.getId());
        }
        request.setAttribute("races", races);

        String raceIdStr = request.getParameter("raceId");
        model.DTO.RaceDTO selectedRace = null;
        if (raceIdStr != null && !raceIdStr.trim().isEmpty()) {
            try {
                int raceId = Integer.parseInt(raceIdStr);
                for (model.DTO.RaceDTO r : races) {
                    if (r.getId().equals(raceId)) {
                        selectedRace = r;
                        break;
                    }
                }
            } catch (NumberFormatException e) {}
        }
        if (selectedRace == null && races != null && !races.isEmpty()) {
            selectedRace = races.get(0);
        }
        request.setAttribute("selectedRace", selectedRace);

        java.util.List<java.util.Map<String, Object>> enrichedEntries = new java.util.ArrayList<>();
        if (selectedRace != null) {
            model.DAO.RaceEntryDAO rcEntryDAO = new model.DAO.RaceEntryDAO();
            model.DAO.HorseDAO rcHorseDAO = new model.DAO.HorseDAO();
            model.DAO.UserDAO rcUserDAO = new model.DAO.UserDAO();
            
            java.util.List<model.DTO.RaceEntryDTO> entries = rcEntryDAO.getByRaceId(selectedRace.getId());
            if (entries != null) {
                for (model.DTO.RaceEntryDTO entry : entries) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("entry", entry);
                    
                    model.DTO.HorseDTO horse = rcHorseDAO.findById(entry.getHorseId());
                    map.put("horse", horse);
                    
                    model.DTO.UserDTO jockey = rcUserDAO.getById(entry.getJockeyId());
                    map.put("jockey", jockey);
                    
                    if (horse != null) {
                        model.DTO.UserDTO owner = rcUserDAO.getById(horse.getOwnerId());
                        map.put("owner", owner);
                    }
                    enrichedEntries.add(map);
                }
            }
        }
        enrichedEntries.sort((a, b) -> {
            model.DTO.RaceEntryDTO entryA = (model.DTO.RaceEntryDTO) a.get("entry");
            model.DTO.RaceEntryDTO entryB = (model.DTO.RaceEntryDTO) b.get("entry");
            if (entryA.getGateNumber() != null && entryB.getGateNumber() != null) {
                return entryA.getGateNumber().compareTo(entryB.getGateNumber());
            }
            return 0;
        });
        request.setAttribute("enrichedEntries", enrichedEntries);
    }

    private void prepareResultsData(HttpServletRequest request, model.DAO.RaceMeetingDAO resMeetingDAO, model.DAO.RaceDAO resRaceDAO) {
        java.util.List<model.DTO.RaceMeetingDTO> resMeetings = resMeetingDAO.getAll();
        request.setAttribute("resultMeetings", resMeetings);

        String resMeetingIdStr = request.getParameter("meetingId");
        model.DTO.RaceMeetingDTO resSelectedMeeting = null;
        if (resMeetingIdStr != null && !resMeetingIdStr.trim().isEmpty()) {
            try {
                int mid = Integer.parseInt(resMeetingIdStr);
                resSelectedMeeting = resMeetingDAO.getById(mid);
            } catch (NumberFormatException e) {}
        }
        if (resSelectedMeeting == null && resMeetings != null && !resMeetings.isEmpty()) {
            resSelectedMeeting = resMeetings.get(0);
        }
        request.setAttribute("resSelectedMeeting", resSelectedMeeting);

        java.util.List<model.DTO.RaceDTO> finishedRaces = new java.util.ArrayList<>();
        if (resSelectedMeeting != null) {
            java.util.List<model.DTO.RaceDTO> allMeetingRaces = resRaceDAO.getByRaceMeetingId(resSelectedMeeting.getId());
            for (model.DTO.RaceDTO r : allMeetingRaces) {
                if ("OFFICIAL".equals(r.getStatus()) || "RACE_EVENT_ENDED".equals(r.getStatus())) {
                    finishedRaces.add(r);
                }
            }
        }
        request.setAttribute("finishedRaces", finishedRaces);

        String resRaceIdStr = request.getParameter("raceId");
        model.DTO.RaceDTO resSelectedRace = null;
        if (resRaceIdStr != null && !resRaceIdStr.trim().isEmpty()) {
            try {
                int rid = Integer.parseInt(resRaceIdStr);
                for (model.DTO.RaceDTO r : finishedRaces) {
                    if (r.getId().equals(rid)) {
                        resSelectedRace = r;
                        break;
                    }
                }
            } catch (NumberFormatException e) {}
        }
        if (resSelectedRace == null && !finishedRaces.isEmpty()) {
            resSelectedRace = finishedRaces.get(0);
        }
        request.setAttribute("resSelectedRace", resSelectedRace);

        java.util.List<java.util.Map<String, Object>> resultEntries = new java.util.ArrayList<>();
        if (resSelectedRace != null) {
            model.DAO.RaceEntryDAO resEntryDAO = new model.DAO.RaceEntryDAO();
            model.DAO.HorseDAO resHorseDAO = new model.DAO.HorseDAO();
            model.DAO.UserDAO resUserDAO = new model.DAO.UserDAO();

            java.util.List<model.DTO.RaceEntryDTO> entries = resEntryDAO.getByRaceId(resSelectedRace.getId());
            if (entries != null) {
                for (model.DTO.RaceEntryDTO entry : entries) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("entry", entry);

                    model.DTO.HorseDTO horse = resHorseDAO.findById(entry.getHorseId());
                    map.put("horse", horse);

                    model.DTO.UserDTO jockey = resUserDAO.getById(entry.getJockeyId());
                    map.put("jockey", jockey);

                    if (horse != null) {
                        model.DTO.UserDTO owner = resUserDAO.getById(horse.getOwnerId());
                        map.put("owner", owner);
                    }
                    resultEntries.add(map);
                }
            }
        }
        resultEntries.sort((a, b) -> {
            model.DTO.RaceEntryDTO ea = (model.DTO.RaceEntryDTO) a.get("entry");
            model.DTO.RaceEntryDTO eb = (model.DTO.RaceEntryDTO) b.get("entry");
            Integer pa = ea.getFinalPosition();
            Integer pb = eb.getFinalPosition();
            if (pa == null && pb == null) return 0;
            if (pa == null) return 1;
            if (pb == null) return -1;
            return pa.compareTo(pb);
        });
        request.setAttribute("resultEntries", resultEntries);
    }

    private void prepareFixturesData(HttpServletRequest request, model.DAO.RaceMeetingDAO rmDAO, model.DAO.RaceDAO raceDAO) {
        java.util.List<model.DTO.RaceMeetingDTO> meetings = rmDAO.getAll();
        request.setAttribute("meetings", meetings);

        String meetingIdStr = request.getParameter("meetingId");
        model.DTO.RaceMeetingDTO selectedMeeting = null;
        if (meetingIdStr != null && !meetingIdStr.trim().isEmpty()) {
            try {
                int meetingId = Integer.parseInt(meetingIdStr);
                selectedMeeting = rmDAO.getById(meetingId);
            } catch (NumberFormatException e) {}
        }
        if (selectedMeeting == null && meetings != null && !meetings.isEmpty()) {
            selectedMeeting = meetings.get(0);
        }
        request.setAttribute("selectedMeeting", selectedMeeting);

        java.util.List<java.util.Map<String, Object>> raceFixtures = new java.util.ArrayList<>();
        if (selectedMeeting != null) {
            java.util.List<model.DTO.RaceDTO> races = raceDAO.getByRaceMeetingId(selectedMeeting.getId());
            model.DAO.RaceEntryDAO entryDAO = new model.DAO.RaceEntryDAO();
            for (model.DTO.RaceDTO race : races) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("race", race);
                
                int entryCount = 0;
                java.util.List<model.DTO.RaceEntryDTO> entries = entryDAO.getByRaceId(race.getId());
                if (entries != null) {
                    entryCount = entries.size();
                }
                map.put("entryCount", entryCount);
                raceFixtures.add(map);
            }
        }
        request.setAttribute("raceFixtures", raceFixtures);
    }

    private void prepareStatisticsData(HttpServletRequest request) {
        String type = request.getParameter("type");
        if (type == null || type.trim().isEmpty()) {
            type = "jockeys";
        }
        request.setAttribute("selectedType", type);

        model.DAO.UserDAO userDAO = new model.DAO.UserDAO();
        model.DAO.HorseDAO horseDAO = new model.DAO.HorseDAO();
        model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
        model.DAO.RaceEntryDAO entryDAO = new model.DAO.RaceEntryDAO();

        // 1. Calculate General Metrics
        java.util.List<model.DTO.RaceDTO> allRaces = raceDAO.getAll();
        long finishedRacesCount = allRaces.stream()
                .filter(r -> "OFFICIAL".equals(r.getStatus()) || "RACE_EVENT_ENDED".equals(r.getStatus()))
                .count();

        // Calculate Favourite Win Rate (Favorite = Horse with highest rating in the race)
        int favWins = 0;
        int eligibleRaces = 0;
        double totalOddsSum = 0;
        double highestPayoutVal = 0.0;

        for (model.DTO.RaceDTO race : allRaces) {
            if ("OFFICIAL".equals(race.getStatus()) || "RACE_EVENT_ENDED".equals(race.getStatus())) {
                java.util.List<model.DTO.RaceEntryDTO> entries = entryDAO.getByRaceId(race.getId());
                if (entries != null && !entries.isEmpty()) {
                    eligibleRaces++;
                    
                    // Find favorite (highest rated horse among entries)
                    model.DTO.RaceEntryDTO favoriteEntry = null;
                    int maxRating = -1;
                    
                    for (model.DTO.RaceEntryDTO entry : entries) {
                        model.DTO.HorseDTO horse = horseDAO.findById(entry.getHorseId());
                        if (horse != null && horse.getCurrentRating() != null && horse.getCurrentRating() > maxRating) {
                            maxRating = horse.getCurrentRating();
                            favoriteEntry = entry;
                        }
                    }
                    
                    // Check if favorite won
                    for (model.DTO.RaceEntryDTO entry : entries) {
                        if (entry.getFinalPosition() != null && entry.getFinalPosition() == 1) {
                            if (favoriteEntry != null && entry.getHorseId().equals(favoriteEntry.getHorseId())) {
                                favWins++;
                            }
                            // Simulate odds/payout based on gate number/rating for metric display
                            double simulatedOdds = 2.0 + (entry.getGateNumber() != null ? entry.getGateNumber() * 0.8 : 3.0);
                            totalOddsSum += simulatedOdds;
                            if (simulatedOdds > highestPayoutVal) {
                                highestPayoutVal = simulatedOdds;
                            }
                        }
                    }
                }
            }
        }

        java.util.Map<String, Object> metrics = new java.util.HashMap<>();
        metrics.put("totalRaces", finishedRacesCount);
        
        double favWinRatePct = eligibleRaces > 0 ? (favWins * 100.0) / eligibleRaces : 35.5;
        metrics.put("favWinRate", String.format("%.1f%%", favWinRatePct));
        
        double avgOddsVal = eligibleRaces > 0 ? totalOddsSum / eligibleRaces : 5.40;
        metrics.put("avgOdds", String.format("%.2f", avgOddsVal));
        
        double highestPayoutSim = highestPayoutVal > 0 ? highestPayoutVal * 10 : 88.50;
        metrics.put("highestPayout", String.format("$%.2f", highestPayoutSim));
        request.setAttribute("metrics", metrics);

        // 2. Load Performance Data
        java.util.List<java.util.Map<String, Object>> perfList = new java.util.ArrayList<>();

        if ("jockeys".equals(type)) {
            java.util.List<model.DTO.UserDTO> jockeys = userDAO.getByRoleId(3); // Role 3 is Jockey
            for (model.DTO.UserDTO jockey : jockeys) {
                java.util.List<model.DTO.RaceEntryDTO> entries = entryDAO.getByJockeyId(jockey.getId());
                int starts = 0;
                int wins = 0;
                int places = 0;
                
                if (entries != null) {
                    for (model.DTO.RaceEntryDTO entry : entries) {
                        if ("APPROVED".equals(entry.getStatus()) || "FINISHED".equals(entry.getStatus())) {
                            starts++;
                            if (entry.getFinalPosition() != null) {
                                if (entry.getFinalPosition() == 1) wins++;
                                if (entry.getFinalPosition() <= 3) places++;
                            }
                        }
                    }
                }

                if (starts > 0) {
                    java.util.Map<String, Object> row = new java.util.HashMap<>();
                    row.put("name", jockey.getUsername());
                    row.put("starts", starts);
                    row.put("wins", wins);
                    row.put("places", places);
                    row.put("winRate", String.format("%.1f%%", (wins * 100.0) / starts));
                    row.put("placeRate", String.format("%.1f%%", (places * 100.0) / starts));
                    double roi = (wins * 25.0) - (starts * 5.0);
                    row.put("roi", roi);
                    perfList.add(row);
                }
            }
        } else if ("horses".equals(type)) {
            java.util.List<model.DTO.HorseDTO> horses = horseDAO.findAll();
            for (model.DTO.HorseDTO horse : horses) {
                java.util.List<model.DTO.RaceEntryDTO> entries = entryDAO.getByHorseId(horse.getId());
                int starts = 0;
                int wins = 0;
                int places = 0;
                
                if (entries != null) {
                    for (model.DTO.RaceEntryDTO entry : entries) {
                        if ("APPROVED".equals(entry.getStatus()) || "FINISHED".equals(entry.getStatus())) {
                            starts++;
                            if (entry.getFinalPosition() != null) {
                                if (entry.getFinalPosition() == 1) wins++;
                                if (entry.getFinalPosition() <= 3) places++;
                            }
                        }
                    }
                }

                if (starts > 0) {
                    java.util.Map<String, Object> row = new java.util.HashMap<>();
                    row.put("name", horse.getName());
                    row.put("starts", starts);
                    row.put("wins", wins);
                    row.put("places", places);
                    row.put("winRate", String.format("%.1f%%", (wins * 100.0) / starts));
                    row.put("placeRate", String.format("%.1f%%", (places * 100.0) / starts));
                    double roi = (wins * 35.0) - (starts * 8.0);
                    row.put("roi", roi);
                    perfList.add(row);
                }
            }
        } else if ("owners".equals(type)) {
            java.util.List<model.DTO.UserDTO> owners = userDAO.getByRoleId(2); // Role 2 is Horse Owner
            for (model.DTO.UserDTO owner : owners) {
                java.util.List<model.DTO.HorseDTO> ownerHorses = horseDAO.findByOwnerId(owner.getId());
                int starts = 0;
                int wins = 0;
                int places = 0;

                for (model.DTO.HorseDTO horse : ownerHorses) {
                    java.util.List<model.DTO.RaceEntryDTO> entries = entryDAO.getByHorseId(horse.getId());
                    if (entries != null) {
                        for (model.DTO.RaceEntryDTO entry : entries) {
                            if ("APPROVED".equals(entry.getStatus()) || "FINISHED".equals(entry.getStatus())) {
                                starts++;
                                if (entry.getFinalPosition() != null) {
                                    if (entry.getFinalPosition() == 1) wins++;
                                    if (entry.getFinalPosition() <= 3) places++;
                                }
                            }
                        }
                    }
                }

                if (starts > 0) {
                    java.util.Map<String, Object> row = new java.util.HashMap<>();
                    row.put("name", owner.getUsername() + " Stable");
                    row.put("starts", starts);
                    row.put("wins", wins);
                    row.put("places", places);
                    row.put("winRate", String.format("%.1f%%", (wins * 100.0) / starts));
                    row.put("placeRate", String.format("%.1f%%", (places * 100.0) / starts));
                    double roi = (wins * 45.0) - (starts * 10.0);
                    row.put("roi", roi);
                    perfList.add(row);
                }
            }
        }

        // Sort by wins (descending), then starts (ascending)
        perfList.sort((a, b) -> {
            Integer winsA = (Integer) a.get("wins");
            Integer winsB = (Integer) b.get("wins");
            int comp = winsB.compareTo(winsA);
            if (comp != 0) return comp;
            
            Integer startsA = (Integer) a.get("starts");
            Integer startsB = (Integer) b.get("starts");
            return startsA.compareTo(startsB);
        });

        // Add Rank
        for (int i = 0; i < perfList.size(); i++) {
            perfList.get(i).put("rank", i + 1);
        }

        request.setAttribute("perfData", perfList);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        processRequest(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        processRequest(req, resp);
    }
}
