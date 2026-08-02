package com.horseracing.backend.service;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.entity.Season;
import com.horseracing.backend.entity.SeasonClassRule;
import com.horseracing.backend.mapper.SeasonClassRuleMapper;
import com.horseracing.backend.mapper.SeasonMapper;
import com.horseracing.backend.repository.SeasonClassRuleRepository;
import com.horseracing.backend.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.horseracing.backend.utils.DateTimeParser;

/**
 * Lớp dịch vụ SeasonService - Quản lý nghiệp vụ mùa giải đua và quy định phân hạng điểm (Class Rules).
 * - Tra cứu danh sách mùa giải.
 * - Khởi tạo mùa giải mới: Hỗ trợ tự động sinh quy định phân hạng mặc định (Class 1 -> Class 5) hoặc thiết lập hạng thủ công.
 * - Bật/Tắt hoạt động mùa giải (Đổi trạng thái giữa ACTIVE và CLOSED).
 * - Xem và lưu quy tắc phân hạng rating cho từng mùa giải.
 * - Gia hạn thời gian mùa giải (Cập nhật ngày bắt đầu và kết thúc).
 */
import com.horseracing.backend.entity.RaceMeeting;
import com.horseracing.backend.repository.RaceMeetingRepository;

@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository; // Kho lưu trữ mùa giải
    private final SeasonClassRuleRepository seasonClassRuleRepository; // Kho lưu trữ quy định hạng
    private final SeasonMapper seasonMapper; // Bộ ánh xạ mùa giải
    private final SeasonClassRuleMapper seasonClassRuleMapper; // Bộ ánh xạ quy định hạng
    private final RaceMeetingRepository raceMeetingRepository;
    private final com.horseracing.backend.repository.OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final com.horseracing.backend.repository.JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final com.horseracing.backend.repository.HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final com.horseracing.backend.repository.UserRepository userRepository;
    private final com.horseracing.backend.repository.WalletTransactionRepository walletTransactionRepository;
    private final com.horseracing.backend.repository.RaceRepository raceRepository;
    private final com.horseracing.backend.repository.RaceInvitationRepository raceInvitationRepository;
    private final com.horseracing.backend.repository.RaceEntryRepository raceEntryRepository;

    // Lấy danh sách toàn bộ mùa giải
    public List<SeasonDTO> getAllSeasons() {
        return seasonRepository.findAll().stream()
                .map(seasonMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Khởi tạo mùa giải mới và thiết lập các hạng đua
    @Transactional
    public SeasonDTO createSeason(Map<String, Object> body) {
        String name = (String) body.get("name");
        String startStr = (String) body.get("startDate");
        String endStr = (String) body.get("endDate");

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Season name cannot be empty.");
        }
        if (seasonRepository.existsByNameIgnoreCase(name.trim())) {
            throw new IllegalArgumentException("Season with name '" + name.trim() + "' already exists.");
        }

        // Phân tích định dạng ngày từ chuỗi sang java.sql.Date
        java.sql.Date startDate = DateTimeParser.parseDate(startStr);
        java.sql.Date endDate = DateTimeParser.parseDate(endStr);
        String classRuleMethod = (String) body.get("classRuleMethod");

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required.");
        }
        if (!startDate.before(endDate)) {
            throw new IllegalArgumentException("Start date (" + startDate + ") must be before end date (" + endDate + ").");
        }

        Season season = new Season();
        season.setName(name.trim());
        season.setStartDate(startDate);
        season.setEndDate(endDate);
        season.setStatus("ACTIVE"); // Thiết lập trạng thái hoạt động mặc định
        Season savedSeason = seasonRepository.save(season);

        // Trường hợp tự động tạo quy định phân hạng (AUTOMATIC)
        if ("AUTOMATIC".equals(classRuleMethod)) {
            // Thiết lập mặc định tự động cho Class 1 - Class 5
            SeasonClassRule class1 = new SeasonClassRule(null, savedSeason.getId(), "Class 1", "Elite Championship", 95, null, new BigDecimal("300000"), new BigDecimal("1000000"));
            SeasonClassRule class2 = new SeasonClassRule(null, savedSeason.getId(), "Class 2", "Premium Group", 80, 94, new BigDecimal("200000"), new BigDecimal("299999"));
            SeasonClassRule class3 = new SeasonClassRule(null, savedSeason.getId(), "Class 3", "Advanced Tier", 60, 79, new BigDecimal("100000"), new BigDecimal("199999"));
            SeasonClassRule class4 = new SeasonClassRule(null, savedSeason.getId(), "Class 4", "Intermediate Level", 40, 59, new BigDecimal("50000"), new BigDecimal("99999"));
            SeasonClassRule class5 = new SeasonClassRule(null, savedSeason.getId(), "Class 5", "Entry Division", 0, 39, new BigDecimal("20000"), new BigDecimal("49999"));

            seasonClassRuleRepository.saveAll(List.of(class1, class2, class3, class4, class5));
        } 
        // Trường hợp tạo quy định phân hạng thủ công (MANUAL)
        else if (body.get("manualClasses") != null) {
            List<Map<String, Object>> manualRules = (List<Map<String, Object>>) body.get("manualClasses");
            List<SeasonClassRuleDTO> dtos = new ArrayList<>();
            for (Map<String, Object> ruleMap : manualRules) {
                String classLevelName = (String) ruleMap.get("classLevelName");
                Integer minRating = ruleMap.get("minRating") != null ? Integer.parseInt(ruleMap.get("minRating").toString()) : null;
                Integer maxRating = ruleMap.get("maxRating") != null ? Integer.parseInt(ruleMap.get("maxRating").toString()) : null;
                BigDecimal minPrize = ruleMap.get("minPrize") != null ? new BigDecimal(String.valueOf(ruleMap.get("minPrize"))) : BigDecimal.ZERO;
                BigDecimal maxPrize = ruleMap.get("maxPrize") != null ? new BigDecimal(String.valueOf(ruleMap.get("maxPrize"))) : BigDecimal.ZERO;

                SeasonClassRuleDTO dto = new SeasonClassRuleDTO();
                dto.setClassLevel(classLevelName);
                dto.setMinRating(minRating);
                dto.setMaxRating(maxRating);
                dto.setMinPrize(minPrize);
                dto.setMaxPrize(maxPrize);
                dtos.add(dto);
            }

            validateSeasonClassRulesHierarchy(dtos);

            for (SeasonClassRuleDTO dto : dtos) {
                SeasonClassRule rule = new SeasonClassRule();
                rule.setSeasonId(savedSeason.getId());
                rule.setClassLevel(dto.getClassLevel());
                rule.setClassName(dto.getClassLevel() + " Custom Tier");
                rule.setMinRating(dto.getMinRating());
                rule.setMaxRating(dto.getMaxRating());
                rule.setMinPrize(dto.getMinPrize());
                rule.setMaxPrize(dto.getMaxPrize());

                seasonClassRuleRepository.save(rule);
            }
        }

        return seasonMapper.toDTO(savedSeason);
    }

    // Đảo ngược trạng thái hoạt động của mùa giải (ACTIVE <-> CLOSED)
    @Transactional
    public String toggleSeasonStatus(Integer id) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        String nextStatus = "ACTIVE".equals(season.getStatus()) ? "CLOSED" : "ACTIVE";
        season.setStatus(nextStatus);
        seasonRepository.save(season);

        // Nếu mùa giải bị Khóa / Đóng (CLOSED), chuyển toàn bộ các RaceMeeting trực thuộc sang INACTIVE, hoàn lại ngân sách giải về Ví Admin, hoàn 100% tiền vé từ Escrow và reset danh sách người tham gia
        if ("CLOSED".equals(nextStatus) || "LOCKED".equals(nextStatus)) {
            List<RaceMeeting> meetings = raceMeetingRepository.findBySeasonId(id);
            com.horseracing.backend.entity.User admin = userRepository.findAll().stream()
                    .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                    .findFirst().orElse(null);

            for (RaceMeeting m : meetings) {
                boolean wasActive = !"INACTIVE".equalsIgnoreCase(m.getStatus());
                m.setStatus("INACTIVE");

                // Hoàn lại ngân sách giải đấu ($totalBudget) về Ví Admin nếu meeting đang active và đặt totalBudget = 0
                BigDecimal curBudget = m.getTotalBudget() != null ? m.getTotalBudget() : BigDecimal.ZERO;
                if (curBudget.compareTo(BigDecimal.ZERO) > 0) {
                    m.setLastAllocatedBudget(curBudget); // Lưu mốc ngân sách cũ
                }
                BigDecimal budgetToRefund = m.getLastAllocatedBudget() != null ? m.getLastAllocatedBudget() : curBudget;

                if (wasActive && admin != null && budgetToRefund.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal adminBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
                    admin.setWalletBalance(adminBal.add(budgetToRefund));
                    userRepository.save(admin);

                    com.horseracing.backend.entity.WalletTransaction txAdmin = new com.horseracing.backend.entity.WalletTransaction();
                    txAdmin.setUserId(admin.getId());
                    txAdmin.setAmount(budgetToRefund);
                    txAdmin.setTransactionType("MEETING_BUDGET_REFUND");
                    txAdmin.setDescription("Budget refund to Admin Wallet due to Season Lock (" + season.getName() + ") for Meeting '" + m.getName() + "'");
                    txAdmin.setRaceMeetingId(m.getId());
                    txAdmin.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(txAdmin);
                }

                // Đặt totalBudget của RaceMeeting về 0
                m.setTotalBudget(BigDecimal.ZERO);
                raceMeetingRepository.save(m);

                // Hoàn lại tiền vé cho Chủ ngựa từ Quỹ Escrow Vault
                BigDecimal ticketPrice = m.getTicketPrice() != null ? m.getTicketPrice() : BigDecimal.ZERO;
                if (ticketPrice.compareTo(BigDecimal.ZERO) > 0) {
                    List<com.horseracing.backend.entity.OwnerRaceMeetingRegistration> ownerRegs = ownerRegRepository.findByRaceMeetingId(m.getId());
                    for (com.horseracing.backend.entity.OwnerRaceMeetingRegistration reg : ownerRegs) {
                        if (!"REJECTED".equalsIgnoreCase(reg.getStatus()) && reg.getOwnerId() != null) {
                            userRepository.findById(reg.getOwnerId()).ifPresent(owner -> {
                                BigDecimal curBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                                owner.setWalletBalance(curBal.add(ticketPrice));
                                userRepository.save(owner);

                                com.horseracing.backend.entity.WalletTransaction txOwner = new com.horseracing.backend.entity.WalletTransaction();
                                txOwner.setUserId(owner.getId());
                                txOwner.setAmount(ticketPrice);
                                txOwner.setTransactionType("TICKET_REFUND");
                                txOwner.setDescription("Ticket fee refund from Escrow Vault due to Season Lock (" + season.getName() + ")");
                                txOwner.setRaceMeetingId(m.getId());
                                txOwner.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                                walletTransactionRepository.save(txOwner);
                            });
                        }
                        reg.setStatus("REJECTED");
                        ownerRegRepository.save(reg);
                    }
                }

                // Hoàn lại tiền cọc thuê nài (Hire Fee) cho Owner và thu hồi từ Jockey (nếu đã thanh toán) khi Deactive Season
                List<com.horseracing.backend.entity.Race> sRaces = raceRepository.findByRaceMeetingId(m.getId());
                for (com.horseracing.backend.entity.Race r : sRaces) {
                    List<com.horseracing.backend.entity.RaceInvitation> invs = raceInvitationRepository.findByRaceId(r.getId());
                    for (com.horseracing.backend.entity.RaceInvitation inv : invs) {
                        if (!"REFUNDED".equalsIgnoreCase(inv.getPayoutStatus()) && inv.getOwnerId() != null) {
                            BigDecimal hireFee = inv.getHireFee() != null ? inv.getHireFee() : new BigDecimal("500.00");
                            boolean wasHeldOrPaid = "HELD".equalsIgnoreCase(inv.getPayoutStatus()) || "PAID".equalsIgnoreCase(inv.getPayoutStatus());
                            if (hireFee.compareTo(BigDecimal.ZERO) > 0 && wasHeldOrPaid) {
                                // Nếu đã thanh toán cho Jockey (PAID), thu hồi tiền từ ví Jockey
                                if ("PAID".equalsIgnoreCase(inv.getPayoutStatus()) && inv.getJockeyId() != null) {
                                    userRepository.findById(inv.getJockeyId()).ifPresent(jockey -> {
                                        BigDecimal jBal = jockey.getWalletBalance() != null ? jockey.getWalletBalance() : BigDecimal.ZERO;
                                        jockey.setWalletBalance(jBal.subtract(hireFee));
                                        userRepository.save(jockey);

                                        com.horseracing.backend.entity.WalletTransaction txClawback = new com.horseracing.backend.entity.WalletTransaction();
                                        txClawback.setUserId(jockey.getId());
                                        txClawback.setAmount(hireFee.negate());
                                        txClawback.setTransactionType("JOCKEY_HIRE_CLAWBACK");
                                        txClawback.setDescription("Jockey hire fee clawback due to Season Lock (" + season.getName() + ")");
                                        txClawback.setRaceMeetingId(m.getId());
                                        txClawback.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                                        walletTransactionRepository.save(txClawback);
                                    });
                                }
                                // Hoàn lại 100% tiền cọc thuê nài về ví của Owner nếu tiền thực sự đã được trừ (HELD/PAID)
                                userRepository.findById(inv.getOwnerId()).ifPresent(owner -> {
                                    BigDecimal ownerBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                                    owner.setWalletBalance(ownerBal.add(hireFee));
                                    userRepository.save(owner);

                                    com.horseracing.backend.entity.WalletTransaction txHire = new com.horseracing.backend.entity.WalletTransaction();
                                    txHire.setUserId(owner.getId());
                                    txHire.setAmount(hireFee);
                                    txHire.setTransactionType("JOCKEY_HIRE_REFUND");
                                    txHire.setDescription("Jockey hire fee refund due to Season Lock (" + season.getName() + ")");
                                    txHire.setRaceMeetingId(m.getId());
                                    txHire.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                                    walletTransactionRepository.save(txHire);
                                });
                            }
                            inv.setPayoutStatus("REFUNDED");
                            inv.setStatus("REJECTED");
                            raceInvitationRepository.save(inv);
                        }
                    }
                }

                // Reset danh sách đăng ký kỵ sĩ, chiến mã và các lượt thi đấu RaceEntry về REJECTED
                List<com.horseracing.backend.entity.JockeyRaceMeetingRegistration> jockeyRegs = jockeyRegRepository.findByRaceMeetingId(m.getId());
                for (com.horseracing.backend.entity.JockeyRaceMeetingRegistration jReg : jockeyRegs) {
                    jReg.setStatus("REJECTED");
                    jockeyRegRepository.save(jReg);
                }
                List<com.horseracing.backend.entity.HorseRaceMeetingRegistration> horseRegs = horseRegRepository.findByRaceMeetingId(m.getId());
                for (com.horseracing.backend.entity.HorseRaceMeetingRegistration hReg : horseRegs) {
                    hReg.setStatus("REJECTED");
                    horseRegRepository.save(hReg);
                }
                for (com.horseracing.backend.entity.Race r : sRaces) {
                    if (!"FINISHED".equalsIgnoreCase(r.getStatus())) {
                        r.setStatus("DECLARATION_OPEN");
                        raceRepository.save(r);
                    }
                    List<com.horseracing.backend.entity.RaceEntry> entries = raceEntryRepository.findByRaceId(r.getId());
                    for (com.horseracing.backend.entity.RaceEntry entry : entries) {
                        if (!"FINISHED".equalsIgnoreCase(entry.getStatus())) {
                            entry.setStatus("REJECTED");
                            entry.setGateNumber(0);
                            entry.setCarriedWeight(BigDecimal.ZERO);
                            entry.setHandicapWeight(BigDecimal.ZERO);
                            raceEntryRepository.save(entry);
                        }
                    }
                }
            }
        }

        return season.getStatus();
    }

    // Lấy các quy định phân hạng điểm Rating của mùa giải
    public List<SeasonClassRuleDTO> getSeasonRules(Integer seasonId) {
        return seasonClassRuleRepository.findBySeasonId(seasonId).stream()
                .map(seasonClassRuleMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Ghi nhận lưu các quy định phân hạng điểm Rating của mùa giải
    @Transactional
    public void saveSeasonRules(Integer seasonId, List<SeasonClassRuleDTO> rules) {
        validateSeasonClassRulesHierarchy(rules);
        for (SeasonClassRuleDTO dto : rules) {
            SeasonClassRule rule = seasonClassRuleMapper.toEntity(dto);
            rule.setSeasonId(seasonId);
            seasonClassRuleRepository.save(rule);
        }
    }

    /**
     * Validates that season class rules adhere to business rules:
     * 1) For each class: 0 < minPrize < maxPrize and minRating < maxRating
     * 2) Rating hierarchy: Lower class maxRating < Higher class minRating (Class 5 max < Class 4 min < Class 3 min...)
     * 3) Prize hierarchy: Class 1 minPrize > Class 2 maxPrize > Class 3 maxPrize...
     * 4) Sum of minPrizes for all classes <= $10,000,000 (Race Meeting min budget limit)
     */
    private void validateSeasonClassRulesHierarchy(List<SeasonClassRuleDTO> rules) {
        if (rules == null || rules.isEmpty()) return;

        Map<Integer, SeasonClassRuleDTO> classMap = new HashMap<>();
        BigDecimal totalMinPrizeSum = BigDecimal.ZERO;

        for (SeasonClassRuleDTO rule : rules) {
            if (rule.getClassLevel() == null) continue;
            String level = rule.getClassLevel().trim().toLowerCase();
            int classNum = -1;
            if (level.startsWith("class")) {
                try {
                    classNum = Integer.parseInt(level.replace("class", "").trim());
                } catch (NumberFormatException ignored) {}
            }
            if (classNum < 1 || classNum > 5) continue;

            Integer minRating = rule.getMinRating();
            Integer maxRating = rule.getMaxRating();
            BigDecimal minPrize = rule.getMinPrize();
            BigDecimal maxPrize = rule.getMaxPrize();

            if (minRating == null) {
                throw new IllegalArgumentException(String.format("Minimum rating for %s is required.", rule.getClassLevel()));
            }
            if (maxRating != null && minRating >= maxRating) {
                throw new IllegalArgumentException(String.format("Minimum rating (%d) must be strictly less than maximum rating (%d) for %s.",
                        minRating, maxRating, rule.getClassLevel()));
            }

            if (minPrize == null || minPrize.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(String.format("Minimum prize money for %s must be greater than $0.00.", rule.getClassLevel()));
            }
            if (maxPrize == null || maxPrize.compareTo(minPrize) <= 0) {
                throw new IllegalArgumentException(String.format("Maximum prize money ($%,.2f) must be strictly greater than minimum prize money ($%,.2f) for %s.",
                        maxPrize != null ? maxPrize : BigDecimal.ZERO, minPrize, rule.getClassLevel()));
            }

            classMap.put(classNum, rule);
            totalMinPrizeSum = totalMinPrizeSum.add(minPrize);
        }

        // Check contiguous non-overlapping rating and prize hierarchy across classes (Class 1 top, Class 5 bottom)
        for (int i = 1; i < 5; i++) {
            SeasonClassRuleDTO higher = classMap.get(i);
            SeasonClassRuleDTO lower = classMap.get(i + 1);
            if (higher != null && lower != null) {
                // Rating hierarchy check: Higher class min rating MUST BE EXACTLY equal to lower class max rating + 1
                if (lower.getMaxRating() != null && higher.getMinRating() != null) {
                    int expectedMinRating = lower.getMaxRating() + 1;
                    if (higher.getMinRating() != expectedMinRating) {
                        if (higher.getMinRating() < expectedMinRating) {
                            throw new IllegalArgumentException(String.format(
                                    "Class %d maximum rating (%d) overlaps with Class %d minimum rating (%d). Rating ranges cannot overlap.",
                                    i + 1, lower.getMaxRating(), i, higher.getMinRating()));
                        } else {
                            throw new IllegalArgumentException(String.format(
                                    "Class %d minimum rating (%d) must be contiguous with Class %d maximum rating (%d). Expected Class %d minimum rating to be %d.",
                                    i, higher.getMinRating(), i + 1, lower.getMaxRating(), i, expectedMinRating));
                        }
                    }
                }

                // Prize hierarchy check: Higher class min prize > Lower class max prize
                if (higher.getMinPrize() != null && lower.getMaxPrize() != null) {
                    if (higher.getMinPrize().compareTo(lower.getMaxPrize()) <= 0) {
                        throw new IllegalArgumentException(String.format(
                                "Class %d minimum prize ($%,.2f) must be strictly greater than Class %d maximum prize ($%,.2f). Higher classes must offer higher prizes.",
                                i, higher.getMinPrize(), i + 1, lower.getMaxPrize()));
                    }
                }
            }
        }

        // Check against Race Meeting min budget limit ($10,000,000)
        BigDecimal maxAllowedSum = new BigDecimal("10000000.00");
        if (totalMinPrizeSum.compareTo(maxAllowedSum) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Total minimum prizes for all classes ($%,.2f) exceeds the minimum Race Meeting budget limit ($%,.2f).",
                    totalMinPrizeSum, maxAllowedSum));
        }
    }

    // Gia hạn thời gian bắt đầu và kết thúc của mùa giải đua
    @Transactional
    public SeasonDTO extendSeason(Integer id, String newStartDateStr, String newEndDateStr) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        
        // Cập nhật ngày bắt đầu mới nếu được truyền vào hợp lệ
        if (newStartDateStr != null && !newStartDateStr.trim().isEmpty()) {
            java.sql.Date newStartDate = DateTimeParser.parseDate(newStartDateStr);
            season.setStartDate(newStartDate);
        }

        // Cập nhật ngày kết thúc mới nếu được truyền vào hợp lệ
        if (newEndDateStr != null && !newEndDateStr.trim().isEmpty()) {
            java.sql.Date newEndDate = DateTimeParser.parseDate(newEndDateStr);
            season.setEndDate(newEndDate);
        }

        Season saved = seasonRepository.save(season);
        return seasonMapper.toDTO(saved);
    }
}
