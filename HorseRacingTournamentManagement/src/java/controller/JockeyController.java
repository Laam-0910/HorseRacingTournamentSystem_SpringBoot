package controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import model.DAO.*;
import model.DTO.*;

@WebServlet(name = "JockeyController", urlPatterns = {"/JockeyController"})
public class JockeyController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession();
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null || user.getRoleId() != 3) {
            session.setAttribute("error", "Unauthorized access. Please log in as a Jockey.");
            response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
            return;
        }

        String action = request.getParameter("action");
        if (action == null) {
            action = "jockeyViewDashboard";
        }

        try {
            switch (action) {
                case "dashboard":
                case "jockeyViewDashboard":
                    doViewDashboard(request, response, user);
                    break;
                case "jockeyRegisterMeeting":
                    doRegisterMeeting(request, response, user);
                    break;
                case "jockeyRespondInvitation":
                    doRespondInvitation(request, response, user);
                    break;
                case "jockeyConfirmViolation":
                    doConfirmViolation(request, response, user);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard");
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "An error occurred: " + e.getMessage());
            response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard");
        }
    }

    private void doViewDashboard(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws ServletException, IOException {
        String view = request.getParameter("view");
        if (view == null || view.trim().isEmpty()) {
            view = "hub";
        }

        RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
        JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new JockeyRaceMeetingRegistrationDAO();
        RaceInvitationDAO invitationDAO = new RaceInvitationDAO();
        HorseDAO horseDAO = new HorseDAO();
        RaceDAO raceDAO = new RaceDAO();
        UserDAO userDAO = new UserDAO();
        RaceEntryDAO entryDAO = new RaceEntryDAO();

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
            List<RaceMeetingDTO> meetings = meetingDAO.findAll();
            List<JockeyRaceMeetingRegistrationDTO> myRegs = jockeyRegDAO.findByJockeyId(user.getId());

            Set<Integer> registeredMeetingIds = new HashSet<>();
            Map<Integer, String> regStatuses = new HashMap<>();
            if (myRegs != null) {
                for (JockeyRaceMeetingRegistrationDTO reg : myRegs) {
                    registeredMeetingIds.add(reg.getRaceMeetingId());
                    regStatuses.put(reg.getRaceMeetingId(), reg.getStatus());
                }
            }

            // Calculate Jockey Statistics
            List<RaceEntryDTO> rawEntries = entryDAO.findByJockeyId(user.getId());
            int totalRaces = 0;
            int totalWins = 0;
            int top3Finishes = 0;
            double totalEarnings = 0.0;

            if (rawEntries != null) {
                for (RaceEntryDTO e : rawEntries) {
                    if ("FINISHED".equals(e.getStatus())) {
                        totalRaces++;
                        if (e.getFinalPosition() != null) {
                            if (e.getFinalPosition() == 1) {
                                totalWins++;
                            }
                            if (e.getFinalPosition() <= 3) {
                                top3Finishes++;
                            }
                        }
                        // Assume Jockey gets 10% riding fee of the prize won
                        if (e.getPrizeMoney() != null) {
                            totalEarnings += e.getPrizeMoney().doubleValue() * 0.10;
                        }
                    }
                }
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRaces", totalRaces);
            stats.put("totalWins", totalWins);
            stats.put("top3", top3Finishes);
            stats.put("winRate", totalRaces > 0 ? (double) totalWins / totalRaces * 100 : 0.0);
            stats.put("earnings", totalEarnings);

            request.setAttribute("meetings", meetings);
            request.setAttribute("registeredMeetingIds", registeredMeetingIds);
            request.setAttribute("regStatuses", regStatuses);
            request.setAttribute("jockeyStats", stats);

        } else if ("mounts".equals(view)) {
            List<RaceEntryDTO> rawEntries = entryDAO.findByJockeyId(user.getId());
            List<Map<String, Object>> resolvedEntries = new ArrayList<>();

            if (rawEntries != null) {
                for (RaceEntryDTO entry : rawEntries) {
                    Map<String, Object> resolved = new HashMap<>();
                    resolved.put("id", entry.getId());
                    resolved.put("gateNumber", entry.getGateNumber());
                    resolved.put("carriedWeight", entry.getCarriedWeight());
                    resolved.put("status", entry.getStatus());
                    resolved.put("finalPosition", entry.getFinalPosition());
                    resolved.put("finishTime", entry.getFinishTime());
                    resolved.put("prizeMoney", entry.getPrizeMoney());

                    HorseDTO horse = horseDAO.findById(entry.getHorseId());
                    resolved.put("horseName", horse != null ? horse.getName() : "Unknown Horse");

                    RaceDTO race = raceDAO.findById(entry.getRaceId());
                    if (race != null) {
                        resolved.put("classLevel", race.getClassLevel());
                        resolved.put("startTime", race.getStartTime());
                        RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                        resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Event");
                        
                        // Load competitors in the same race
                        List<RaceEntryDTO> raceEntries = entryDAO.findByRaceId(race.getId());
                        List<Map<String, Object>> competitors = new ArrayList<>();
                        if (raceEntries != null) {
                            for (RaceEntryDTO compEntry : raceEntries) {
                                if (!compEntry.getId().equals(entry.getId()) && ("APPROVED".equals(compEntry.getStatus()) || "PENDING_ADMIN".equals(compEntry.getStatus()) || "FINISHED".equals(compEntry.getStatus()))) {
                                    Map<String, Object> comp = new HashMap<>();
                                    comp.put("gate", compEntry.getGateNumber());
                                    HorseDTO cHorse = horseDAO.findById(compEntry.getHorseId());
                                    comp.put("horseName", cHorse != null ? cHorse.getName() : "Unknown");
                                    UserDTO cJockey = userDAO.getById(compEntry.getJockeyId());
                                    comp.put("jockeyName", cJockey != null ? cJockey.getUsername() : "Unknown");
                                    competitors.add(comp);
                                }
                            }
                        }
                        resolved.put("competitors", competitors);
                    } else {
                        resolved.put("classLevel", "N/A");
                        resolved.put("startTime", null);
                        resolved.put("meetingName", "N/A");
                        resolved.put("competitors", new ArrayList<>());
                    }
                    resolvedEntries.add(resolved);
                }
            }
            request.setAttribute("mounts", resolvedEntries);

        } else if ("calendar".equals(view)) {
            List<RaceMeetingDTO> meetings = meetingDAO.findAll();
            List<RaceDTO> allRaces = raceDAO.findAll();

            request.setAttribute("meetings", meetings);
            request.setAttribute("races", allRaces);

        } else if ("invitations".equals(view)) {
            List<RaceInvitationDTO> rawInvites = invitationDAO.findByJockeyId(user.getId());
            List<Map<String, Object>> resolvedInvites = new ArrayList<>();

            if (rawInvites != null) {
                for (RaceInvitationDTO inv : rawInvites) {
                    if ("PENDING".equals(inv.getStatus())) {
                        Map<String, Object> resolved = new HashMap<>();
                        resolved.put("id", inv.getId());
                        resolved.put("status", inv.getStatus());

                        HorseDTO horse = horseDAO.findById(inv.getHorseId());
                        resolved.put("horseName", horse != null ? horse.getName() : "Unknown Horse");
                        resolved.put("horseRating", horse != null ? horse.getCurrentRating() : 0);

                        UserDTO owner = userDAO.getById(inv.getOwnerId());
                        resolved.put("ownerName", owner != null ? owner.getUsername() : "Unknown Owner");

                        RaceDTO race = raceDAO.findById(inv.getRaceId());
                        if (race != null) {
                            resolved.put("classLevel", race.getClassLevel());
                            resolved.put("startTime", race.getStartTime());
                            resolved.put("distanceMeters", race.getDistanceMeters());
                            resolved.put("trackType", race.getTrackType());
                            resolved.put("purse", race.getPurse());
                            resolved.put("raceStatus", race.getStatus());
                            resolved.put("registrationStartTime", race.getRegistrationStartTime());
                            resolved.put("registrationEndTime", race.getRegistrationEndTime());
                            RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                            resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Event");
                            resolved.put("venue", meeting != null ? meeting.getVenue() : "Unknown Venue");
                            
                            // Load competitors
                            List<RaceEntryDTO> raceEntries = entryDAO.findByRaceId(race.getId());
                            List<Map<String, Object>> competitors = new ArrayList<>();
                            if (raceEntries != null) {
                                for (RaceEntryDTO entry : raceEntries) {
                                    if ("APPROVED".equals(entry.getStatus()) || "PENDING_ADMIN".equals(entry.getStatus()) || "FINISHED".equals(entry.getStatus())) {
                                        Map<String, Object> comp = new HashMap<>();
                                        comp.put("gate", entry.getGateNumber());
                                        HorseDTO cHorse = horseDAO.findById(entry.getHorseId());
                                        comp.put("horseName", cHorse != null ? cHorse.getName() : "Unknown");
                                        UserDTO cJockey = userDAO.getById(entry.getJockeyId());
                                        comp.put("jockeyName", cJockey != null ? cJockey.getUsername() : "Unknown");
                                        competitors.add(comp);
                                    }
                                }
                            }
                            resolved.put("competitors", competitors);
                        } else {
                            resolved.put("classLevel", "N/A");
                            resolved.put("startTime", null);
                            resolved.put("meetingName", "N/A");
                            resolved.put("competitors", new ArrayList<>());
                        }
                        resolvedInvites.add(resolved);
                    }
                }
            }
            request.setAttribute("invitations", resolvedInvites);
        } else if ("violations".equals(view)) {
            model.DAO.ViolationDAO violationDAO = new model.DAO.ViolationDAO();
            List<model.DTO.ViolationDTO> violations = violationDAO.getByJockeyId(user.getId());
            
            java.util.List<java.util.Map<String, Object>> enrichedViolations = new java.util.ArrayList<>();
            if (violations != null) {
                for (model.DTO.ViolationDTO v : violations) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("violation", v);
                    
                    model.DTO.RaceDTO race = raceDAO.findById(v.getRaceId());
                    map.put("race", race);
                    
                    model.DTO.HorseDTO horse = horseDAO.findById(v.getHorseId());
                    map.put("horse", horse);
                    
                    if (race != null) {
                        model.DTO.RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                        map.put("meeting", meeting);
                    }
                    
                    model.DTO.UserDTO referee = userDAO.getById(v.getRefereeId());
                    map.put("referee", referee);
                    
                    enrichedViolations.add(map);
                }
            }
            request.setAttribute("violations", enrichedViolations);
        }

        // Build notifications for Jockey
        List<JockeyRaceMeetingRegistrationDTO> jockeyRegs = jockeyRegDAO.findByJockeyId(user.getId());
        List<Map<String, Object>> notificationList = new ArrayList<>();
        if (jockeyRegs != null) {
            for (JockeyRaceMeetingRegistrationDTO reg : jockeyRegs) {
                RaceMeetingDTO meeting = meetingDAO.findById(reg.getRaceMeetingId());
                String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                Map<String, Object> notif = new HashMap<>();
                notif.put("id", "jockey-" + reg.getId());
                notif.put("meetingId", reg.getRaceMeetingId());
                if ("PENDING".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký buổi đua");
                    notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đang chờ duyệt.");
                    notif.put("type", "pending");
                } else if ("APPROVED".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký được chấp nhận");
                    notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đã được CHẤP NHẬN!");
                    notif.put("type", "approved");
                } else if ("REJECTED".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký bị từ chối");
                    notif.put("message", "Đơn đăng ký tham gia " + meetingName + " của bạn đã bị TỪ CHỐI.");
                    notif.put("type", "rejected");
                }
                notificationList.add(notif);
            }
        }

        // Add notifications for newly set up races
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

        request.setAttribute("notifications", notificationList);

        request.getRequestDispatcher("/WEB-INF/dashboards/jockey.jsp").forward(request, response);
    }

    private void doRegisterMeeting(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int raceMeetingId = Integer.parseInt(request.getParameter("raceMeetingId"));
            JockeyRaceMeetingRegistrationDAO regDAO = new JockeyRaceMeetingRegistrationDAO();

            JockeyRaceMeetingRegistrationDTO existing = regDAO.findByJockeyAndMeeting(user.getId(), raceMeetingId);
            if (existing == null) {
                JockeyRaceMeetingRegistrationDTO newReg = new JockeyRaceMeetingRegistrationDTO();
                newReg.setJockeyId(user.getId());
                newReg.setRaceMeetingId(raceMeetingId);
                newReg.setStatus("PENDING"); 
                newReg.setRegisteredAt(new java.sql.Timestamp(System.currentTimeMillis()));

                if (regDAO.create(newReg)) {
                    session.setAttribute("success", "Registration submitted for admin review.");
                } else {
                    session.setAttribute("error", "Failed to register for event.");
                }
            } else {
                session.setAttribute("success", "You are already registered for this event.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=hub");
    }

    private void doRespondInvitation(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int invitationId = Integer.parseInt(request.getParameter("invitationId"));
            String statusParam = request.getParameter("status"); // ACCEPTED or REJECTED

            RaceInvitationDAO invitationDAO = new RaceInvitationDAO();
            RaceInvitationDTO invitation = invitationDAO.findById(invitationId);

            if (invitation == null || !invitation.getJockeyId().equals(user.getId())) {
                session.setAttribute("error", "Invalid invitation selected.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                return;
            }

            if (!"PENDING".equals(invitation.getStatus())) {
                session.setAttribute("error", "This invitation has already been processed.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                return;
            }

            RaceDAO raceDAO = new RaceDAO();
            RaceDTO race = raceDAO.findById(invitation.getRaceId());
            if (race == null) {
                session.setAttribute("error", "The race associated with this invitation was not found.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                return;
            }

            if ("ACCEPTED".equals(statusParam)) {
                // Verify that race declarations/registration is active
                if (!"DECLARATION_OPEN".equals(race.getStatus())) {
                    session.setAttribute("error", "Acceptance failed. Registration for this race is closed (Race status: " + race.getStatus() + ").");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                    return;
                }

                // Check if jockey already has a mount in this race (either pending or accepted or entry exists)
                RaceEntryDAO entryDAO = new RaceEntryDAO();
                List<RaceEntryDTO> raceEntries = entryDAO.findByRaceId(invitation.getRaceId());
                boolean hasMount = false;
                if (raceEntries != null) {
                    for (RaceEntryDTO entry : raceEntries) {
                        if (entry.getJockeyId().equals(user.getId()) && !"REJECTED".equals(entry.getStatus())) {
                            hasMount = true;
                            break;
                        }
                    }
                }

                if (hasMount) {
                    session.setAttribute("error", "You already have an active mount in this race.");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                    return;
                }

                // Check if horse already has an active entry in this race
                RaceEntryDTO existingHorseEntry = entryDAO.findByHorseAndRace(invitation.getHorseId(), invitation.getRaceId());
                if (existingHorseEntry != null && !"REJECTED".equals(existingHorseEntry.getStatus())) {
                    session.setAttribute("error", "This horse already has an active entry in this race.");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
                    return;
                }

                // Create official RaceEntry DTO
                UserDAO userDAO = new UserDAO();
                UserDTO jockey = userDAO.getById(invitation.getJockeyId());

                RaceEntryDTO newEntry = new RaceEntryDTO();
                newEntry.setRaceId(invitation.getRaceId());
                newEntry.setHorseId(invitation.getHorseId());
                newEntry.setJockeyId(invitation.getJockeyId());
                newEntry.setGateNumber(0); // Admin will assign gate later
                newEntry.setStatus("PENDING_ADMIN");
                newEntry.setCarriedWeight(jockey != null ? jockey.getWeight() : java.math.BigDecimal.ZERO);
                newEntry.setPrizeMoney(java.math.BigDecimal.ZERO);
                newEntry.setRatingAdjustment(0);

                if (entryDAO.create(newEntry)) {
                    // Update invitation status to ACCEPTED
                    invitation.setStatus("ACCEPTED");
                    invitationDAO.update(invitation);

                    // Reject all other pending/accepted invitations for this horse OR this jockey in this race to clean up
                    List<RaceInvitationDTO> allInvites = invitationDAO.findAll();
                    if (allInvites != null) {
                        for (RaceInvitationDTO otherInv : allInvites) {
                            if (otherInv.getRaceId().equals(invitation.getRaceId()) && !otherInv.getId().equals(invitation.getId())) {
                                if ("PENDING".equals(otherInv.getStatus()) || "ACCEPTED".equals(otherInv.getStatus())) {
                                    if (otherInv.getHorseId().equals(invitation.getHorseId()) || otherInv.getJockeyId().equals(invitation.getJockeyId())) {
                                        otherInv.setStatus("REJECTED");
                                        invitationDAO.update(otherInv);
                                    }
                                }
                            }
                        }
                    }
                    session.setAttribute("success", "Invitation accepted and official race entry submitted for admin review.");
                } else {
                    session.setAttribute("error", "Failed to confirm official mount and create race entry.");
                }

            } else if ("REJECTED".equals(statusParam)) {
                invitation.setStatus("REJECTED");
                invitationDAO.update(invitation);
                session.setAttribute("success", "Invitation declined.");
            } else {
                session.setAttribute("error", "Invalid response status.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=invitations");
    }

    private void doConfirmViolation(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int violationId = Integer.parseInt(request.getParameter("violationId"));
            model.DAO.ViolationDAO violationDAO = new model.DAO.ViolationDAO();
            model.DTO.ViolationDTO violation = violationDAO.getById(violationId);
            
            if (violation == null || !violation.getJockeyId().equals(user.getId())) {
                session.setAttribute("error", "Invalid violation record.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=violations");
                return;
            }
            
            violation.setStatus("CONFIRMED");
            if (violationDAO.update(violation)) {
                session.setAttribute("success", "Violation acknowledged successfully.");
            } else {
                session.setAttribute("error", "Failed to update violation status.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=jockeyViewDashboard&view=violations");
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
