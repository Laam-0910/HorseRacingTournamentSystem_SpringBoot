package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.ViolationDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Biên bản vi phạm luật lệ trong trận đấu (Violation).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO.
 */
public class ViolationDAO extends BaseDAO<ViolationDTO, Integer> {

    /**
     * Lấy danh sách các biên bản vi phạm luật thuộc về một Trận đua (Race) cụ thể.
     * 
     * @param raceId Mã trận đua cần tra cứu
     * @return Danh sách các biên bản vi phạm của trận đấu này
     */
    public List<ViolationDTO> getByRaceId(Integer raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<ViolationDTO> query = em.createQuery("SELECT v FROM ViolationDTO v WHERE v.raceId = :raceId", ViolationDTO.class);
            query.setParameter("raceId", raceId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    public List<ViolationDTO> getByJockeyId(Integer jockeyId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<ViolationDTO> query = em.createQuery("SELECT v FROM ViolationDTO v WHERE v.jockeyId = :jockeyId", ViolationDTO.class);
            query.setParameter("jockeyId", jockeyId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
