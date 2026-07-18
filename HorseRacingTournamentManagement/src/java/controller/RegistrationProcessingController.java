package controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import model.DAO.HorseDAO;
import model.DAO.RaceDAO;
import model.DAO.RaceEntryDAO;
import model.DAO.SeasonClassRuleDAO;
import model.DAO.SystemConfigDAO;
import model.DAO.UserDAO;
import model.DTO.HorseDTO;
import model.DTO.RaceDTO;
import model.DTO.RaceEntryDTO;
import model.DTO.SeasonClassRuleDTO;
import model.DTO.UserDTO;

@WebServlet(name = "RegistrationProcessingController", urlPatterns = {"/admin/registration-processing"})
public class RegistrationProcessingController extends HttpServlet {

    private final RaceEntryDAO raceEntryDAO = new RaceEntryDAO();
    private final HorseDAO horseDAO = new HorseDAO();
    private final UserDAO userDAO = new UserDAO();
    private final SystemConfigDAO configDAO = new SystemConfigDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();
        
        // Fetch all PENDING race entries
        List<RaceEntryDTO> pendingEntries = raceEntryDAO.getByStatus("PENDING_ADMIN");
        
        // Fetch all PENDING horse race meeting registrations
        model.DAO.HorseRaceMeetingRegistrationDAO horseRegDAO = new model.DAO.HorseRaceMeetingRegistrationDAO();
        List<model.DTO.HorseRaceMeetingRegistrationDTO> allHorseRegs = horseRegDAO.findAll();
        List<Map<String, Object>> pendingHorseRegsData = new ArrayList<>();
        if (allHorseRegs != null) {
            for (model.DTO.HorseRaceMeetingRegistrationDTO reg : allHorseRegs) {
                if ("PENDING".equals(reg.getStatus())) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("registration", reg);
                    
                    HorseDTO horse = horseDAO.findById(reg.getHorseId());
                    data.put("horse", horse);
                    
                    if (horse != null && horse.getOwnerId() != null) {
                        UserDTO owner = userDAO.getById(horse.getOwnerId());
                        data.put("owner", owner);
                    }
                    
                    model.DAO.RaceMeetingDAO meetingDAO = new model.DAO.RaceMeetingDAO();
                    model.DTO.RaceMeetingDTO meeting = meetingDAO.findById(reg.getRaceMeetingId());
                    data.put("meeting", meeting);
                    
                    pendingHorseRegsData.add(data);
                }
            }
        }
        request.setAttribute("pendingHorseRegsData", pendingHorseRegsData);

        // Fetch all PENDING new horses
        List<HorseDTO> allHorses = horseDAO.findAll();
        List<Map<String, Object>> pendingNewHorsesData = new ArrayList<>();
        if (allHorses != null) {
            for (HorseDTO h : allHorses) {
                if ("PENDING".equals(h.getStatus())) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("horse", h);
                    if (h.getOwnerId() != null) {
                        UserDTO owner = userDAO.getById(h.getOwnerId());
                        data.put("owner", owner);
                    }
                    pendingNewHorsesData.add(data);
                }
            }
        }
        request.setAttribute("pendingNewHorsesData", pendingNewHorsesData);

        // Fetch all PENDING jockey race meeting registrations
        model.DAO.JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new model.DAO.JockeyRaceMeetingRegistrationDAO();
        List<model.DTO.JockeyRaceMeetingRegistrationDTO> allJockeyRegs = jockeyRegDAO.findAll();
        List<Map<String, Object>> pendingJockeyRegsData = new ArrayList<>();
        if (allJockeyRegs != null) {
            for (model.DTO.JockeyRaceMeetingRegistrationDTO reg : allJockeyRegs) {
                if ("PENDING".equals(reg.getStatus())) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("registration", reg);
                    
                    UserDTO jockey = userDAO.getById(reg.getJockeyId());
                    data.put("jockey", jockey);
                    
                    model.DAO.RaceMeetingDAO meetingDAO = new model.DAO.RaceMeetingDAO();
                    model.DTO.RaceMeetingDTO meeting = meetingDAO.findById(reg.getRaceMeetingId());
                    data.put("meeting", meeting);
                    
                    pendingJockeyRegsData.add(data);
                }
            }
        }
        request.setAttribute("pendingJockeyRegsData", pendingJockeyRegsData);

        // Fetch all PENDING system horses registered by stable owners
        List<HorseDTO> pendingSystemHorses = horseDAO.findByStatus("PENDING");
        List<Map<String, Object>> pendingSystemHorsesData = new ArrayList<>();
        if (pendingSystemHorses != null) {
            for (HorseDTO horse : pendingSystemHorses) {
                Map<String, Object> data = new HashMap<>();
                data.put("horse", horse);
                if (horse.getOwnerId() != null) {
                    UserDTO owner = userDAO.getById(horse.getOwnerId());
                    data.put("owner", owner);
                }
                pendingSystemHorsesData.add(data);
            }
        }
        request.setAttribute("pendingSystemHorsesData", pendingSystemHorsesData);
        request.setAttribute("pendingSystemHorsesDataSize", pendingSystemHorsesData.size());
        
        // Configuration weights
        double weightHorse = Double.parseDouble(configDAO.getConfigValueOrDefault("PREDICT_WEIGHT_HORSE", "0.40"));
        double weightJockey = Double.parseDouble(configDAO.getConfigValueOrDefault("PREDICT_WEIGHT_JOCKEY", "0.25"));
        double weightClass = Double.parseDouble(configDAO.getConfigValueOrDefault("PREDICT_WEIGHT_CLASS", "0.20"));
        double weightForm = Double.parseDouble(configDAO.getConfigValueOrDefault("PREDICT_WEIGHT_FORM", "0.15"));

        List<Map<String, Object>> entriesData = new ArrayList<>();

        java.util.Map<Integer, List<SeasonClassRuleDTO>> seasonRulesCache = new java.util.HashMap<>();
        SeasonClassRuleDAO ruleDAO = new SeasonClassRuleDAO();
        model.DAO.RaceMeetingDAO meetingDAO = new model.DAO.RaceMeetingDAO();

        RaceDAO raceDAO = new RaceDAO();
        if (pendingEntries != null) {
            for (RaceEntryDTO entry : pendingEntries) {
                Map<String, Object> data = new HashMap<>();
                data.put("entry", entry);
                
                HorseDTO horse = null;
                if(entry.getHorseId() != null) horse = horseDAO.findById(entry.getHorseId());
                
                UserDTO jockey = null;
                if(entry.getJockeyId() != null) jockey = userDAO.getById(entry.getJockeyId());
                
                UserDTO owner = null;
                if (horse != null && horse.getOwnerId() != null) {
                    owner = userDAO.getById(horse.getOwnerId());
                }
                
                RaceDTO race = null;
                model.DTO.RaceMeetingDTO meeting = null;
                if (entry.getRaceId() != null) {
                    race = raceDAO.findById(entry.getRaceId());
                    if (race != null && race.getRaceMeetingId() != null) {
                        meeting = meetingDAO.findById(race.getRaceMeetingId());
                    }
                }
                
                data.put("horse", horse);
                data.put("jockey", jockey);
                data.put("owner", owner);
                data.put("race", race);
                data.put("meeting", meeting);

                // 1. Horse Win Rate Score
                double horseWinRateScore = 0;
                if (horse != null && horse.getTotalRaces() != null && horse.getTotalRaces() > 0) {
                    horseWinRateScore = ((double) horse.getTotalWins() / horse.getTotalRaces()) * 100;
                }
                
                // 2. Jockey Skill Score
                double jockeySkillScore = 0;
                if (jockey != null && jockey.getTotalRacesParticipated() != null && jockey.getTotalRacesParticipated() > 0) {
                    jockeySkillScore = ((double) jockey.getTotalTop3Finishes() / jockey.getTotalRacesParticipated()) * 100;
                }

                // 3. Class Score (Dynamic based on SeasonClassRule)
                double classScore = 20; // Default Class 5
                String horseClass = "Class 5";
                if (horse != null && horse.getCurrentRating() != null && race != null) {
                    int rating = horse.getCurrentRating();
                    
                    Integer seasonId = null;
                    if (meeting != null) {
                        seasonId = meeting.getSeasonId();
                    }
                    
                    List<SeasonClassRuleDTO> rules = null;
                    if (seasonId != null) {
                        try {
                            if (!seasonRulesCache.containsKey(seasonId)) {
                                seasonRulesCache.put(seasonId, ruleDAO.getBySeasonId(seasonId));
                            }
                            rules = seasonRulesCache.get(seasonId);
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }
                    
                    SeasonClassRuleDTO matchedRule = null;
                    if (rules != null) {
                        for (SeasonClassRuleDTO rule : rules) {
                            int min = rule.getMinRating() != null ? rule.getMinRating() : 0;
                            int max = rule.getMaxRating() != null ? rule.getMaxRating() : 999;
                            if (rating >= min && rating <= max) {
                                matchedRule = rule;
                                break;
                            }
                        }
                    }
                    
                    if (matchedRule != null) {
                        horseClass = matchedRule.getClassLevel();
                        if ("Class 1".equalsIgnoreCase(horseClass)) classScore = 100;
                        else if ("Class 2".equalsIgnoreCase(horseClass)) classScore = 80;
                        else if ("Class 3".equalsIgnoreCase(horseClass)) classScore = 60;
                        else if ("Class 4".equalsIgnoreCase(horseClass)) classScore = 40;
                        else classScore = 20;
                    } else {
                        // Fallback to aligned defaults matching database rules
                        if (rating >= 95) {
                            classScore = 100;
                            horseClass = "Class 1";
                        } else if (rating >= 80) {
                            classScore = 80;
                            horseClass = "Class 2";
                        } else if (rating >= 60) {
                            classScore = 60;
                            horseClass = "Class 3";
                        } else if (rating >= 40) {
                            classScore = 40;
                            horseClass = "Class 4";
                        } else {
                            classScore = 20;
                            horseClass = "Class 5";
                        }
                    }
                }

                // 4. Recent Form Score
                double recentFormScore = 0;
                if (horse != null) {
                    List<RaceEntryDTO> pastRaces = raceEntryDAO.getByHorseId(horse.getId());
                    // Filter completed races and sort by most recent (assuming ID is sequential for now or order by date if available)
                    // Simplified: just take the last 5 completed races
                    int racesCount = 0;
                    double formPoints = 0;
                    if (pastRaces != null) {
                        for (int i = pastRaces.size() - 1; i >= 0 && racesCount < 5; i--) {
                            RaceEntryDTO past = pastRaces.get(i);
                            if (("COMPLETED".equals(past.getStatus()) || "FINISHED".equals(past.getStatus())) && past.getFinalPosition() != null) {
                                int pos = past.getFinalPosition();
                                if (pos == 1) formPoints += 10;
                                else if (pos == 2) formPoints += 7;
                                else if (pos == 3) formPoints += 5;
                                else if (pos == 4) formPoints += 3;
                                else if (pos == 5) formPoints += 1;
                                racesCount++;
                            }
                        }
                    }
                    // Max possible points for 5 races is 50. Scale to 100.
                    recentFormScore = (formPoints / 50.0) * 100;
                }

                // Final Prediction Score
                double predictionScore = (horseWinRateScore * weightHorse) +
                                         (jockeySkillScore * weightJockey) +
                                         (classScore * weightClass) +
                                         (recentFormScore * weightForm);
                                         
                data.put("horseWinRateScore", String.format("%.2f", horseWinRateScore));
                data.put("jockeySkillScore", String.format("%.2f", jockeySkillScore));
                data.put("classScore", String.format("%.2f", classScore));
                data.put("horseClass", horseClass);
                data.put("recentFormScore", String.format("%.2f", recentFormScore));
                data.put("predictionScore", String.format("%.2f", predictionScore));

                entriesData.add(data);
            }
        }

        // Calculate counts for the top statistic cards
        int pendingCount = (pendingEntries != null ? pendingEntries.size() : 0);
        if (pendingSystemHorses != null) {
            pendingCount += pendingSystemHorses.size();
        }
        if (allHorseRegs != null) {
            for (model.DTO.HorseRaceMeetingRegistrationDTO reg : allHorseRegs) {
                if ("PENDING".equals(reg.getStatus())) {
                    pendingCount++;
                }
            }
        }
        if (allJockeyRegs != null) {
            for (model.DTO.JockeyRaceMeetingRegistrationDTO reg : allJockeyRegs) {
                if ("PENDING".equals(reg.getStatus())) {
                    pendingCount++;
                }
            }
        }

        int approvedCount = 0;
        List<RaceEntryDTO> approvedEntries = raceEntryDAO.getByStatus("APPROVED");
        if (approvedEntries != null) approvedCount += approvedEntries.size();
        if (allHorseRegs != null) {
            for (model.DTO.HorseRaceMeetingRegistrationDTO reg : allHorseRegs) {
                if ("APPROVED".equals(reg.getStatus())) {
                    approvedCount++;
                }
            }
        }
        if (allJockeyRegs != null) {
            for (model.DTO.JockeyRaceMeetingRegistrationDTO reg : allJockeyRegs) {
                if ("APPROVED".equals(reg.getStatus())) {
                    approvedCount++;
                }
            }
        }

        int rejectedCount = 0;
        List<RaceEntryDTO> rejectedEntries = raceEntryDAO.getByStatus("REJECTED");
        if (rejectedEntries != null) rejectedCount += rejectedEntries.size();
        if (allHorseRegs != null) {
            for (model.DTO.HorseRaceMeetingRegistrationDTO reg : allHorseRegs) {
                if ("REJECTED".equals(reg.getStatus())) {
                    rejectedCount++;
                }
            }
        }
        if (allJockeyRegs != null) {
            for (model.DTO.JockeyRaceMeetingRegistrationDTO reg : allJockeyRegs) {
                if ("REJECTED".equals(reg.getStatus())) {
                    rejectedCount++;
                }
            }
        }

        // Add pending new horses to total pending count
        pendingCount += pendingNewHorsesData.size();

        request.setAttribute("awaitingDecisionCount", pendingCount);
        request.setAttribute("approvedCount", approvedCount);
        request.setAttribute("rejectedCount", rejectedCount);

        request.setAttribute("entriesData", entriesData);
        request.setAttribute("entriesDataSize", entriesData.size());
        request.setAttribute("pendingHorseRegsDataSize", pendingHorseRegsData != null ? pendingHorseRegsData.size() : 0);
        request.setAttribute("pendingJockeyRegsDataSize", pendingJockeyRegsData != null ? pendingJockeyRegsData.size() : 0);
        request.setAttribute("pendingNewHorsesDataSize", pendingNewHorsesData.size());
        request.setAttribute("currentView", "processing");
        utils.DashboardUtils.updatePendingCount(request);
        request.getRequestDispatcher("/WEB-INF/dashboards/admin.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
            
        // Dynamically update race statuses based on current time
        utils.DashboardUtils.updateRaceStatuses();
            
        String action = request.getParameter("action");
        String entryIdStr = request.getParameter("entryId");
        String regIdStr = request.getParameter("registrationId");
        String horseIdStr = request.getParameter("horseId");
        
        if (action != null) {
            try {
                // Tích hợp logic xử lý duyệt/từ chối cho cả NEW_HORSE và SYSTEM_HORSE
                if (horseIdStr != null && (
                        "APPROVE_NEW_HORSE".equals(action) || "REJECT_NEW_HORSE".equals(action) ||
                        "APPROVE_SYSTEM_HORSE".equals(action) || "REJECT_SYSTEM_HORSE".equals(action))) {
                    
                    int horseId = Integer.parseInt(horseIdStr);
                    model.DTO.HorseDTO horse = horseDAO.findById(horseId);
                    
                    if (horse != null) {
                        if ("APPROVE_NEW_HORSE".equals(action) || "APPROVE_SYSTEM_HORSE".equals(action)) {
                            horse.setStatus("ACTIVE");
                        } else if ("REJECT_NEW_HORSE".equals(action) || "REJECT_SYSTEM_HORSE".equals(action)) {
                            horse.setStatus("REJECTED");
                        }
                        horseDAO.update(horse);
                    }
                } else if (regIdStr != null && ("APPROVE_HORSE".equals(action) || "REJECT_HORSE".equals(action))) {
                    int regId = Integer.parseInt(regIdStr);
                    model.DAO.HorseRaceMeetingRegistrationDAO horseRegDAO = new model.DAO.HorseRaceMeetingRegistrationDAO();
                    model.DTO.HorseRaceMeetingRegistrationDTO reg = horseRegDAO.findById(regId);
                    if (reg != null) {
                        if ("APPROVE_HORSE".equals(action)) {
                            reg.setStatus("APPROVED");
                        } else if ("REJECT_HORSE".equals(action)) {
                            reg.setStatus("REJECTED");
                        }
                        horseRegDAO.update(reg);
                    }
                } else if (regIdStr != null && ("APPROVE_JOCKEY".equals(action) || "REJECT_JOCKEY".equals(action))) {
                    int regId = Integer.parseInt(regIdStr);
                    model.DAO.JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new model.DAO.JockeyRaceMeetingRegistrationDAO();
                    model.DTO.JockeyRaceMeetingRegistrationDTO reg = jockeyRegDAO.findById(regId);
                    if (reg != null) {
                        if ("APPROVE_JOCKEY".equals(action)) {
                            reg.setStatus("APPROVED");
                        } else if ("REJECT_JOCKEY".equals(action)) {
                            reg.setStatus("REJECTED");
                        }
                        jockeyRegDAO.update(reg);
                    }
                } else if (entryIdStr != null) {
                    int entryId = Integer.parseInt(entryIdStr);
                    RaceEntryDTO entry = raceEntryDAO.getById(entryId);
                    if (entry != null) {
                        if ("APPROVE".equals(action)) {
                            entry.setStatus("APPROVED");
                            raceEntryDAO.update(entry);
                            utils.HandicapUtils.assignGates(entry.getRaceId());
                        } else if ("REJECT".equals(action)) {
                            entry.setStatus("REJECTED");
                            raceEntryDAO.update(entry);
                        }
                        // Trigger handicap calculation for the race entries pool
                        utils.HandicapUtils.calculateHandicaps(entry.getRaceId());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        // Redirect back to GET
        response.sendRedirect(request.getContextPath() + "/admin/registration-processing");
    }
}   