package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.RaceDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Trận đua (Race).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO và ghi đè hàm xóa để thực hiện Xóa mềm (Soft Delete).
 */
public class RaceDAO extends BaseDAO<RaceDTO, Integer> {

    /**
     * Thực hiện xóa mềm trận đua bằng cách chuyển trạng thái sang 'CANCELLED'.
     * 
     * @param id Mã trận đua (id) cần hủy
     * @return true nếu cập nhật trạng thái thành công, ngược lại là false
     */
    @Override
    public boolean deleteById(Integer id) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            RaceDTO dto = em.find(RaceDTO.class, id);
            if (dto != null) {
                dto.setStatus("CANCELLED");
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
     * Lấy danh sách trận đua thuộc một Ngày đua (Race Meeting) cụ thể.
     * 
     * @param raceMeetingId Mã ngày đua
     * @return Danh sách các trận đua tương ứng
     */
    public List<RaceDTO> getByRaceMeetingId(Integer raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceDTO> query = em.createQuery("SELECT r FROM RaceDTO r WHERE r.raceMeetingId = :raceMeetingId", RaceDTO.class);
            query.setParameter("raceMeetingId", raceMeetingId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Lấy danh sách trận đua theo Trạng thái (status).
     * 
     * @param status Trạng thái cần tìm (ví dụ: SCHEDULED, RUNNING, OFFICIAL)
     * @return Danh sách các trận đua tương ứng
     */
    public List<RaceDTO> getByStatus(String status) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceDTO> query = em.createQuery("SELECT r FROM RaceDTO r WHERE r.status = :status", RaceDTO.class);
            query.setParameter("status", status);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Tên gọi khác (Alias) của getByRaceMeetingId để duy trì tính tương thích.
     */
    public List<RaceDTO> findByRaceMeetingId(int raceMeetingId) {
        return getByRaceMeetingId(raceMeetingId);
    }

    /**
     * Truy vấn các cuộc đua đang trong trạng thái RUNNING và có liên kết YouTube Live Stream (đang truyền hình trực tiếp).
     * 
     * @return Danh sách các cuộc đua đang phát trực tiếp
     */
    public List<RaceDTO> getLiveRaces() {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceDTO> query = em.createQuery(
                "SELECT r FROM RaceDTO r WHERE r.status = 'RUNNING' AND r.youtubeLiveUrl IS NOT NULL", RaceDTO.class);
            query.setHint("javax.persistence.cache.retrieveMode", "BYPASS");
            query.setHint("javax.persistence.cache.storeMode", "REFRESH");
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Cập nhật đường dẫn YouTube Live Stream cho một cuộc đua.
     * 
     * @param raceId Mã cuộc đua cần cập nhật
     * @param url Đường dẫn phát trực tiếp
     * @return true nếu cập nhật thành công, ngược lại là false
     */
    public boolean updateYoutubeLiveUrl(Integer raceId, String url) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            RaceDTO dto = em.find(RaceDTO.class, raceId);
            if (dto != null) {
                dto.setYoutubeLiveUrl(url);
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
}
