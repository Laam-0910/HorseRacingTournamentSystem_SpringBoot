package controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import model.DAO.*;
import model.DTO.*;

@WebServlet(name = "RefereeController", urlPatterns = {"/RefereeController"})
public class RefereeController extends HttpServlet {

    private final RaceDAO raceDAO = new RaceDAO();
    private final RaceEntryDAO entryDAO = new RaceEntryDAO();
    private final RaceRefereeDAO raceRefDAO = new RaceRefereeDAO();
    private final ViolationDAO violationDAO = new ViolationDAO();
    private final HorseDAO horseDAO = new HorseDAO();
    private final UserDAO userDAO = new UserDAO();
    private final RaceMeetingDAO meetingDAO = new RaceMeetingDAO();

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");

        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();

        HttpSession session = request.getSession();
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null || user.getRoleId() != 5) {
            session.setAttribute("error", "Unauthorized access. Please log in as a Referee.");
            response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
            return;
        }

        String action = request.getParameter("action");
        if (action == null || action.trim().isEmpty()) {
            action = "refereeViewDashboard";
        }

        try {
            switch (action) {
                case "refereeViewDashboard":
                    doViewDashboard(request, response, user);
                    break;
                case "refereePreRaceCheck":
                    doPreRaceCheck(request, response, user);
                    break;
                case "refereeAddViolation":
                    doAddViolation(request, response, user);
                    break;
                case "refereeConfirmResults":
                    doConfirmResults(request, response, user);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/RefereeController?action=refereeViewDashboard");
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "An error occurred: " + e.getMessage());
            response.sendRedirect(request.getContextPath() + "/RefereeController?action=refereeViewDashboard");
        }
    }

    private void doViewDashboard(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws ServletException, IOException {
        String view = request.getParameter("view");
        if (view == null || view.trim().isEmpty()) {
            view = "hub";
        }

        HttpSession session = request.getSession();
        String success = (String) session.getAttribute("success");
        if (success != null) {
            request.setAttribute("success", success);
            session.removeAttribute("success");
        }
        String error = (String) session.getAttribute("error");
        if (error != null) {
            request.setAttribute("error", error);
            session.removeAttribute("error");
        }

        if ("hub".equals(view)) {
            // Load duties assigned to this referee
            List<RaceRefereeDTO> duties = raceRefDAO.getByRefereeId(user.getId());
            List<Map<String, Object>> resolvedRaces = new ArrayList<>();
            int completedCount = 0;
            int pendingCount = 0;

            if (duties != null) {
                for (RaceRefereeDTO duty : duties) {
                    RaceDTO race = raceDAO.getById(duty.getRaceId());
                    if (race != null) {
                        Map<String, Object> resolved = new HashMap<>();
                        resolved.put("id", race.getId());
                        resolved.put("startTime", race.getStartTime());
                        resolved.put("classLevel", race.getClassLevel());
                        resolved.put("status", race.getStatus());
                        resolved.put("distanceMeters", race.getDistanceMeters());
                        resolved.put("trackType", race.getTrackType());
                        resolved.put("purse", race.getPurse());

                        RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                        resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Meeting");
                        resolved.put("venue", meeting != null ? meeting.getVenue() : "Unknown Venue");

                        // Check if gates are fully set
                        List<RaceEntryDTO> entries = entryDAO.findByRaceId(race.getId());
                        boolean gatesFullySet = true;
                        if (entries == null || entries.isEmpty()) {
                            gatesFullySet = false;
                        } else {
                            for (RaceEntryDTO entry : entries) {
                                if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) {
                                    gatesFullySet = false;
                                    break;
                                }
                            }
                        }
                        resolved.put("gatesFullySet", gatesFullySet);

                        resolvedRaces.add(resolved);

                        if ("OFFICIAL".equals(race.getStatus()) || "RACE_EVENT_ENDED".equals(race.getStatus())) {
                            completedCount++;
                        } else {
                            pendingCount++;
                        }
                    }
                }
            }

            request.setAttribute("assignedRaces", resolvedRaces);
            request.setAttribute("completedCount", completedCount);
            request.setAttribute("pendingCount", pendingCount);

        } else if ("check".equals(view)) {
            int raceId = Integer.parseInt(request.getParameter("raceId"));
            RaceDTO race = raceDAO.getById(raceId);
            if (race != null) {
                request.setAttribute("race", race);
                RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                request.setAttribute("meeting", meeting);

                List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
                List<Map<String, Object>> resolvedEntries = new ArrayList<>();
                boolean gatesFullySet = true;
                if (entries == null || entries.isEmpty()) {
                    gatesFullySet = false;
                } else {
                    for (RaceEntryDTO entry : entries) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("entry", entry);

                        HorseDTO horse = horseDAO.findById(entry.getHorseId());
                        res.put("horse", horse);

                        UserDTO jockey = userDAO.getById(entry.getJockeyId());
                        res.put("jockey", jockey);

                        resolvedEntries.add(res);

                        if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) {
                            gatesFullySet = false;
                        }
                    }
                }
                request.setAttribute("entries", resolvedEntries);
                request.setAttribute("gatesFullySet", gatesFullySet);
            }

        } else if ("supervision".equals(view)) {
            int raceId = Integer.parseInt(request.getParameter("raceId"));
            RaceDTO race = raceDAO.getById(raceId);
            if (race != null) {
                request.setAttribute("race", race);
                RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                request.setAttribute("meeting", meeting);

                List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
                List<Map<String, Object>> resolvedEntries = new ArrayList<>();
                if (entries != null) {
                    for (RaceEntryDTO entry : entries) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("entry", entry);
                        HorseDTO horse = horseDAO.findById(entry.getHorseId());
                        res.put("horse", horse);
                        UserDTO jockey = userDAO.getById(entry.getJockeyId());
                        res.put("jockey", jockey);
                        resolvedEntries.add(res);
                    }
                }
                request.setAttribute("entries", resolvedEntries);

                // Fetch recorded violations
                List<ViolationDTO> violations = violationDAO.getByRaceId(raceId);
                List<Map<String, Object>> resolvedViolations = new ArrayList<>();
                if (violations != null) {
                    for (ViolationDTO viol : violations) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("violation", viol);
                        HorseDTO horse = horseDAO.findById(viol.getHorseId());
                        res.put("horseName", horse != null ? horse.getName() : "Unknown Horse");
                        UserDTO jockey = userDAO.getById(viol.getJockeyId());
                        res.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown Jockey");
                        resolvedViolations.add(res);
                    }
                }
                request.setAttribute("violations", resolvedViolations);
            }

        } else if ("confirm".equals(view)) {
            int raceId = Integer.parseInt(request.getParameter("raceId"));
            RaceDTO race = raceDAO.getById(raceId);
            if (race != null) {
                request.setAttribute("race", race);
                RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                request.setAttribute("meeting", meeting);

                List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
                List<Map<String, Object>> resolvedEntries = new ArrayList<>();
                if (entries != null) {
                    for (RaceEntryDTO entry : entries) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("entry", entry);
                        HorseDTO horse = horseDAO.findById(entry.getHorseId());
                        res.put("horse", horse);
                        UserDTO jockey = userDAO.getById(entry.getJockeyId());
                        res.put("jockey", jockey);
                        resolvedEntries.add(res);
                    }
                }
                request.setAttribute("entries", resolvedEntries);
            }

        } else if ("incidents".equals(view)) {
            // Load all violations recorded by this referee
            List<ViolationDTO> allViolations = violationDAO.getAll();
            List<Map<String, Object>> myViolations = new ArrayList<>();
            if (allViolations != null) {
                for (ViolationDTO viol : allViolations) {
                    if (viol.getRefereeId().equals(user.getId())) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("violation", viol);
                        
                        HorseDTO horse = horseDAO.findById(viol.getHorseId());
                        res.put("horseName", horse != null ? horse.getName() : "Unknown");
                        
                        UserDTO jockey = userDAO.getById(viol.getJockeyId());
                        res.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown");

                        RaceDTO race = raceDAO.getById(viol.getRaceId());
                        if (race != null) {
                            res.put("raceId", race.getId());
                            res.put("classLevel", race.getClassLevel());
                            RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                            res.put("meetingName", meeting != null ? meeting.getName() : "Unknown");
                        }
                        
                        myViolations.add(res);
                    }
                }
            }
            request.setAttribute("incidents", myViolations);

        } else if ("duties".equals(view)) {
            List<RaceRefereeDTO> duties = raceRefDAO.getByRefereeId(user.getId());
            List<Map<String, Object>> schedule = new ArrayList<>();
            if (duties != null) {
                for (RaceRefereeDTO duty : duties) {
                    RaceDTO race = raceDAO.getById(duty.getRaceId());
                    if (race != null) {
                        Map<String, Object> res = new HashMap<>();
                        res.put("race", race);
                        RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                        res.put("meeting", meeting);
                        schedule.add(res);
                    }
                }
            }
            request.setAttribute("schedule", schedule);
        }

        // Build notifications for Referee
        List<Map<String, Object>> notificationList = new ArrayList<>();
        List<RaceDTO> upcomingRacesForNotif = raceDAO.getAll();
        if (upcomingRacesForNotif != null) {
            for (RaceDTO race : upcomingRacesForNotif) {
                if ("SCHEDULED".equals(race.getStatus()) || "DECLARATION_OPEN".equals(race.getStatus())) {
                    RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                    String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                    Map<String, Object> notif = new HashMap<>();
                    notif.put("id", "race-setup-" + race.getId());
                    notif.put("title", "Đường đua mới được thiết lập");
                    notif.put("message", "Trận đấu " + race.getClassLevel() + " tại " + meetingName + " được lên lịch vào lúc " + race.getStartTime() + ".");
                    notif.put("type", "pending");
                    notificationList.add(notif);
                }
            }
        }
        
        // Add warnings for races with missing gate assignments
        if (upcomingRacesForNotif != null) {
            for (RaceDTO race : upcomingRacesForNotif) {
                if ("SCHEDULED".equals(race.getStatus()) || "DECLARATION_OPEN".equals(race.getStatus())) {
                    List<RaceEntryDTO> entries = entryDAO.findByRaceId(race.getId());
                    if (entries != null && !entries.isEmpty()) {
                        boolean missingGate = false;
                        for (RaceEntryDTO entry : entries) {
                            if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) {
                                missingGate = true;
                                break;
                            }
                        }
                        if (missingGate) {
                            RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                            String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                            Map<String, Object> notif = new HashMap<>();
                            notif.put("id", "race-gate-missing-" + race.getId());
                            notif.put("title", "Cảnh báo: Chưa thiết lập cổng");
                            notif.put("message", "Trận đấu " + race.getClassLevel() + " tại " + meetingName + " chưa được cấu hình đầy đủ cổng xuất phát!");
                            notif.put("type", "rejected");
                            notificationList.add(notif);
                        }
                    }
                }
            }
        }

        // Add notifications for referee assigned duties
        List<RaceRefereeDTO> assignments = raceRefDAO.getByRefereeId(user.getId());
        if (assignments != null) {
            for (RaceRefereeDTO assignment : assignments) {
                RaceDTO race = raceDAO.getById(assignment.getRaceId());
                if (race != null && ("SCHEDULED".equals(race.getStatus()) || "DECLARATION_OPEN".equals(race.getStatus()))) {
                    RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                    String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                    Map<String, Object> notif = new HashMap<>();
                    notif.put("id", "ref-duty-" + race.getId());
                    notif.put("title", "Nhiệm vụ phân công mới");
                    notif.put("message", "Bạn được phân công giám sát trận " + race.getClassLevel() + " tại " + meetingName + ".");
                    notif.put("type", "approved");
                    notificationList.add(notif);
                }
            }
        }
        
        request.setAttribute("notifications", notificationList);

        request.setAttribute("currentView", view);
        request.getRequestDispatcher("/WEB-INF/dashboards/referee.jsp").forward(request, response);
    }

    private void doPreRaceCheck(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int raceId = Integer.parseInt(request.getParameter("raceId"));
            RaceDTO race = raceDAO.getById(raceId);
            if (race != null) {
                List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
                
                // Kiểm tra xem danh sách có rỗng không
                if (entries == null || entries.isEmpty()) {
                    throw new IllegalArgumentException("Không có nài/ngựa nào đăng ký cho trận đấu này. Không thể bắt đầu.");
                }
                
                // Kiểm tra cổng xuất phát cho những ngựa tham gia (bỏ qua những ngựa bị loại - SCRATCH)
                for (RaceEntryDTO entry : entries) {
                    String vetParam = request.getParameter("vet_" + entry.getId());
                    if (!"SCRATCH".equals(vetParam)) {
                        if (entry.getGateNumber() == null || entry.getGateNumber() <= 0) {
                            session.setAttribute("error", "Không thể bắt đầu trận đấu vì chưa thiết lập cổng xuất phát (gate > 0) cho tất cả các nài/ngựa tham gia. Vui lòng liên hệ Admin để cấu hình cổng trước.");
                            response.sendRedirect(request.getContextPath() + "/RefereeController?view=check&raceId=" + raceId);
                            return;
                        }
                    }
                }

                // Cập nhật trạng thái và thông số cân nặng
                for (RaceEntryDTO entry : entries) {
                    String weightParam = request.getParameter("weighedWeight_" + entry.getId());
                    String vetParam = request.getParameter("vet_" + entry.getId());

                    if (weightParam != null && !weightParam.trim().isEmpty()) {
                        try {
                            entry.setCarriedWeight(new java.math.BigDecimal(weightParam.trim()));
                        } catch (Exception ex) {
                            // Fallback
                        }
                    }

                    if ("SCRATCH".equals(vetParam)) {
                        entry.setStatus("REJECTED");
                    } else {
                        entry.setStatus("RUNNING");
                    }
                    entryDAO.update(entry);
                }

                race.setStatus("RUNNING");
                if (raceDAO.update(race)) {
                    session.setAttribute("success", "Pre-race checks completed successfully. Checked weights and vet clearance. The race is now running.");
                    response.sendRedirect(request.getContextPath() + "/RefereeController?view=supervision&raceId=" + raceId);
                    return;
                } else {
                    session.setAttribute("error", "Failed to update race status.");
                }
            } else {
                session.setAttribute("error", "Race not found.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error starting race: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/RefereeController?view=hub");
    }

    private void doAddViolation(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        int raceId = Integer.parseInt(request.getParameter("raceId"));
        try {
            int horseId = Integer.parseInt(request.getParameter("horseId"));
            int jockeyId = Integer.parseInt(request.getParameter("jockeyId"));
            String description = request.getParameter("description");
            String penalty = request.getParameter("penalty");

            ViolationDTO dto = new ViolationDTO();
            dto.setRaceId(raceId);
            dto.setHorseId(horseId);
            dto.setJockeyId(jockeyId);
            dto.setRefereeId(user.getId());
            dto.setDescription(description);
            dto.setPenalty(penalty);

            if (violationDAO.insert(dto)) {
                session.setAttribute("success", "Violation recorded successfully.");
            } else {
                session.setAttribute("error", "Failed to record violation.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/RefereeController?view=supervision&raceId=" + raceId);
    }

    private void doConfirmResults(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        int raceId = Integer.parseInt(request.getParameter("raceId"));
        try {
            RaceDTO race = raceDAO.getById(raceId);
            if (race == null) {
                session.setAttribute("error", "Race not found.");
                response.sendRedirect(request.getContextPath() + "/RefereeController?view=hub");
                return;
            }

            String stewardReportText = request.getParameter("stewardReport");
            race.setStewardReport(stewardReportText);
            race.setStatus("OFFICIAL");

            List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
            BigDecimal purse = race.getPurse() != null ? race.getPurse() : BigDecimal.ZERO;

            if (entries != null) {
                for (RaceEntryDTO entry : entries) {
                    String entryIdStr = String.valueOf(entry.getId());
                    String finalPosStr = request.getParameter("position_" + entryIdStr);
                    String finishTime = request.getParameter("time_" + entryIdStr);
                    boolean isDq = request.getParameter("dq_" + entryIdStr) != null;

                    int ratingAdj = 0;
                    BigDecimal prize = BigDecimal.ZERO;

                    if (isDq) {
                        entry.setStatus("DISQUALIFIED");
                        entry.setFinalPosition(null);
                        entry.setFinishTime("DQ");
                        ratingAdj = -2;
                    } else {
                        entry.setStatus("FINISHED");
                        // Guard: if position is missing/empty, skip this entry safely
                        if (finalPosStr == null || finalPosStr.trim().isEmpty()) {
                            continue;
                        }
                        int pos = Integer.parseInt(finalPosStr.trim());
                        entry.setFinalPosition(pos);
                        entry.setFinishTime(finishTime);

                        // Prize money distribution
                        if (pos == 1) {
                            prize = purse.multiply(new BigDecimal("0.60"));
                            ratingAdj = 6;
                        } else if (pos == 2) {
                            prize = purse.multiply(new BigDecimal("0.25"));
                            ratingAdj = 3;
                        } else if (pos == 3) {
                            prize = purse.multiply(new BigDecimal("0.15"));
                            ratingAdj = 1;
                        }
                    }

                    entry.setPrizeMoney(prize);
                    entry.setRatingAdjustment(ratingAdj);
                    entryDAO.update(entry);

                    // Update Horse Stats
                    HorseDTO horse = horseDAO.findById(entry.getHorseId());
                    if (horse != null) {
                        int currentRating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52;
                        horse.setCurrentRating(Math.max(0, currentRating + ratingAdj));
                        horse.setTotalRaces((horse.getTotalRaces() != null ? horse.getTotalRaces() : 0) + 1);
                        if (!isDq && entry.getFinalPosition() != null && entry.getFinalPosition() == 1) {
                            horse.setTotalWins((horse.getTotalWins() != null ? horse.getTotalWins() : 0) + 1);
                        }
                        horseDAO.update(horse);
                    }

                    // Update Jockey Stats
                    UserDTO jockey = userDAO.getById(entry.getJockeyId());
                    if (jockey != null) {
                        jockey.setTotalRacesParticipated((jockey.getTotalRacesParticipated() != null ? jockey.getTotalRacesParticipated() : 0) + 1);
                        if (!isDq && entry.getFinalPosition() != null && entry.getFinalPosition() <= 3) {
                            jockey.setTotalTop3Finishes((jockey.getTotalTop3Finishes() != null ? jockey.getTotalTop3Finishes() : 0) + 1);
                        }
                        userDAO.update(jockey);
                    }
                }
            }

            if (raceDAO.update(race)) {
                session.setAttribute("success", "Race results and Steward Report finalized successfully.");
            } else {
                session.setAttribute("error", "Failed to finalize race results.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error confirming results: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/RefereeController?view=hub");
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