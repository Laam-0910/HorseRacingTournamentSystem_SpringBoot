package controller;

import java.io.IOException;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.DAO.RoleDAO;
import model.DAO.UserDAO;
import model.DTO.RoleDTO;
import model.DTO.UserDTO;
import model.DAO.RaceDAO;
import model.DTO.RaceDTO;
import model.DAO.SystemConfigDAO;
import model.DAO.HorseRaceMeetingRegistrationDAO;
import model.DTO.HorseRaceMeetingRegistrationDTO;
import model.DAO.RaceMeetingDAO;
import model.DTO.RaceMeetingDTO;
import model.DAO.SeasonDAO;
import model.DTO.SeasonDTO;
import model.DAO.SeasonClassRuleDAO;
import model.DTO.SeasonClassRuleDTO;

@WebServlet(name = "AdminUserController", urlPatterns = {"/AdminUserController"})
public class AdminUserController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");

        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();

        String action = request.getParameter("action");
        UserDAO userDAO = new UserDAO();
        RoleDAO roleDAO = new RoleDAO();

        if ("updateRacecard".equals(action)) {
            String raceIdStr = request.getParameter("raceId");
            if (raceIdStr != null && !raceIdStr.isEmpty()) {
                try {
                    Integer raceId = Integer.parseInt(raceIdStr);
                    model.DAO.RaceEntryDAO entryDAO = new model.DAO.RaceEntryDAO();
                    List<model.DTO.RaceEntryDTO> entries = entryDAO.getByRaceId(raceId);
                    if (entries != null) {
                        for (model.DTO.RaceEntryDTO entry : entries) {
                            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
                                String gateStr = request.getParameter("gate_" + entry.getId());
                                String handicapStr = request.getParameter("handicap_" + entry.getId());
                                String carriedStr = request.getParameter("carried_" + entry.getId());
                                
                                if (gateStr != null && !gateStr.isEmpty()) {
                                    entry.setGateNumber(Integer.parseInt(gateStr));
                                }
                                if (handicapStr != null && !handicapStr.isEmpty()) {
                                    entry.setHandicapWeight(new java.math.BigDecimal(handicapStr));
                                }
                                if (carriedStr != null && !carriedStr.isEmpty()) {
                                    entry.setCarriedWeight(new java.math.BigDecimal(carriedStr));
                                }
                                entryDAO.update(entry);
                            }
                        }
                    }
                    request.getSession().setAttribute("message", "Racecard updated successfully.");
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("error", "Error updating racecard: " + e.getMessage());
                }
            }
            String meetingId = request.getParameter("meetingId");
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=racecard&meetingId=" + meetingId + "&raceId=" + raceIdStr);
            return;
        } else if ("autoAssignGates".equals(action)) {
            String raceIdStr = request.getParameter("raceId");
            if (raceIdStr != null && !raceIdStr.isEmpty()) {
                try {
                    Integer raceId = Integer.parseInt(raceIdStr);
                    utils.HandicapUtils.assignGates(raceId);
                    request.getSession().setAttribute("message", "Gates assigned sequentially/randomly successfully.");
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("error", "Error assigning gates: " + e.getMessage());
                }
            }
            String meetingId = request.getParameter("meetingId");
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=racecard&meetingId=" + meetingId + "&raceId=" + raceIdStr);
            return;
        } else if ("autoCalculateWeights".equals(action)) {
            String raceIdStr = request.getParameter("raceId");
            if (raceIdStr != null && !raceIdStr.isEmpty()) {
                try {
                    Integer raceId = Integer.parseInt(raceIdStr);
                    utils.HandicapUtils.calculateHandicaps(raceId);
                    request.getSession().setAttribute("message", "Handicap weights calculated successfully.");
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("error", "Error calculating weights: " + e.getMessage());
                }
            }
            String meetingId = request.getParameter("meetingId");
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=racecard&meetingId=" + meetingId + "&raceId=" + raceIdStr);
            return;
        }

        if ("updateRole".equals(action)) {
            String userIdStr = request.getParameter("userId");
            String newRoleIdStr = request.getParameter("newRoleId");

            if (userIdStr != null && newRoleIdStr != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    Integer newRoleId = Integer.parseInt(newRoleIdStr);

                    UserDTO user = userDAO.getById(userId);
                    if (user != null && user.getRoleId() != 1 && user.getRoleId() != 5 && newRoleId != 1 && newRoleId != 5) {
                        user.setRoleId(newRoleId);
                        userDAO.update(user);
                    }
                } catch (NumberFormatException e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=users");
        } else if ("toggleEmailOtp".equals(action)) {
            UserDTO loggedInUser = (UserDTO) request.getSession().getAttribute("user");
            if (loggedInUser != null && loggedInUser.getRoleId() == 1) {
                String value = request.getParameter("value");
                if (value != null) {
                    SystemConfigDAO configDAO = new SystemConfigDAO();
                    model.DTO.SystemConfigDTO config = new model.DTO.SystemConfigDTO();
                    config.setConfigKey("REQUIRE_EMAIL_OTP");
                    config.setConfigValue(value);
                    config.setDescription("Require email OTP verification for Spectator, Horse Owner, and Jockey roles");
                    config.setUpdatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                    configDAO.saveOrUpdate(config);
                    
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\": true, \"value\": \"" + value + "\"}");
                    return;
                }
            }
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": false}");
            return;
        } else if ("toggleStatus".equals(action)) {
            String userIdStr = request.getParameter("userId");
            if (userIdStr != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    UserDTO user = userDAO.getById(userId);
                    UserDTO loggedInUser = (UserDTO) request.getSession().getAttribute("user");
                    
                    if (user != null && loggedInUser != null && !user.getId().equals(loggedInUser.getId())) {
                        if ("INACTIVE".equals(user.getStatus())) {
                            user.setStatus("ACTIVE");
                        } else {
                            user.setStatus("INACTIVE");
                        }
                        userDAO.update(user);
                    }
                } catch (NumberFormatException e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=users");
        } else if ("createUser".equals(action)) {
            String username = request.getParameter("username");
            String email = request.getParameter("email");
            String password = request.getParameter("password");
            String roleIdStr = request.getParameter("roleId");
            
            if (username != null && email != null && password != null && roleIdStr != null) {
                try {
                    Integer roleId = Integer.parseInt(roleIdStr);
                    if (roleId != 1) {
                        UserDTO newUser = new UserDTO();
                        newUser.setUsername(username);
                        newUser.setEmail(email);
                        newUser.setPasswordHash(password);
                        newUser.setRoleId(roleId);
                        newUser.setStatus("ACTIVE");
                        newUser.setTotalRacesParticipated(0);
                        newUser.setTotalTop3Finishes(0);
                        userDAO.insert(newUser);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=users");
        } else if ("editUserPage".equals(action)) {
            String userIdStr = request.getParameter("userId");
            if (userIdStr != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    UserDTO user = userDAO.getById(userId);
                    request.setAttribute("editUser", user);
                    List<RoleDTO> roles = roleDAO.getAll();
                    request.setAttribute("roles", roles);
                    request.getRequestDispatcher("/WEB-INF/admin-workflow/user-edit.jsp").forward(request, response);
                    return;
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=users");
        } else if ("updateUser".equals(action)) {
            String userIdStr = request.getParameter("userId");
            String username = request.getParameter("username");
            String email = request.getParameter("email");
            String requireOtpStr = request.getParameter("requireOtp");
            String roleIdStr = request.getParameter("roleId");
            boolean requireOtp = "true".equals(requireOtpStr);
            if (userIdStr != null && username != null && email != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    UserDTO user = userDAO.getById(userId);
                    if (user != null) {
                        user.setUsername(username);
                        user.setEmail(email);
                        user.setRequireOtp(requireOtp);
                        if (roleIdStr != null && !roleIdStr.isEmpty()) {
                            Integer roleId = Integer.parseInt(roleIdStr);
                            if (user.getRoleId() != 1 && roleId != 1) {
                                user.setRoleId(roleId);
                            }
                        }
                        userDAO.update(user);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=users");
        } else if ("createRace".equals(action)) {
            String raceMeetingIdStr = request.getParameter("raceMeetingId");
            String classLevelStr = request.getParameter("classLevel");
            String trackType = request.getParameter("trackType");
            String startTimeStr = request.getParameter("startTime");
            String regStartTimeStr = request.getParameter("registrationStartTime");
            String regEndTimeStr = request.getParameter("registrationEndTime");
            String distanceMetersStr = request.getParameter("distanceMeters");
            String maxEntriesStr = request.getParameter("maxEntries");
            String purseStr = request.getParameter("purse");

            if (raceMeetingIdStr != null && classLevelStr != null) {
                try {
                    int raceMeetingId = Integer.parseInt(raceMeetingIdStr);
                    int classLevel = Integer.parseInt(classLevelStr);
                    
                    RaceDTO newRace = new RaceDTO();
                    newRace.setRaceMeetingId(raceMeetingId);
                    newRace.setStatus("SCHEDULED");
                    newRace.setClassLevel("Class " + classLevel);
                    newRace.setTrackType(trackType);
                    
                    if (startTimeStr == null || startTimeStr.isEmpty() ||
                        regStartTimeStr == null || regStartTimeStr.isEmpty() ||
                        regEndTimeStr == null || regEndTimeStr.isEmpty()) {
                        throw new IllegalArgumentException("Start time, registration start time, and registration end time are all required.");
                    }
                    
                    java.text.SimpleDateFormat datetimeParser = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm");
                    java.sql.Timestamp start = new java.sql.Timestamp(datetimeParser.parse(startTimeStr).getTime());
                    java.sql.Timestamp regStart = new java.sql.Timestamp(datetimeParser.parse(regStartTimeStr).getTime());
                    java.sql.Timestamp regEnd = new java.sql.Timestamp(datetimeParser.parse(regEndTimeStr).getTime());
                    
                    if (regStart.after(regEnd)) {
                        throw new IllegalArgumentException("Registration start time cannot be after registration end time.");
                    }
                    if (regEnd.after(start)) {
                        throw new IllegalArgumentException("Registration end time cannot be after race start time.");
                    }

                    RaceMeetingDAO checkRmDAO = new RaceMeetingDAO();
                    RaceMeetingDTO checkMeeting = checkRmDAO.findById(raceMeetingId);
                    if (checkMeeting == null) {
                        throw new IllegalArgumentException("Selected race meeting does not exist.");
                    }
                    java.time.LocalDate meetingLocalDate = checkMeeting.getStartDate().toLocalDateTime().toLocalDate();
                    java.time.LocalDate raceStartLocalDate = start.toLocalDateTime().toLocalDate();
                    java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    if (!meetingLocalDate.equals(raceStartLocalDate)) {
                        throw new IllegalArgumentException("Race start time (" + raceStartLocalDate.format(dtf) + ") must be on the same date as the race meeting (" + meetingLocalDate.format(dtf) + ").");
                    }
                    
                    // Check overlapping schedule (trùng lịch đua)
                    RaceDAO raceDAO = new RaceDAO();
                    List<RaceDTO> allRaces = raceDAO.getAll();
                    if (allRaces != null) {
                        java.text.SimpleDateFormat displayTimeFormat = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm");
                        for (RaceDTO r : allRaces) {
                            if (r.getRaceMeetingId().equals(raceMeetingId)) {
                                long diffMs = Math.abs(r.getStartTime().getTime() - start.getTime());
                                if (diffMs < 30 * 60 * 1000) { // 30 minutes
                                    throw new IllegalArgumentException("Trùng lịch đua: Có một trận đấu khác cùng buổi đua diễn ra lúc " + displayTimeFormat.format(r.getStartTime()) + " (các trận phải cách nhau ít nhất 30 phút).");
                                }
                            }
                        }
                    }
                    
                    newRace.setStartTime(start);
                    newRace.setRegistrationStartTime(regStart);
                    newRace.setRegistrationEndTime(regEnd);
                    
                    if (distanceMetersStr != null && !distanceMetersStr.isEmpty()) {
                        newRace.setDistanceMeters(Integer.parseInt(distanceMetersStr));
                    }
                    if (maxEntriesStr != null && !maxEntriesStr.isEmpty()) {
                        newRace.setMaxEntries(Integer.parseInt(maxEntriesStr));
                    }
                    if (purseStr != null && !purseStr.isEmpty()) {
                        newRace.setPurse(new java.math.BigDecimal(purseStr));
                    }
                    
                    Integer minRating = null;
                    Integer maxRating = null;
                    
                    try {
                        RaceMeetingDAO rmDAO = new RaceMeetingDAO();
                        RaceMeetingDTO meeting = rmDAO.findById(raceMeetingId);
                        Integer seasonId = (meeting != null) ? meeting.getSeasonId() : null;
                        if (seasonId != null) {
                            SeasonClassRuleDAO ruleDAO = new SeasonClassRuleDAO();
                            List<SeasonClassRuleDTO> rules = ruleDAO.getBySeasonId(seasonId);
                            if (rules != null) {
                                String targetClass = "Class " + classLevel;
                                for (SeasonClassRuleDTO rule : rules) {
                                    if (targetClass.equalsIgnoreCase(rule.getClassLevel())) {
                                        minRating = rule.getMinRating();
                                        maxRating = rule.getMaxRating();
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                    
                    // Fallback to database-aligned defaults if rules not found
                    if (minRating == null) {
                        if (classLevel == 1) {
                            minRating = 95;
                            maxRating = 999;
                        } else if (classLevel == 2) {
                            minRating = 80;
                            maxRating = 94;
                        } else if (classLevel == 3) {
                            minRating = 60;
                            maxRating = 79;
                        } else if (classLevel == 4) {
                            minRating = 40;
                            maxRating = 59;
                        } else if (classLevel == 5) {
                            minRating = 0;
                            maxRating = 39;
                        }
                    }
                    
                    newRace.setMinRating(minRating);
                    newRace.setMaxRating(maxRating);
                    
                    if (raceDAO.create(newRace)) {
                        request.getSession().removeAttribute("createRaceError");
                    } else {
                        request.getSession().setAttribute("createRaceError", "Failed to save race in database due to schema or constraint issues.");
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("createRaceError", "Invalid input format: " + e.getMessage());
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=race");
        } else if ("updateRace".equals(action)) {
            String raceIdStr = request.getParameter("raceId");
            String startTimeStr = request.getParameter("startTime");
            String regStartTimeStr = request.getParameter("registrationStartTime");
            String regEndTimeStr = request.getParameter("registrationEndTime");
            String distanceMetersStr = request.getParameter("distanceMeters");
            String trackType = request.getParameter("trackType");
            String purseStr = request.getParameter("purse");
            String maxEntriesStr = request.getParameter("maxEntries");

            if (raceIdStr != null && !raceIdStr.isEmpty()) {
                try {
                    int raceId = Integer.parseInt(raceIdStr);
                    RaceDAO raceDAO = new RaceDAO();
                    RaceDTO race = raceDAO.getById(raceId);
                    if (race != null) {
                        if (startTimeStr == null || startTimeStr.isEmpty() ||
                            regStartTimeStr == null || regStartTimeStr.isEmpty() ||
                            regEndTimeStr == null || regEndTimeStr.isEmpty()) {
                            throw new IllegalArgumentException("Start time, registration start time, and registration end time are all required.");
                        }

                        java.text.SimpleDateFormat datetimeParser = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm");
                        java.sql.Timestamp start = new java.sql.Timestamp(datetimeParser.parse(startTimeStr).getTime());
                        java.sql.Timestamp regStart = new java.sql.Timestamp(datetimeParser.parse(regStartTimeStr).getTime());
                        java.sql.Timestamp regEnd = new java.sql.Timestamp(datetimeParser.parse(regEndTimeStr).getTime());

                        if (regStart.after(regEnd)) {
                            throw new IllegalArgumentException("Registration start time cannot be after registration end time.");
                        }
                        if (regEnd.after(start)) {
                            throw new IllegalArgumentException("Registration end time cannot be after race start time.");
                        }
                        
                        RaceMeetingDAO rmDAO = new RaceMeetingDAO();
                        RaceMeetingDTO meeting = rmDAO.findById(race.getRaceMeetingId());
                        if (meeting == null) {
                            throw new IllegalArgumentException("Race meeting for this race does not exist.");
                        }
                        java.time.LocalDate meetingLocalDate = meeting.getStartDate().toLocalDateTime().toLocalDate();
                        java.time.LocalDate raceStartLocalDate = start.toLocalDateTime().toLocalDate();
                        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                        if (!meetingLocalDate.equals(raceStartLocalDate)) {
                            throw new IllegalArgumentException("Race start time (" + raceStartLocalDate.format(dtf) + ") must be on the same date as the race meeting (" + meetingLocalDate.format(dtf) + ").");
                        }

                        // Check overlapping schedule (trùng lịch đua - loại trừ chính nó)
                        List<RaceDTO> allRaces = raceDAO.getAll();
                        if (allRaces != null) {
                            java.text.SimpleDateFormat displayTimeFormat = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm");
                            for (RaceDTO r : allRaces) {
                                if (r.getRaceMeetingId().equals(race.getRaceMeetingId()) && !r.getId().equals(raceId)) {
                                    long diffMs = Math.abs(r.getStartTime().getTime() - start.getTime());
                                    if (diffMs < 30 * 60 * 1000) { // 30 minutes
                                        throw new IllegalArgumentException("Trùng lịch đua: Có một trận đấu khác cùng buổi đua diễn ra lúc " + displayTimeFormat.format(r.getStartTime()) + " (các trận phải cách nhau ít nhất 30 phút).");
                                    }
                                }
                            }
                        }

                        race.setStartTime(start);
                        race.setRegistrationStartTime(regStart);
                        race.setRegistrationEndTime(regEnd);

                        if (distanceMetersStr != null && !distanceMetersStr.isEmpty()) {
                            race.setDistanceMeters(Integer.parseInt(distanceMetersStr));
                        }
                        if (trackType != null && !trackType.isEmpty()) {
                            race.setTrackType(trackType);
                        }
                        if (maxEntriesStr != null && !maxEntriesStr.isEmpty()) {
                            race.setMaxEntries(Integer.parseInt(maxEntriesStr));
                        }
                        if (purseStr != null && !purseStr.isEmpty()) {
                            race.setPurse(new java.math.BigDecimal(purseStr));
                        }

                        if (raceDAO.update(race)) {
                            request.getSession().removeAttribute("createRaceError");
                            request.getSession().setAttribute("message", "Race updated successfully.");
                        } else {
                            request.getSession().setAttribute("createRaceError", "Failed to update race in database.");
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("createRaceError", "Invalid input format: " + e.getMessage());
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=race");
        } else if ("assignReferee".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                Integer refereeId = Integer.parseInt(request.getParameter("refereeId"));

                model.DAO.RaceRefereeDAO raceRefDAO = new model.DAO.RaceRefereeDAO();
                List<model.DTO.RaceRefereeDTO> existing = raceRefDAO.getByRaceId(raceId);
                boolean exists = false;
                if (existing != null) {
                    for (model.DTO.RaceRefereeDTO rr : existing) {
                        if (rr.getRefereeId().equals(refereeId)) {
                            exists = true;
                            break;
                        }
                    }
                }
                if (!exists) {
                    model.DTO.RaceRefereeDTO raceReferee = new model.DTO.RaceRefereeDTO();
                    raceReferee.setRaceId(raceId);
                    raceReferee.setRefereeId(refereeId);
                    raceRefDAO.insert(raceReferee);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=race");
        } else if ("removeReferee".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                Integer refereeId = Integer.parseInt(request.getParameter("refereeId"));

                javax.persistence.EntityManager em = utils.JPAUtils.getEntityManager();
                try {
                    em.getTransaction().begin();
                    javax.persistence.TypedQuery<model.DTO.RaceRefereeDTO> query = em.createQuery(
                        "SELECT r FROM RaceRefereeDTO r WHERE r.raceId = :raceId AND r.refereeId = :refereeId", 
                        model.DTO.RaceRefereeDTO.class
                    );
                    query.setParameter("raceId", raceId);
                    query.setParameter("refereeId", refereeId);
                    List<model.DTO.RaceRefereeDTO> list = query.getResultList();
                    for (model.DTO.RaceRefereeDTO rr : list) {
                        em.remove(em.merge(rr));
                    }
                    em.getTransaction().commit();
                } catch (Exception ex) {
                    if (em.getTransaction().isActive()) {
                        em.getTransaction().rollback();
                    }
                    ex.printStackTrace();
                } finally {
                    em.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=race");
        } else if ("setLivestreamUrl".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                String youtubeLiveUrl = request.getParameter("youtubeLiveUrl");
                if (youtubeLiveUrl != null && !youtubeLiveUrl.trim().isEmpty()) {
                    String rawUrl = youtubeLiveUrl.trim();
                    RaceDAO raceDAO = new RaceDAO();
                    raceDAO.updateYoutubeLiveUrl(raceId, rawUrl);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=live-settings");
        } else if ("removeLivestreamUrl".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                RaceDAO raceDAO = new RaceDAO();
                raceDAO.updateYoutubeLiveUrl(raceId, null);
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=live-settings");
        } else if ("createRaceMeeting".equals(action)) {
            String seasonIdStr = request.getParameter("seasonId");
            String name = request.getParameter("name");
            String dateStr = request.getParameter("date");
            String venue = request.getParameter("venue");
            String purseStr = request.getParameter("purse");

            if (seasonIdStr != null && name != null && dateStr != null && venue != null) {
                try {
                    int seasonId = Integer.parseInt(seasonIdStr);
                    
                    SeasonDAO seasonDAO = new SeasonDAO();
                    SeasonDTO season = seasonDAO.getById(seasonId);
                    if (season == null) {
                        throw new IllegalArgumentException("Selected season does not exist.");
                    }
                    
                    java.text.SimpleDateFormat dateParser = new java.text.SimpleDateFormat("dd/MM/yyyy");
                    java.util.Date parsedDate = dateParser.parse(dateStr);
                    java.sql.Date meetingDate = new java.sql.Date(parsedDate.getTime());
                    java.sql.Date seasonStart = season.getStartDate();
                    java.sql.Date seasonEnd = season.getEndDate();
                    
                    if (meetingDate.before(seasonStart) || meetingDate.after(seasonEnd)) {
                        throw new IllegalArgumentException("Race meeting date must fall within the season date range (" + dateParser.format(seasonStart) + " to " + dateParser.format(seasonEnd) + ").");
                    }
                    
                    RaceMeetingDTO meeting = new RaceMeetingDTO();
                    meeting.setSeasonId(seasonId);
                    meeting.setName(name);
                    java.text.SimpleDateFormat fullParser = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                    meeting.setStartDate(new java.sql.Timestamp(fullParser.parse(dateStr + " 08:00:00").getTime()));
                    meeting.setVenue(venue);
                    if (purseStr != null && !purseStr.isEmpty()) {
                        meeting.setTotalBudget(new java.math.BigDecimal(purseStr));
                    } else {
                        meeting.setTotalBudget(java.math.BigDecimal.ZERO);
                    }
                    RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
                    meetingDAO.insert(meeting);
                    request.getSession().removeAttribute("createMeetingError");
                } catch (Exception e) {
                    e.printStackTrace();
                    request.getSession().setAttribute("createMeetingError", "Failed to create race meeting: " + e.getMessage());
                }
            }
            response.sendRedirect(request.getContextPath() + "/AdminUserController?view=race-meeting");
        } else {
            SystemConfigDAO configDAO = new SystemConfigDAO();
            String otpRequired = configDAO.getConfigValueOrDefault("REQUIRE_EMAIL_OTP", "true");
            request.setAttribute("requireEmailOtp", "true".equalsIgnoreCase(otpRequired));

            List<UserDTO> users = userDAO.getAll();
            List<RoleDTO> roles = roleDAO.getAll();
            
            request.setAttribute("users", users);
            request.setAttribute("roles", roles);
            
            String view = request.getParameter("view");
            if (view == null || view.isEmpty()) {
                view = "live";
            }
            
            if ("live".equals(view)) {
                RaceDAO raceDAO = new RaceDAO();
                RaceMeetingDAO rmDAO = new RaceMeetingDAO();
                SeasonDAO seasonDAO = new SeasonDAO();
                request.setAttribute("liveRaces", raceDAO.getLiveRaces());
                request.setAttribute("meetings", rmDAO.getAll());
                request.setAttribute("allRaces", raceDAO.getAll());
                request.setAttribute("seasons", seasonDAO.getAll());
            } else if ("race".equals(view)) {
                RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
                List<RaceMeetingDTO> meetings = meetingDAO.getAll();
                request.setAttribute("raceMeetings", meetings);
                
                RaceDAO raceDAO = new RaceDAO();
                List<RaceDTO> races = raceDAO.getAll();
                request.setAttribute("races", races);
                request.setAttribute("racesSize", races != null ? races.size() : 0);
                
                java.util.Map<Integer, String> meetingNames = new java.util.HashMap<>();
                if (meetings != null) {
                    for (RaceMeetingDTO m : meetings) {
                        meetingNames.put(m.getId(), m.getName());
                    }
                }
                request.setAttribute("meetingNames", meetingNames);
                
                String createRaceError = (String) request.getSession().getAttribute("createRaceError");
                if (createRaceError != null) {
                    request.setAttribute("createRaceError", createRaceError);
                    request.getSession().removeAttribute("createRaceError");
                }

                // Fetch list of Referees (role_id = 5)
                List<UserDTO> referees = new java.util.ArrayList<>();
                if (users != null) {
                    for (UserDTO u : users) {
                        if (u.getRoleId() == 5) {
                            referees.add(u);
                        }
                    }
                }
                request.setAttribute("referees", referees);

                // Fetch map of assigned referees per race
                model.DAO.RaceRefereeDAO raceRefDAO = new model.DAO.RaceRefereeDAO();
                List<model.DTO.RaceRefereeDTO> raceRefs = raceRefDAO.getAll();
                java.util.Map<Integer, List<UserDTO>> raceRefereesMap = new java.util.HashMap<>();
                if (raceRefs != null) {
                    for (model.DTO.RaceRefereeDTO rr : raceRefs) {
                        UserDTO refUser = userDAO.getById(rr.getRefereeId());
                        if (refUser != null) {
                            raceRefereesMap.computeIfAbsent(rr.getRaceId(), k -> new java.util.ArrayList<>()).add(refUser);
                        }
                    }
                }
                request.setAttribute("raceRefereesMap", raceRefereesMap);
            } else if ("race-meeting".equals(view)) {
                RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
                List<RaceMeetingDTO> meetings = meetingDAO.getAll();
                request.setAttribute("raceMeetings", meetings);
                request.setAttribute("raceMeetingsSize", meetings != null ? meetings.size() : 0);
                
                SeasonDAO seasonDAO = new SeasonDAO();
                List<SeasonDTO> seasons = seasonDAO.getAll();
                request.setAttribute("seasons", seasons);

                String createMeetingError = (String) request.getSession().getAttribute("createMeetingError");
                if (createMeetingError != null) {
                    request.setAttribute("createMeetingError", createMeetingError);
                    request.getSession().removeAttribute("createMeetingError");
                }
            } else if ("racecard".equals(view)) {
                RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
                List<RaceMeetingDTO> meetings = meetingDAO.getAll();
                request.setAttribute("raceMeetings", meetings);

                String meetingIdStr = request.getParameter("meetingId");
                String raceIdStr = request.getParameter("raceId");
                
                Integer meetingId = null;
                Integer raceId = null;
                
                if (meetingIdStr != null && !meetingIdStr.isEmpty()) {
                    meetingId = Integer.parseInt(meetingIdStr);
                    request.setAttribute("selectedMeetingId", meetingId);
                }
                
                if (raceIdStr != null && !raceIdStr.isEmpty()) {
                    raceId = Integer.parseInt(raceIdStr);
                    request.setAttribute("selectedRaceId", raceId);
                }
                
                RaceDAO raceDAO = new RaceDAO();
                List<RaceDTO> races = null;
                if (meetingId != null) {
                    races = new java.util.ArrayList<>();
                    List<RaceDTO> allRaces = raceDAO.getAll();
                    if (allRaces != null) {
                        for (RaceDTO r : allRaces) {
                            if (meetingId.equals(r.getRaceMeetingId())) {
                                races.add(r);
                            }
                        }
                    }
                } else {
                    races = raceDAO.getAll();
                }
                request.setAttribute("races", races);
                
                if (raceId != null) {
                    model.DAO.RaceEntryDAO entryDAO = new model.DAO.RaceEntryDAO();
                    model.DAO.HorseDAO rcHorseDAO = new model.DAO.HorseDAO();
                    model.DAO.UserDAO rcUserDAO = new model.DAO.UserDAO();
                    
                    List<model.DTO.RaceEntryDTO> entries = entryDAO.getByRaceId(raceId);
                    java.util.List<java.util.Map<String, Object>> enrichedEntries = new java.util.ArrayList<>();
                    if (entries != null) {
                        for (model.DTO.RaceEntryDTO entry : entries) {
                            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
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
                        Integer gateA = entryA.getGateNumber() != null ? entryA.getGateNumber() : 0;
                        Integer gateB = entryB.getGateNumber() != null ? entryB.getGateNumber() : 0;
                        return gateA.compareTo(gateB);
                    });
                    request.setAttribute("enrichedEntries", enrichedEntries);
                }
            } else if ("live-settings".equals(view)) {
                RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
                List<RaceMeetingDTO> meetings = meetingDAO.getAll();
                
                RaceDAO raceDAO = new RaceDAO();
                List<RaceDTO> races = raceDAO.getAll();
                request.setAttribute("races", races);
                
                java.util.Map<Integer, String> meetingNames = new java.util.HashMap<>();
                if (meetings != null) {
                    for (RaceMeetingDTO m : meetings) {
                        meetingNames.put(m.getId(), m.getName());
                    }
                }
                request.setAttribute("meetingNames", meetingNames);
            }
            
            request.setAttribute("currentView", view);
            utils.DashboardUtils.updatePendingCount(request);
            request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
        }
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
