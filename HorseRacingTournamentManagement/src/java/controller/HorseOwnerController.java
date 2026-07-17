package controller;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.sql.Date;
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

@WebServlet(name = "HorseOwnerController", urlPatterns = {"/HorseOwnerController"})
public class HorseOwnerController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession();
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null || user.getRoleId() != 2) {
            session.setAttribute("error", "Unauthorized access. Please log in as a Horse Owner.");
            response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
            return;
        }

        String action = request.getParameter("action");
        if (action == null) {
            action = "viewDashboard";
        }

        try {
            switch (action) {
                case "dashboard":
                case "viewDashboard":
                    doViewDashboard(request, response, user);
                    break;
                case "registerOwner":
                    doRegisterOwner(request, response, user);
                    break;
                case "registerAdditionalHorses":
                    doRegisterAdditionalHorses(request, response, user);
                    break;
                case "addHorseToStable":
                    doAddHorseToStable(request, response, user);
                    break;
                case "updateHorse":
                    doUpdateHorse(request, response, user);
                    break;
                case "getHorseHistory":
                    doGetHorseHistory(request, response, user);
                    break;
                case "inviteJockey":
                    doInviteJockey(request, response, user);
                    break;
                case "confirmJockey":
                    doConfirmJockey(request, response, user);
                    break;
                default:
                    response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard");
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "An error occurred: " + e.getMessage());
            response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard");
        }
    }

    private void doViewDashboard(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws ServletException, IOException {
        String view = request.getParameter("view");
        if (view == null || view.trim().isEmpty()) {
            view = "hub";
        }

        RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
        OwnerRaceMeetingRegistrationDAO ownerRegDAO = new OwnerRaceMeetingRegistrationDAO();
        HorseDAO horseDAO = new HorseDAO();
        RaceDAO raceDAO = new RaceDAO();
        RaceInvitationDAO invitationDAO = new RaceInvitationDAO();
        UserDAO userDAO = new UserDAO();
        JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new JockeyRaceMeetingRegistrationDAO();
        RaceEntryDAO entryDAO = new RaceEntryDAO();

        // Retrieve alerts from session and remove them
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
            List<OwnerRaceMeetingRegistrationDTO> myRegs = ownerRegDAO.findByOwnerId(user.getId());
            
            Set<Integer> registeredMeetingIds = new HashSet<>();
            Map<Integer, String> regStatuses = new HashMap<>();
            if (myRegs != null) {
                for (OwnerRaceMeetingRegistrationDTO reg : myRegs) {
                    registeredMeetingIds.add(reg.getRaceMeetingId());
                    regStatuses.put(reg.getRaceMeetingId(), reg.getStatus());
                }
            }

            List<HorseDTO> myHorses = horseDAO.findByOwnerId(user.getId());
            List<HorseDTO> activeHorses = new ArrayList<>();
            if (myHorses != null) {
                for (HorseDTO h : myHorses) {
                    if ("ACTIVE".equals(h.getStatus())) {
                        activeHorses.add(h);
                    }
                }
            }

            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            Map<Integer, List<Map<String, Object>>> meetingRegisteredHorses = new HashMap<>();
            Map<Integer, List<HorseDTO>> meetingUnregisteredHorses = new HashMap<>();

            if (meetings != null) {
                for (RaceMeetingDTO meeting : meetings) {
                    List<Map<String, Object>> regHorsesList = new ArrayList<>();
                    List<HorseDTO> unregHorsesList = new ArrayList<>();

                    for (HorseDTO horse : activeHorses) {
                        HorseRaceMeetingRegistrationDTO hReg = horseRegDAO.findByHorseAndMeeting(horse.getId(), meeting.getId());
                        if (hReg != null) {
                            Map<String, Object> hRegMap = new HashMap<>();
                            hRegMap.put("horse", horse);
                            hRegMap.put("status", hReg.getStatus());
                            hRegMap.put("regId", hReg.getId());
                            regHorsesList.add(hRegMap);
                        } else {
                            unregHorsesList.add(horse);
                        }
                    }

                    meetingRegisteredHorses.put(meeting.getId(), regHorsesList);
                    meetingUnregisteredHorses.put(meeting.getId(), unregHorsesList);
                }
            }

            request.setAttribute("meetings", meetings);
            request.setAttribute("registeredMeetingIds", registeredMeetingIds);
            request.setAttribute("regStatuses", regStatuses);
            request.setAttribute("meetingRegisteredHorses", meetingRegisteredHorses);
            request.setAttribute("meetingUnregisteredHorses", meetingUnregisteredHorses);
            request.setAttribute("activeHorses", activeHorses);

        } else if ("stable".equals(view)) {
            List<HorseDTO> horses = horseDAO.findByOwnerId(user.getId());
            List<Map<String, Object>> stableHorses = new ArrayList<>();
            
            if (horses != null) {
                for (HorseDTO h : horses) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("horse", h);
                    
                    List<RaceEntryDTO> entries = entryDAO.findByHorseId(h.getId());
                    int totalRaces = 0;
                    int totalWins = 0;
                    double totalPrize = 0.0;
                    double sumPos = 0.0;
                    int finishedRaces = 0;
                    List<Map<String, Object>> history = new ArrayList<>();
                    
                    if (entries != null) {
                        for (RaceEntryDTO e : entries) {
                            if ("FINISHED".equals(e.getStatus())) {
                                finishedRaces++;
                                totalRaces++;
                                if (e.getFinalPosition() != null) {
                                    sumPos += e.getFinalPosition();
                                    if (e.getFinalPosition() == 1) {
                                        totalWins++;
                                    }
                                }
                                if (e.getPrizeMoney() != null) {
                                    totalPrize += e.getPrizeMoney().doubleValue();
                                }
                                
                                Map<String, Object> histMap = new HashMap<>();
                                histMap.put("position", e.getFinalPosition());
                                histMap.put("time", e.getFinishTime());
                                histMap.put("prize", e.getPrizeMoney());
                                histMap.put("adjustment", e.getRatingAdjustment());
                                
                                RaceDTO race = raceDAO.findById(e.getRaceId());
                                if (race != null) {
                                    histMap.put("classLevel", race.getClassLevel());
                                    histMap.put("startTime", race.getStartTime());
                                    RaceMeetingDTO mt = meetingDAO.findById(race.getRaceMeetingId());
                                    histMap.put("meetingName", mt != null ? mt.getName() : "Unknown");
                                }
                                history.add(histMap);
                            }
                        }
                    }
                    map.put("totalRaces", totalRaces);
                    map.put("totalWins", totalWins);
                    map.put("totalPrize", totalPrize);
                    map.put("avgPosition", finishedRaces > 0 ? (sumPos / finishedRaces) : 0.0);
                    map.put("history", history);
                    stableHorses.add(map);
                }
            }
            request.setAttribute("stableHorses", stableHorses);

        } else if ("calendar".equals(view)) {
            SeasonDAO seasonDAO = new SeasonDAO();
            List<SeasonDTO> seasons = seasonDAO.findAll();
            request.setAttribute("seasons", seasons);

            String seasonFilterStr = request.getParameter("seasonFilter");
            Integer seasonFilterId = null;
            if (seasonFilterStr != null && !seasonFilterStr.trim().isEmpty()) {
                try {
                    seasonFilterId = Integer.parseInt(seasonFilterStr);
                    request.setAttribute("selectedSeasonId", seasonFilterId);
                } catch (NumberFormatException e) {
                }
            }

            List<RaceMeetingDTO> meetings = meetingDAO.findAll();
            if (seasonFilterId != null) {
                List<RaceMeetingDTO> filteredMeetings = new ArrayList<>();
                if (meetings != null) {
                    for (RaceMeetingDTO meeting : meetings) {
                        if (seasonFilterId.equals(meeting.getSeasonId())) {
                            filteredMeetings.add(meeting);
                        }
                    }
                }
                meetings = filteredMeetings;
            }
            List<RaceDTO> allRaces = raceDAO.findAll();
            List<HorseDTO> myHorses = horseDAO.findByOwnerId(user.getId());

            List<OwnerRaceMeetingRegistrationDTO> myRegs = ownerRegDAO.findByOwnerId(user.getId());
            Set<Integer> registeredMeetingIds = new HashSet<>();
            if (myRegs != null) {
                for (OwnerRaceMeetingRegistrationDTO reg : myRegs) {
                    if ("APPROVED".equals(reg.getStatus())) {
                        registeredMeetingIds.add(reg.getRaceMeetingId());
                    }
                }
            }

            Map<Integer, List<UserDTO>> meetingJockeys = new HashMap<>();
            if (meetings != null) {
                for (RaceMeetingDTO meeting : meetings) {
                    List<JockeyRaceMeetingRegistrationDTO> jkRegs = jockeyRegDAO.findByRaceMeetingId(meeting.getId());
                    List<UserDTO> activeJockeys = new ArrayList<>();
                    if (jkRegs != null) {
                        for (JockeyRaceMeetingRegistrationDTO reg : jkRegs) {
                            if ("APPROVED".equals(reg.getStatus())) {
                                UserDTO jockey = userDAO.getById(reg.getJockeyId());
                                if (jockey != null && "ACTIVE".equals(jockey.getStatus())) {
                                    activeJockeys.add(jockey);
                                }
                            }
                        }
                    }
                    meetingJockeys.put(meeting.getId(), activeJockeys);
                }
            }

            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            Map<Integer, List<HorseDTO>> meetingHorses = new HashMap<>();
            if (meetings != null) {
                for (RaceMeetingDTO meeting : meetings) {
                    List<HorseRaceMeetingRegistrationDTO> horseRegs = horseRegDAO.findByRaceMeetingId(meeting.getId());
                    List<HorseDTO> approvedHorses = new ArrayList<>();
                    if (horseRegs != null) {
                        for (HorseRaceMeetingRegistrationDTO reg : horseRegs) {
                            if ("APPROVED".equals(reg.getStatus())) {
                                HorseDTO horse = horseDAO.findById(reg.getHorseId());
                                if (horse != null && horse.getOwnerId().equals(user.getId()) && "ACTIVE".equals(horse.getStatus())) {
                                    approvedHorses.add(horse);
                                }
                            }
                        }
                    }
                    meetingHorses.put(meeting.getId(), approvedHorses);
                }
            }

            request.setAttribute("meetings", meetings);
            request.setAttribute("races", allRaces);
            request.setAttribute("horses", myHorses);
            request.setAttribute("meetingHorses", meetingHorses);
            request.setAttribute("registeredMeetingIds", registeredMeetingIds);
            request.setAttribute("meetingJockeys", meetingJockeys);

        } else if ("invitations".equals(view)) {
            List<RaceInvitationDTO> rawInvites = invitationDAO.findByOwnerId(user.getId());
            List<Map<String, Object>> resolvedInvites = new ArrayList<>();

            if (rawInvites != null) {
                for (RaceInvitationDTO inv : rawInvites) {
                    Map<String, Object> resolved = new HashMap<>();
                    resolved.put("id", inv.getId());
                    resolved.put("status", inv.getStatus());
                    
                    HorseDTO horse = horseDAO.findById(inv.getHorseId());
                    resolved.put("horseName", horse != null ? horse.getName() : "Unknown Horse");

                    UserDTO jockey = userDAO.getById(inv.getJockeyId());
                    resolved.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown Jockey");

                    RaceDTO race = raceDAO.findById(inv.getRaceId());
                    if (race != null) {
                        resolved.put("classLevel", race.getClassLevel());
                        resolved.put("startTime", race.getStartTime());
                        RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                        resolved.put("meetingName", meeting != null ? meeting.getName() : "Unknown Event");
                    } else {
                        resolved.put("classLevel", "N/A");
                        resolved.put("startTime", null);
                        resolved.put("meetingName", "N/A");
                    }
                    resolvedInvites.add(resolved);
                }
            }
            request.setAttribute("invitations", resolvedInvites);

        } else if ("results".equals(view)) {
            List<HorseDTO> horses = horseDAO.findByOwnerId(user.getId());
            List<Map<String, Object>> ownerResults = new ArrayList<>();
            double totalEarnings = 0.0;

            if (horses != null) {
                for (HorseDTO h : horses) {
                    List<RaceEntryDTO> entries = entryDAO.findByHorseId(h.getId());
                    if (entries != null) {
                        for (RaceEntryDTO e : entries) {
                            if ("FINISHED".equals(e.getStatus())) {
                                Map<String, Object> res = new HashMap<>();
                                res.put("horseName", h.getName());
                                res.put("position", e.getFinalPosition());
                                res.put("time", e.getFinishTime());
                                res.put("prize", e.getPrizeMoney());
                                res.put("adjustment", e.getRatingAdjustment());
                                
                                if (e.getPrizeMoney() != null) {
                                    totalEarnings += e.getPrizeMoney().doubleValue();
                                }

                                RaceDTO race = raceDAO.findById(e.getRaceId());
                                if (race != null) {
                                    res.put("classLevel", race.getClassLevel());
                                    res.put("startTime", race.getStartTime());
                                    RaceMeetingDTO mt = meetingDAO.findById(race.getRaceMeetingId());
                                    res.put("meetingName", mt != null ? mt.getName() : "Unknown");
                                }
                                ownerResults.add(res);
                            }
                        }
                    }
                }
            }
            request.setAttribute("ownerResults", ownerResults);
            request.setAttribute("totalEarnings", totalEarnings);
        }

        // Build notifications for Horse Owner
        List<Map<String, Object>> notificationList = new ArrayList<>();
        List<OwnerRaceMeetingRegistrationDTO> ownerRegs = ownerRegDAO.findByOwnerId(user.getId());
        if (ownerRegs != null) {
            for (OwnerRaceMeetingRegistrationDTO reg : ownerRegs) {
                RaceMeetingDTO meeting = meetingDAO.findById(reg.getRaceMeetingId());
                String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                Map<String, Object> notif = new java.util.HashMap<>();
                notif.put("id", "owner-" + reg.getId());
                notif.put("meetingId", reg.getRaceMeetingId());
                if ("PENDING".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký tham gia buổi đua");
                    notif.put("message", "Đăng ký của bạn cho " + meetingName + " đang chờ phê duyệt.");
                    notif.put("type", "pending");
                } else if ("APPROVED".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký buổi đua được duyệt");
                    notif.put("message", "Đăng ký của bạn cho " + meetingName + " đã được CHẤP NHẬN!");
                    notif.put("type", "approved");
                } else if ("REJECTED".equals(reg.getStatus())) {
                    notif.put("title", "Đăng ký buổi đua bị từ chối");
                    notif.put("message", "Đăng ký của bạn cho " + meetingName + " đã bị TỪ CHỐI.");
                    notif.put("type", "rejected");
                }
                notificationList.add(notif);
            }
        }

        List<HorseDTO> ownerHorses = horseDAO.findByOwnerId(user.getId());
        if (ownerHorses != null) {
            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            for (HorseDTO horse : ownerHorses) {
                // Horse System Registration Notifications
                Map<String, Object> horseSystemNotif = new java.util.HashMap<>();
                horseSystemNotif.put("id", "horse-sys-" + horse.getId());
                if ("PENDING".equals(horse.getStatus())) {
                    horseSystemNotif.put("title", "Đăng ký chiến mã mới");
                    horseSystemNotif.put("message", "Đăng ký chiến mã " + horse.getName() + " đang chờ duyệt vào hệ thống.");
                    horseSystemNotif.put("type", "pending");
                    notificationList.add(horseSystemNotif);
                } else if ("ACTIVE".equals(horse.getStatus())) {
                    horseSystemNotif.put("title", "Chiến mã được duyệt");
                    horseSystemNotif.put("message", "Đăng ký chiến mã " + horse.getName() + " đã được CHẤP NHẬN vào hệ thống!");
                    horseSystemNotif.put("type", "approved");
                    notificationList.add(horseSystemNotif);
                } else if ("REJECTED".equals(horse.getStatus())) {
                    horseSystemNotif.put("title", "Chiến mã bị từ chối");
                    horseSystemNotif.put("message", "Đăng ký chiến mã " + horse.getName() + " đã bị TỪ CHỐI.");
                    horseSystemNotif.put("type", "rejected");
                    notificationList.add(horseSystemNotif);
                }

                List<HorseRaceMeetingRegistrationDTO> hRegs = horseRegDAO.findByHorseId(horse.getId());
                if (hRegs != null) {
                    for (HorseRaceMeetingRegistrationDTO reg : hRegs) {
                        RaceMeetingDTO meeting = meetingDAO.findById(reg.getRaceMeetingId());
                        String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                        Map<String, Object> notif = new java.util.HashMap<>();
                        notif.put("id", "horse-" + reg.getId());
                        notif.put("meetingId", reg.getRaceMeetingId());
                        if ("PENDING".equals(reg.getStatus())) {
                            notif.put("title", "Đăng ký ngựa thi đấu");
                            notif.put("message", "Đăng ký ngựa " + horse.getName() + " cho " + meetingName + " đang chờ duyệt.");
                            notif.put("type", "pending");
                        } else if ("APPROVED".equals(reg.getStatus())) {
                            notif.put("title", "Đăng ký ngựa được duyệt");
                            notif.put("message", "Đăng ký ngựa " + horse.getName() + " cho " + meetingName + " đã được CHẤP NHẬN!");
                            notif.put("type", "approved");
                        } else if ("REJECTED".equals(reg.getStatus())) {
                            notif.put("title", "Đăng ký ngựa bị từ chối");
                            notif.put("message", "Đăng ký ngựa " + horse.getName() + " cho " + meetingName + " đã bị TỪ CHỐI.");
                            notif.put("type", "rejected");
                        }
                        notificationList.add(notif);
                    }
                }
            }
        }

        // Add notifications for newly set up races
        List<RaceDTO> upcomingRacesForNotif = raceDAO.getAll();
        if (upcomingRacesForNotif != null) {
            for (RaceDTO race : upcomingRacesForNotif) {
                if ("SCHEDULED".equals(race.getStatus()) || "DECLARATION_OPEN".equals(race.getStatus())) {
                    RaceMeetingDTO meeting = meetingDAO.findById(race.getRaceMeetingId());
                    String meetingName = (meeting != null) ? meeting.getName() : "Buổi đua";
                    Map<String, Object> notif = new java.util.HashMap<>();
                    notif.put("id", "race-setup-" + race.getId());
                    notif.put("title", "Đường đua mới được thiết lập");
                    notif.put("message", "Trận đấu " + race.getClassLevel() + " tại " + meetingName + " được lên lịch vào lúc " + race.getStartTime() + ".");
                    notif.put("type", "pending");
                    notificationList.add(notif);
                }
            }
        }
        request.setAttribute("notifications", notificationList);

        request.getRequestDispatcher("/WEB-INF/dashboards/horseOwner.jsp").forward(request, response);
    }

    private void doRegisterOwner(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int raceMeetingId = Integer.parseInt(request.getParameter("raceMeetingId"));
            String[] horseIdStrs = request.getParameterValues("horseIds");

            if (horseIdStrs == null || horseIdStrs.length == 0) {
                session.setAttribute("error", "Please select at least one horse to register for the meeting.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=hub");
                return;
            }

            OwnerRaceMeetingRegistrationDAO regDAO = new OwnerRaceMeetingRegistrationDAO();
            OwnerRaceMeetingRegistrationDTO existing = regDAO.findByOwnerAndMeeting(user.getId(), raceMeetingId);
            if (existing == null) {
                OwnerRaceMeetingRegistrationDTO newReg = new OwnerRaceMeetingRegistrationDTO();
                newReg.setOwnerId(user.getId());
                newReg.setRaceMeetingId(raceMeetingId);
                newReg.setStatus("APPROVED"); 
                newReg.setRegisteredAt(new java.sql.Timestamp(System.currentTimeMillis()));
                regDAO.create(newReg);
            }

            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            int successCount = 0;
            for (String horseIdStr : horseIdStrs) {
                int horseId = Integer.parseInt(horseIdStr);
                HorseRaceMeetingRegistrationDTO existingHorseReg = horseRegDAO.findByHorseAndMeeting(horseId, raceMeetingId);
                if (existingHorseReg == null) {
                    HorseRaceMeetingRegistrationDTO horseReg = new HorseRaceMeetingRegistrationDTO();
                    horseReg.setRaceMeetingId(raceMeetingId);
                    horseReg.setHorseId(horseId);
                    horseReg.setStatus("PENDING");
                    horseReg.setRegisteredAt(new java.sql.Timestamp(System.currentTimeMillis()));
                    if (horseRegDAO.create(horseReg)) {
                        successCount++;
                    }
                }
            }

            session.setAttribute("success", "Registered successfully. " + successCount + " horse(s) submitted for Admin review.");
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=hub");
    }

    private void doRegisterAdditionalHorses(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int raceMeetingId = Integer.parseInt(request.getParameter("raceMeetingId"));
            String[] horseIdStrs = request.getParameterValues("horseIds");

            if (horseIdStrs == null || horseIdStrs.length == 0) {
                session.setAttribute("error", "Please select at least one horse to register.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=hub");
                return;
            }

            // Verify owner is registered
            OwnerRaceMeetingRegistrationDAO regDAO = new OwnerRaceMeetingRegistrationDAO();
            OwnerRaceMeetingRegistrationDTO existing = regDAO.findByOwnerAndMeeting(user.getId(), raceMeetingId);
            if (existing == null) {
                session.setAttribute("error", "You must be registered for this event first.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=hub");
                return;
            }

            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            int successCount = 0;
            for (String horseIdStr : horseIdStrs) {
                int horseId = Integer.parseInt(horseIdStr);
                HorseRaceMeetingRegistrationDTO existingHorseReg = horseRegDAO.findByHorseAndMeeting(horseId, raceMeetingId);
                if (existingHorseReg == null) {
                    HorseRaceMeetingRegistrationDTO horseReg = new HorseRaceMeetingRegistrationDTO();
                    horseReg.setRaceMeetingId(raceMeetingId);
                    horseReg.setHorseId(horseId);
                    horseReg.setStatus("PENDING");
                    horseReg.setRegisteredAt(new java.sql.Timestamp(System.currentTimeMillis()));
                    if (horseRegDAO.create(horseReg)) {
                        successCount++;
                    }
                }
            }

            session.setAttribute("success", "Successfully submitted " + successCount + " additional horse(s) for review.");
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=hub");
    }

    private void doAddHorseToStable(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            String name = request.getParameter("name");
            String breed = request.getParameter("breed");
            String dobStr = request.getParameter("dateOfBirth");

            if (name == null || name.trim().isEmpty() || dobStr == null || dobStr.trim().isEmpty()) {
                session.setAttribute("error", "Horse Name and Date of Birth are required.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=stable");
                return;
            }

            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            sdf.setLenient(false);
            Date dob = new Date(sdf.parse(dobStr).getTime());
            HorseDTO horse = new HorseDTO();
            horse.setOwnerId(user.getId());
            horse.setName(name.trim());
            horse.setBreed(breed != null ? breed.trim() : "");
            horse.setDateOfBirth(dob);
            horse.setStatus("PENDING");
            horse.setCurrentRating(52); 
            horse.setTotalRaces(0);
            horse.setTotalWins(0);

            HorseDAO horseDAO = new HorseDAO();
            if (horseDAO.create(horse)) {
                session.setAttribute("success", "Horse added to stable successfully.");
            } else {
                session.setAttribute("error", "Failed to add horse. Try again.");
            }
        } catch (ParseException | IllegalArgumentException e) {
            session.setAttribute("error", "Invalid date format. Please use DD/MM/YYYY.");
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=stable");
    }

    private void doUpdateHorse(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int id = Integer.parseInt(request.getParameter("id"));
            String name = request.getParameter("name");
            String breed = request.getParameter("breed");
            String dobStr = request.getParameter("dateOfBirth");

            HorseDAO horseDAO = new HorseDAO();
            HorseDTO horse = horseDAO.findById(id);

            if (horse == null || !horse.getOwnerId().equals(user.getId())) {
                session.setAttribute("error", "Invalid horse selected or permission denied.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=stable");
                return;
            }

            if (name != null && !name.trim().isEmpty()) {
                horse.setName(name.trim());
            }
            if (breed != null) {
                horse.setBreed(breed.trim());
            }
            if (dobStr != null && !dobStr.trim().isEmpty()) {
                SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
                sdf.setLenient(false);
                try {
                    horse.setDateOfBirth(new Date(sdf.parse(dobStr).getTime()));
                } catch (ParseException ex) {
                    session.setAttribute("error", "Invalid date format. Please use DD/MM/YYYY.");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=stable");
                    return;
                }
            }

            if (horseDAO.update(horse)) {
                session.setAttribute("success", "Horse updated successfully.");
            } else {
                session.setAttribute("error", "Failed to update horse.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=stable");
    }

    private void doInviteJockey(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int raceId = Integer.parseInt(request.getParameter("raceId"));
            int horseId = Integer.parseInt(request.getParameter("horseId"));
            int jockeyId = Integer.parseInt(request.getParameter("jockeyId"));

            HorseDAO horseDAO = new HorseDAO();
            RaceDAO raceDAO = new RaceDAO();
            OwnerRaceMeetingRegistrationDAO ownerRegDAO = new OwnerRaceMeetingRegistrationDAO();
            JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new JockeyRaceMeetingRegistrationDAO();
            RaceInvitationDAO invitationDAO = new RaceInvitationDAO();

            HorseDTO horse = horseDAO.findById(horseId);
            if (horse == null || !horse.getOwnerId().equals(user.getId())) {
                session.setAttribute("error", "Invalid horse selected.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            RaceDTO race = raceDAO.findById(raceId);
            if (race == null) {
                session.setAttribute("error", "Invalid race selected.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            int rating = horse.getCurrentRating();
            if (race.getMinRating() != null && rating < race.getMinRating()) {
                session.setAttribute("error", "Horse rating (" + rating + ") is below minimum required rating (" + race.getMinRating() + ").");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }
            if (race.getMaxRating() != null && rating > race.getMaxRating()) {
                session.setAttribute("error", "Horse rating (" + rating + ") is above maximum allowed rating (" + race.getMaxRating() + ").");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            OwnerRaceMeetingRegistrationDTO ownerReg = ownerRegDAO.findByOwnerAndMeeting(user.getId(), race.getRaceMeetingId());
            if (ownerReg == null || !"APPROVED".equals(ownerReg.getStatus())) {
                session.setAttribute("error", "You must be approved for this race meeting before inviting jockeys.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            HorseRaceMeetingRegistrationDTO horseReg = horseRegDAO.findByHorseAndMeeting(horseId, race.getRaceMeetingId());
            if (horseReg == null || !"APPROVED".equals(horseReg.getStatus())) {
                session.setAttribute("error", "The selected horse is not approved for this race meeting.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            JockeyRaceMeetingRegistrationDTO jockeyReg = jockeyRegDAO.findByJockeyAndMeeting(jockeyId, race.getRaceMeetingId());
            if (jockeyReg == null || !"APPROVED".equals(jockeyReg.getStatus())) {
                session.setAttribute("error", "The selected jockey is not approved for this race meeting.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            // Check if jockey already has an active entry in this race
            RaceEntryDAO entryDAO = new RaceEntryDAO();
            List<RaceEntryDTO> raceEntries = entryDAO.findByRaceId(raceId);
            boolean jockeyHasMount = false;
            if (raceEntries != null) {
                for (RaceEntryDTO entry : raceEntries) {
                    if (entry.getJockeyId().equals(jockeyId) && !"REJECTED".equals(entry.getStatus())) {
                        jockeyHasMount = true;
                        break;
                    }
                }
            }
            if (jockeyHasMount) {
                session.setAttribute("error", "This jockey has already accepted another mount for this race.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            // Check if jockey already accepted an invitation for this race
            RaceInvitationDTO acceptedInv = invitationDAO.findAcceptedInvitationByJockeyAndRace(jockeyId, raceId);
            if (acceptedInv != null) {
                session.setAttribute("error", "This jockey has already accepted an invitation for this race.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            // Check if this specific horse already has a pending invitation to this jockey for this race
            RaceInvitationDTO existingInv = invitationDAO.findByJockeyRaceAndHorse(jockeyId, raceId, horseId);
            if (existingInv != null && "PENDING".equals(existingInv.getStatus())) {
                session.setAttribute("error", "You have already sent a pending invitation to this jockey for this horse in this race.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=calendar");
                return;
            }

            RaceInvitationDTO newInv = new RaceInvitationDTO();
            newInv.setRaceId(raceId);
            newInv.setHorseId(horseId);
            newInv.setOwnerId(user.getId());
            newInv.setJockeyId(jockeyId);
            newInv.setStatus("PENDING");

            if (invitationDAO.create(newInv)) {
                session.setAttribute("success", "Invitation sent successfully.");
            } else {
                session.setAttribute("error", "Failed to send invitation.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=invitations");
    }

    private void doConfirmJockey(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws IOException {
        HttpSession session = request.getSession();
        try {
            int invitationId = Integer.parseInt(request.getParameter("invitationId"));

            RaceInvitationDAO invitationDAO = new RaceInvitationDAO();
            RaceInvitationDTO inv = invitationDAO.findById(invitationId);

            if (inv == null || !inv.getOwnerId().equals(user.getId())) {
                session.setAttribute("error", "Invalid invitation selected.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=invitations");
                return;
            }

            if (!"ACCEPTED".equals(inv.getStatus())) {
                session.setAttribute("error", "This invitation has not been accepted by the jockey yet.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=invitations");
                return;
            }

            // Create official RaceEntry
            RaceEntryDAO entryDAO = new RaceEntryDAO();
            
            // Check if horse already has an active entry in this race
            RaceEntryDTO existingEntry = entryDAO.findByHorseAndRace(inv.getHorseId(), inv.getRaceId());
            if (existingEntry != null && !"REJECTED".equals(existingEntry.getStatus())) {
                session.setAttribute("error", "This horse already has an active entry in this race.");
                response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=invitations");
                return;
            }

            UserDAO userDAO = new UserDAO();
            UserDTO jockey = userDAO.getById(inv.getJockeyId());

            RaceEntryDTO newEntry = new RaceEntryDTO();
            newEntry.setRaceId(inv.getRaceId());
            newEntry.setHorseId(inv.getHorseId());
            newEntry.setJockeyId(inv.getJockeyId());
            newEntry.setGateNumber(0); // Admin will assign gate
            newEntry.setStatus("PENDING_ADMIN");
            newEntry.setCarriedWeight(jockey != null ? jockey.getWeight() : java.math.BigDecimal.ZERO);
            newEntry.setPrizeMoney(java.math.BigDecimal.ZERO);
            newEntry.setRatingAdjustment(0);

            if (entryDAO.create(newEntry)) {
                // Reject all other invitations (PENDING or ACCEPTED) for this horse or jockey in this race to clean up
                List<RaceInvitationDTO> allInvites = invitationDAO.findAll();
                if (allInvites != null) {
                    for (RaceInvitationDTO otherInv : allInvites) {
                        if (otherInv.getRaceId().equals(inv.getRaceId()) && !otherInv.getId().equals(inv.getId())) {
                            if ("PENDING".equals(otherInv.getStatus()) || "ACCEPTED".equals(otherInv.getStatus())) {
                                if (otherInv.getHorseId().equals(inv.getHorseId()) || otherInv.getJockeyId().equals(inv.getJockeyId())) {
                                    otherInv.setStatus("REJECTED");
                                    invitationDAO.update(otherInv);
                                }
                            }
                        }
                    }
                }
                session.setAttribute("success", "Official mount confirmed! Race entry submitted for admin review.");
            } else {
                session.setAttribute("error", "Failed to confirm official mount.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            session.setAttribute("error", "Error: " + e.getMessage());
        }
        response.sendRedirect(request.getContextPath() + "/MainController?action=viewDashboard&view=invitations");
    }

    private void doGetHorseHistory(HttpServletRequest request, HttpServletResponse response, UserDTO user)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        try {
            String horseIdStr = request.getParameter("horseId");
            if (horseIdStr == null || horseIdStr.trim().isEmpty()) {
                response.getWriter().write("{\"success\":false,\"message\":\"Missing horseId\"}");
                return;
            }
            int horseId = Integer.parseInt(horseIdStr);
            
            javax.persistence.EntityManager em = utils.JPAUtils.getEntityManager();
            try {
                HorseDTO horse = em.find(HorseDTO.class, horseId);
                if (horse == null || !horse.getOwnerId().equals(user.getId())) {
                    response.getWriter().write("{\"success\":false,\"message\":\"Horse not found or access denied\"}");
                    return;
                }
                
                // Refresh horse entity to bypass caching and load fresh data from DB
                em.refresh(horse);
                
                // Fetch entries bypass cache
                javax.persistence.TypedQuery<RaceEntryDTO> entryQuery = em.createQuery(
                    "SELECT e FROM RaceEntryDTO e WHERE e.horseId = :horseId", RaceEntryDTO.class);
                entryQuery.setHint("javax.persistence.cache.retrieveMode", "BYPASS");
                entryQuery.setParameter("horseId", horseId);
                List<RaceEntryDTO> entries = entryQuery.getResultList();
                
                int totalRaces = 0;
                int totalWins = 0;
                double totalPrize = 0.0;
                double sumPos = 0.0;
                int finishedRaces = 0;
                
                StringBuilder historyJson = new StringBuilder("[");
                boolean first = true;
                
                if (entries != null) {
                    for (RaceEntryDTO e : entries) {
                        em.refresh(e);
                        if ("FINISHED".equals(e.getStatus())) {
                            finishedRaces++;
                            totalRaces++;
                            if (e.getFinalPosition() != null) {
                                sumPos += e.getFinalPosition();
                                if (e.getFinalPosition() == 1) {
                                    totalWins++;
                                }
                            }
                            if (e.getPrizeMoney() != null) {
                                totalPrize += e.getPrizeMoney().doubleValue();
                            }
                            
                            RaceDTO race = em.find(RaceDTO.class, e.getRaceId());
                            String classLevel = "N/A";
                            String startTimeStr = "N/A";
                            String meetingName = "Unknown";
                            
                            if (race != null) {
                                em.refresh(race);
                                classLevel = race.getClassLevel() != null ? race.getClassLevel() : "N/A";
                                if (race.getStartTime() != null) {
                                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm");
                                    startTimeStr = sdf.format(race.getStartTime());
                                }
                                
                                RaceMeetingDTO mt = em.find(RaceMeetingDTO.class, race.getRaceMeetingId());
                                if (mt != null) {
                                    em.refresh(mt);
                                    meetingName = mt.getName() != null ? mt.getName() : "Unknown";
                                }
                            }
                            
                            if (!first) {
                                historyJson.append(",");
                            }
                            first = false;
                            
                            historyJson.append(String.format(
                                "{\"meetingName\":\"%s\",\"classLevel\":\"%s\",\"startTime\":\"%s\",\"position\":%d,\"time\":\"%s\",\"prize\":%.2f,\"adjustment\":%d}",
                                escapeJson(meetingName),
                                escapeJson(classLevel),
                                escapeJson(startTimeStr),
                                e.getFinalPosition() != null ? e.getFinalPosition() : 0,
                                escapeJson(e.getFinishTime() != null ? e.getFinishTime() : ""),
                                e.getPrizeMoney() != null ? e.getPrizeMoney().doubleValue() : 0.0,
                                e.getRatingAdjustment() != null ? e.getRatingAdjustment() : 0
                            ));
                        }
                    }
                }
                historyJson.append("]");
                
                double avgPos = finishedRaces > 0 ? (sumPos / finishedRaces) : 0.0;
                
                String responseJson = String.format(
                    "{\"success\":true,\"horse\":{\"id\":%d,\"name\":\"%s\",\"breed\":\"%s\",\"currentRating\":%d,\"totalRaces\":%d,\"totalWins\":%d,\"avgPosition\":%.2f,\"totalPrize\":%.2f},\"history\":%s}",
                    horse.getId(),
                    escapeJson(horse.getName()),
                    escapeJson(horse.getBreed() != null ? horse.getBreed() : ""),
                    horse.getCurrentRating(),
                    totalRaces,
                    totalWins,
                    avgPos,
                    totalPrize,
                    historyJson.toString()
                );
                
                response.getWriter().write(responseJson);
            } finally {
                em.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"success\":false,\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }
    
    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
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
