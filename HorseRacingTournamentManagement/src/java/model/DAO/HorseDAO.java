package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.HorseDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Chiến mã (Horse).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO.
 */
public class HorseDAO extends BaseDAO<HorseDTO, Integer> {

    /**
     * Lấy danh sách các chiến mã thuộc sở hữu của một Chủ ngựa (Horse Owner).
     * 
     * @param ownerId Mã chủ sở hữu (ownerId)
     * @return Danh sách các đối tượng HorseDTO, hoặc null nếu xảy ra lỗi
     */
    public List<HorseDTO> findByOwnerId(int ownerId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT h FROM HorseDTO h WHERE h.ownerId = :ownerId";
            TypedQuery<HorseDTO> query = em.createQuery(jpql, HorseDTO.class);
            query.setParameter("ownerId", ownerId);
            return query.getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public List<HorseDTO> findByStatus(String status) {
        EntityManager em = utils.JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT h FROM HorseDTO h WHERE h.status = :status";
            TypedQuery<HorseDTO> query = em.createQuery(jpql, HorseDTO.class);
            query.setParameter("status", status);
            return query.getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
}
