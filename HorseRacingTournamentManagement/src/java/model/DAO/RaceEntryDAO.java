package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.RaceEntryDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Lượt đăng ký thi đấu của ngựa (RaceEntry).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO và ghi đè hàm xóa để thực hiện Xóa mềm (Soft Delete).
 */
public class RaceEntryDAO extends BaseDAO<RaceEntryDTO, Integer> {

    /**
     * Thực hiện xóa mềm lượt đăng ký bằng cách chuyển trạng thái sang 'REJECTED'.
     * 
     * @param id Mã lượt đăng ký (id) cần hủy/từ chối
     * @return true nếu cập nhật trạng thái thành công, ngược lại là false
     */
    @Override
    public boolean deleteById(Integer id) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            RaceEntryDTO dto = em.find(RaceEntryDTO.class, id);
            if (dto != null) {
                dto.setStatus("REJECTED");
                em.merge(dto);
                em.getTransaction().commit();
                return true;
            }
            em.getTransaction().rollback();
            return false;
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            e.printStackTrace();
            return false;
        } finally {
            em.close();
        }
    }

    /**
     * Lấy danh sách lượt đăng ký thi đấu thuộc về một Trận đua (Race) cụ thể.
     * 
     * @param raceId Mã trận đua
     * @return Danh sách các lượt đăng ký tương ứng
     */
    public List<RaceEntryDTO> getByRaceId(Integer raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceEntryDTO> query = em.createQuery("SELECT r FROM RaceEntryDTO r WHERE r.raceId = :raceId", RaceEntryDTO.class);
            query.setParameter("raceId", raceId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Lấy danh sách lịch sử thi đấu của một Nài ngựa (Jockey).
     * 
     * @param jockeyId Mã nài ngựa
     * @return Danh sách các lượt thi đấu của Jockey này
     */
    public List<RaceEntryDTO> getByJockeyId(Integer jockeyId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceEntryDTO> query = em.createQuery("SELECT r FROM RaceEntryDTO r WHERE r.jockeyId = :jockeyId", RaceEntryDTO.class);
            query.setParameter("jockeyId", jockeyId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Lấy danh sách lịch sử thi đấu của một Chiến mã (Horse).
     * 
     * @param horseId Mã chiến mã
     * @return Danh sách các lượt thi đấu của con ngựa này
     */
    public List<RaceEntryDTO> getByHorseId(Integer horseId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceEntryDTO> query = em.createQuery("SELECT r FROM RaceEntryDTO r WHERE r.horseId = :horseId", RaceEntryDTO.class);
            query.setParameter("horseId", horseId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Lọc danh sách lượt đăng ký thi đấu theo Trạng thái (status).
     * 
     * @param status Trạng thái cần lọc (ví dụ: PENDING, APPROVED, FINISHED, REJECTED)
     * @return Danh sách các lượt đăng ký tương ứng
     */
    public List<RaceEntryDTO> getByStatus(String status) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceEntryDTO> query = em.createQuery("SELECT r FROM RaceEntryDTO r WHERE r.status = :status", RaceEntryDTO.class);
            query.setParameter("status", status);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Các hàm bí danh (Alias) nhằm tương thích ngược với cách gọi trong Controller.
     */
    public List<RaceEntryDTO> findByJockeyId(int jockeyId) {
        return getByJockeyId(jockeyId);
    }

    public List<RaceEntryDTO> findByRaceId(int raceId) {
        return getByRaceId(raceId);
    }

    public List<RaceEntryDTO> findByHorseId(int horseId) {
        return getByHorseId(horseId);
    }

    /**
     * Tìm kiếm lượt thi đấu cụ thể dựa trên liên kết giữa Ngựa và Trận đua.
     * 
     * @param horseId Mã chiến mã
     * @param raceId Mã trận đua
     * @return Đối tượng RaceEntryDTO tương ứng hoặc null nếu không tồn tại
     */
    public RaceEntryDTO findByHorseAndRace(Integer horseId, Integer raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceEntryDTO> query = em.createQuery("SELECT r FROM RaceEntryDTO r WHERE r.horseId = :horseId AND r.raceId = :raceId", RaceEntryDTO.class);
            query.setParameter("horseId", horseId);
            query.setParameter("raceId", raceId);
            List<RaceEntryDTO> list = query.getResultList();
            return (list != null && !list.isEmpty()) ? list.get(0) : null;
        } finally {
            em.close();
        }
    }
}
