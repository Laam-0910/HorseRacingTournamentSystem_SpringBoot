package controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;
import java.text.SimpleDateFormat;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import model.DAO.RaceDAO;
import model.DAO.RaceEntryDAO;
import model.DAO.RaceRefereeDAO;
import model.DAO.UserDAO;
import model.DAO.RaceMeetingDAO;
import model.DAO.HorseDAO;
import model.DAO.SeasonDAO;
import model.DTO.RaceDTO;
import model.DTO.RaceEntryDTO;
import model.DTO.RaceRefereeDTO;
import model.DTO.UserDTO;
import model.DTO.RaceMeetingDTO;
import model.DTO.HorseDTO;
import model.DTO.SeasonDTO;

@WebServlet(name = "RaceDayScheduleController", urlPatterns = {"/RaceDayScheduleController"})
public class RaceDayScheduleController extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");

        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();

        String action = request.getParameter("action");
        RaceDAO raceDAO = new RaceDAO();
        RaceEntryDAO raceEntryDAO = new RaceEntryDAO();
        RaceRefereeDAO raceRefereeDAO = new RaceRefereeDAO();
        UserDAO userDAO = new UserDAO();

        if ("updateEntry".equals(action)) {
            try {
                Integer entryId = Integer.parseInt(request.getParameter("entryId"));
                Integer gateNumber = Integer.parseInt(request.getParameter("gateNumber"));
                BigDecimal carriedWeight = new BigDecimal(request.getParameter("carriedWeight"));

                RaceEntryDTO entry = raceEntryDAO.getById(entryId);
                if (entry != null) {
                    entry.setGateNumber(gateNumber);
                    entry.setCarriedWeight(carriedWeight);
                    raceEntryDAO.update(entry);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/RaceDayScheduleController");
        } else if ("assignReferee".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                Integer refereeId = Integer.parseInt(request.getParameter("refereeId"));

                RaceRefereeDTO raceReferee = new RaceRefereeDTO();
                raceReferee.setRaceId(raceId);
                raceReferee.setRefereeId(refereeId);

                raceRefereeDAO.insert(raceReferee);
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/RaceDayScheduleController");
        } else if ("deassignReferee".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                Integer refereeId = Integer.parseInt(request.getParameter("refereeId"));

                List<RaceRefereeDTO> rrList = raceRefereeDAO.getByRaceId(raceId);
                if (rrList != null) {
                    for (RaceRefereeDTO rr : rrList) {
                        if (rr.getRefereeId().equals(refereeId)) {
                            raceRefereeDAO.deleteById(rr.getId());
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/RaceDayScheduleController");
        } else if ("updateRaceStatus".equals(action)) {
            try {
                Integer raceId = Integer.parseInt(request.getParameter("raceId"));
                String status = request.getParameter("status"); // e.g., 'DECLARATION_CLOSED', 'RACE_ASSIGNED', 'RUNNING'

                RaceDTO race = raceDAO.getById(raceId);
                if (race != null) {
                    race.setStatus(status);
                    raceDAO.update(race);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            response.sendRedirect(request.getContextPath() + "/RaceDayScheduleController");
        } else {
            // Load dynamic data for the view
            RaceMeetingDAO meetingDAO = new RaceMeetingDAO();
            List<RaceMeetingDTO> meetings = meetingDAO.getAll();
            List<String> availableDates = new ArrayList<>();
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");

            List<java.util.Date> rawDates = new ArrayList<>();
            if (meetings != null) {
                for (RaceMeetingDTO meeting : meetings) {
                    if (meeting.getStartDate() != null) {
                        java.sql.Timestamp ts = meeting.getStartDate();
                        java.sql.Date d = new java.sql.Date(ts.getTime());
                        boolean exists = false;
                        for (java.util.Date rd : rawDates) {
                            java.util.Calendar cal1 = java.util.Calendar.getInstance();
                            cal1.setTime(rd);
                            java.util.Calendar cal2 = java.util.Calendar.getInstance();
                            cal2.setTime(d);
                            if (cal1.get(java.util.Calendar.YEAR) == cal2.get(java.util.Calendar.YEAR) &&
                                cal1.get(java.util.Calendar.MONTH) == cal2.get(java.util.Calendar.MONTH) &&
                                cal1.get(java.util.Calendar.DAY_OF_MONTH) == cal2.get(java.util.Calendar.DAY_OF_MONTH)) {
                                exists = true;
                                break;
                            }
                        }
                        if (!exists) {
                            rawDates.add(d);
                        }
                    }
                }
            }
            Collections.sort(rawDates);
            for (java.util.Date d : rawDates) {
                availableDates.add(sdf.format(d));
            }

            String selectedDate = request.getParameter("scheduleDateFilter");
            if (selectedDate == null || selectedDate.trim().isEmpty()) {
                if (!availableDates.isEmpty()) {
                    selectedDate = availableDates.get(0);
                } else {
                    selectedDate = "12/06/2026";
                }
            }

            RaceMeetingDTO selectedMeeting = null;
            if (meetings != null) {
                for (RaceMeetingDTO meeting : meetings) {
                    if (meeting.getStartDate() != null && selectedDate.equals(sdf.format(meeting.getStartDate()))) {
                        selectedMeeting = meeting;
                        break;
                    }
                }
            }

            Map<String, Object> raceDay = new HashMap<>();
            List<Map<String, Object>> events = new ArrayList<>();
            List<Map<String, Object>> enrichedRaces = new ArrayList<>();

            if (selectedMeeting != null) {
                raceDay.put("date", selectedDate);
                raceDay.put("venueName", selectedMeeting.getVenue());
                raceDay.put("meetingName", selectedMeeting.getName());
                
                SeasonDAO seasonDAO = new SeasonDAO();
                SeasonDTO season = seasonDAO.getById(selectedMeeting.getSeasonId());
                if (season != null) {
                    raceDay.put("seasonName", season.getName());
                } else {
                    raceDay.put("seasonName", "N/A");
                }
                
                List<RaceDTO> races = raceDAO.getByRaceMeetingId(selectedMeeting.getId());
                String trackType = "Main Track";
                if (races != null && !races.isEmpty()) {
                    trackType = races.get(0).getTrackType() + " Course";
                }
                raceDay.put("trackType", trackType);
                raceDay.put("lastUpdated", "Just now");

                boolean isLocked = true;
                if (races == null || races.isEmpty()) {
                    isLocked = false;
                } else {
                    for (RaceDTO r : races) {
                        if (!"OFFICIAL".equals(r.getStatus()) && !"RACE_EVENT_ENDED".equals(r.getStatus())) {
                            isLocked = false;
                            break;
                        }
                    }
                }
                raceDay.put("isLocked", isLocked);

                if (races != null) {
                    SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");
                    HorseDAO horseDAO = new HorseDAO();
                    
                    for (RaceDTO race : races) {
                        // Standard timeline event map
                        Map<String, Object> event = new HashMap<>();
                        event.put("time", race.getStartTime() != null ? timeFormat.format(race.getStartTime()) : "12:00");
                        event.put("description", "Race #" + race.getId() + " - " + race.getClassLevel() + " (" + race.getDistanceMeters() + "m, " + race.getTrackType() + ") - Purse: $" + race.getPurse());
                        event.put("department", race.getStatus());
                        events.add(event);

                        // Enriched race map
                        Map<String, Object> raceMap = new HashMap<>();
                        raceMap.put("race", race);

                        // Fetch entries
                        List<RaceEntryDTO> entries = raceEntryDAO.getByRaceId(race.getId());
                        List<Map<String, Object>> raceEntriesEnriched = new ArrayList<>();
                        if (entries != null) {
                            for (RaceEntryDTO entry : entries) {
                                Map<String, Object> entryMap = new HashMap<>();
                                entryMap.put("entry", entry);
                                
                                HorseDTO horse = horseDAO.findById(entry.getHorseId());
                                entryMap.put("horse", horse);
                                
                                UserDTO jockey = userDAO.getById(entry.getJockeyId());
                                entryMap.put("jockey", jockey);
                                
                                raceEntriesEnriched.add(entryMap);
                            }
                        }
                        
                        // Sort entries by gate number
                        Collections.sort(raceEntriesEnriched, (e1, e2) -> {
                            RaceEntryDTO ent1 = (RaceEntryDTO) e1.get("entry");
                            RaceEntryDTO ent2 = (RaceEntryDTO) e2.get("entry");
                            Integer gate1 = ent1.getGateNumber() != null ? ent1.getGateNumber() : 999;
                            Integer gate2 = ent2.getGateNumber() != null ? ent2.getGateNumber() : 999;
                            return gate1.compareTo(gate2);
                        });
                        
                        raceMap.put("entries", raceEntriesEnriched);

                        // Fetch assigned referees
                        List<RaceRefereeDTO> raceRefs = raceRefereeDAO.getByRaceId(race.getId());
                        List<UserDTO> raceReferees = new ArrayList<>();
                        if (raceRefs != null) {
                            for (RaceRefereeDTO rr : raceRefs) {
                                UserDTO refUser = userDAO.getById(rr.getRefereeId());
                                if (refUser != null) {
                                    raceReferees.add(refUser);
                                }
                            }
                        }
                        raceMap.put("referees", raceReferees);

                        enrichedRaces.add(raceMap);
                    }
                    
                    // Sort enriched races by start time
                    Collections.sort(enrichedRaces, (r1, r2) -> {
                        RaceDTO race1 = (RaceDTO) r1.get("race");
                        RaceDTO race2 = (RaceDTO) r2.get("race");
                        String t1 = race1.getStartTime() != null ? timeFormat.format(race1.getStartTime()) : "12:00";
                        String t2 = race2.getStartTime() != null ? timeFormat.format(race2.getStartTime()) : "12:00";
                        return t1.compareTo(t2);
                    });
                }
                Collections.sort(events, (e1, e2) -> ((String) e1.get("time")).compareTo((String) e2.get("time")));
            } else {
                raceDay.put("date", selectedDate);
                raceDay.put("venueName", "No Meeting Scheduled");
                raceDay.put("trackType", "N/A");
                raceDay.put("isLocked", false);
                raceDay.put("lastUpdated", "N/A");
                raceDay.put("seasonName", "N/A");
                raceDay.put("meetingName", "No Meeting Scheduled");
            }

            request.setAttribute("availableDates", availableDates);
            request.setAttribute("raceDay", raceDay);
            request.setAttribute("events", events);
            request.setAttribute("enrichedRaces", enrichedRaces);

            // Fetch other general data for the dashboards
            List<RaceDTO> allRaces = raceDAO.getAll();
            List<RaceEntryDTO> allEntries = raceEntryDAO.getAll();
            List<UserDTO> allUsers = userDAO.getAll(); 
            List<RaceRefereeDTO> assignedReferees = raceRefereeDAO.getAll();

            request.setAttribute("races", allRaces);
            request.setAttribute("entries", allEntries);
            request.setAttribute("users", allUsers);
            request.setAttribute("assignedReferees", assignedReferees);
            
            // Build list of referees (role_id = 5)
            List<UserDTO> refereeList = new ArrayList<>();
            if (allUsers != null) {
                for (UserDTO u : allUsers) {
                    if (u.getRoleId() == 5) {
                        refereeList.add(u);
                    }
                }
            }
            request.setAttribute("refereeList", refereeList);

            request.setAttribute("currentView", "schedule");
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
