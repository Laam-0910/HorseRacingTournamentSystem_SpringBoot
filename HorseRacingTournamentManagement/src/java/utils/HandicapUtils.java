package utils;

import java.math.BigDecimal;
import java.util.List;
import model.DAO.HorseDAO;
import model.DAO.RaceEntryDAO;
import model.DAO.UserDAO;
import model.DAO.SystemConfigDAO;
import model.DTO.HorseDTO;
import model.DTO.RaceEntryDTO;
import model.DTO.UserDTO;

/**
 * Utility class to calculate horse handicap weights and actual carried weights
 * based on dynamic settings in SystemConfig.
 */
public class HandicapUtils {

    public static void calculateHandicaps(Integer raceId) {
        if (raceId == null) return;

        RaceEntryDAO entryDAO = new RaceEntryDAO();
        HorseDAO horseDAO = new HorseDAO();
        UserDAO userDAO = new UserDAO();
        SystemConfigDAO configDAO = new SystemConfigDAO();

        // Get config parameters
        double maxTopWeight = Double.parseDouble(configDAO.getConfigValueOrDefault("MAX_TOP_WEIGHT", "60.0"));
        double minBottomWeight = Double.parseDouble(configDAO.getConfigValueOrDefault("MIN_BOTTOM_WEIGHT", "52.0"));
        double weightPerPoint = Double.parseDouble(configDAO.getConfigValueOrDefault("WEIGHT_PER_POINT", "0.5"));

        List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
        if (entries == null || entries.isEmpty()) return;

        // Find R_max (highest rating among APPROVED or PENDING_ADMIN entries)
        int rMax = -1;
        for (RaceEntryDTO entry : entries) {
            if ("APPROVED".equals(entry.getStatus()) || "PENDING_ADMIN".equals(entry.getStatus())) {
                HorseDTO horse = horseDAO.findById(entry.getHorseId());
                if (horse != null && horse.getCurrentRating() != null) {
                    if (horse.getCurrentRating() > rMax) {
                        rMax = horse.getCurrentRating();
                    }
                }
            }
        }

        // If no horses found or ratings are missing, use a baseline
        if (rMax == -1) {
            rMax = 52;
        }

        // Compute weights for each entry
        for (RaceEntryDTO entry : entries) {
            if ("APPROVED".equals(entry.getStatus()) || "PENDING_ADMIN".equals(entry.getStatus())) {
                HorseDTO horse = horseDAO.findById(entry.getHorseId());
                UserDTO jockey = userDAO.getById(entry.getJockeyId());

                int rating = (horse != null && horse.getCurrentRating() != null) ? horse.getCurrentRating() : 0;
                double handicap = maxTopWeight - (rMax - rating) * weightPerPoint;
                if (handicap < minBottomWeight) {
                    handicap = minBottomWeight;
                }

                double jockeyWeight = (jockey != null && jockey.getWeight() != null) ? jockey.getWeight().doubleValue() : 50.0;
                double carried = Math.max(handicap, jockeyWeight);

                entry.setHandicapWeight(BigDecimal.valueOf(handicap));
                entry.setCarriedWeight(BigDecimal.valueOf(carried));
                entryDAO.update(entry);
            }
        }
    }

    public static void assignGates(Integer raceId) {
        if (raceId == null) return;
        RaceEntryDAO entryDAO = new RaceEntryDAO();
        List<RaceEntryDTO> entries = entryDAO.findByRaceId(raceId);
        if (entries == null) return;

        List<RaceEntryDTO> approvedEntries = new java.util.ArrayList<>();
        for (RaceEntryDTO entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
                approvedEntries.add(entry);
            }
        }

        int count = approvedEntries.size();
        List<Integer> gates = new java.util.ArrayList<>();
        for (int i = 1; i <= Math.min(count, 12); i++) {
            gates.add(i);
        }
        java.util.Collections.shuffle(gates);

        for (int i = 0; i < approvedEntries.size(); i++) {
            RaceEntryDTO entry = approvedEntries.get(i);
            if (i < gates.size()) {
                entry.setGateNumber(gates.get(i));
            } else {
                entry.setGateNumber(0);
            }
            entryDAO.update(entry);
        }
    }
}
