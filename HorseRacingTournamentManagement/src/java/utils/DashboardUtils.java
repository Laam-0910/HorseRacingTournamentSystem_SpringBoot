package utils;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import model.DAO.RaceEntryDAO;
import model.DAO.HorseRaceMeetingRegistrationDAO;
import model.DAO.JockeyRaceMeetingRegistrationDAO;
import model.DTO.RaceEntryDTO;
import model.DTO.HorseRaceMeetingRegistrationDTO;
import model.DTO.JockeyRaceMeetingRegistrationDTO;

public class DashboardUtils {
    public static void updateRaceStatuses() {
        try {
            model.DAO.RaceDAO raceDAO = new model.DAO.RaceDAO();
            java.util.List<model.DTO.RaceDTO> races = raceDAO.getAll();
            if (races != null) {
                java.sql.Timestamp current = new java.sql.Timestamp(System.currentTimeMillis());
                for (model.DTO.RaceDTO race : races) {
                    String status = race.getStatus();
                    if ("SCHEDULED".equals(status) || "DECLARATION_OPEN".equals(status) || "DECLARATION_CLOSED".equals(status)) {
                        java.sql.Timestamp regStart = race.getRegistrationStartTime();
                        java.sql.Timestamp regEnd = race.getRegistrationEndTime();
                        java.sql.Timestamp start = race.getStartTime();
                        
                        String targetStatus = status;
                        if (start != null && current.compareTo(start) >= 0) {
                            targetStatus = "RUNNING";
                        } else if (regEnd != null && current.compareTo(regEnd) >= 0) {
                            targetStatus = "DECLARATION_CLOSED";
                        } else if (regStart != null && current.compareTo(regStart) >= 0) {
                            targetStatus = "DECLARATION_OPEN";
                        } else {
                            targetStatus = "SCHEDULED";
                        }
                        
                        if (!targetStatus.equals(status)) {
                            race.setStatus(targetStatus);
                            raceDAO.update(race);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void updatePendingCount(HttpServletRequest request) {
        int totalPendingCount = 0;
        try {
            RaceEntryDAO raceEntryDAO = new RaceEntryDAO();
            HorseRaceMeetingRegistrationDAO horseRegDAO = new HorseRaceMeetingRegistrationDAO();
            JockeyRaceMeetingRegistrationDAO jockeyRegDAO = new JockeyRaceMeetingRegistrationDAO();
            
            int pendingEntriesCount = 0;
            List<RaceEntryDTO> pendingEntries = raceEntryDAO.getByStatus("PENDING_ADMIN");
            if (pendingEntries != null) {
                pendingEntriesCount = pendingEntries.size();
            }
            
            int pendingHorseCount = 0;
            List<HorseRaceMeetingRegistrationDTO> allHorseRegs = horseRegDAO.findAll();
            if (allHorseRegs != null) {
                for (HorseRaceMeetingRegistrationDTO reg : allHorseRegs) {
                    if ("PENDING".equals(reg.getStatus())) {
                        pendingHorseCount++;
                    }
                }
            }
            
            int pendingJockeyCount = 0;
            List<JockeyRaceMeetingRegistrationDTO> allJockeyRegs = jockeyRegDAO.findAll();
            if (allJockeyRegs != null) {
                for (JockeyRaceMeetingRegistrationDTO reg : allJockeyRegs) {
                    if ("PENDING".equals(reg.getStatus())) {
                        pendingJockeyCount++;
                    }
                }
            }
            
            int pendingHorsesToApproveCount = 0;
            model.DAO.HorseDAO horseDAO = new model.DAO.HorseDAO();
            // Sử dụng phương thức findByStatus tối ưu hơn vòng lặp findAll
            List<model.DTO.HorseDTO> pendingHorses = horseDAO.findByStatus("PENDING");
            if (pendingHorses != null) {
                pendingHorsesToApproveCount = pendingHorses.size();
            }
            
            totalPendingCount = pendingEntriesCount + pendingHorseCount + pendingJockeyCount + pendingHorsesToApproveCount;
        } catch (Exception e) {
            e.printStackTrace();
        }
        request.setAttribute("totalPendingCount", totalPendingCount);
        request.getSession().setAttribute("totalPendingCount", totalPendingCount);
    }
}