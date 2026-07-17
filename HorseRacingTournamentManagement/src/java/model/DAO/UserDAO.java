package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import model.DTO.UserDTO;
import utils.JPAUtils;

public class UserDAO extends BaseDAO<UserDTO, Integer> {

    @Override
    public boolean insert(UserDTO dto) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            // Optional: set default values if they are null
            if (dto.getTotalRacesParticipated() == null) {
                dto.setTotalRacesParticipated(0);
            }
            if (dto.getTotalTop3Finishes() == null) {
                dto.setTotalTop3Finishes(0);
            }
            if (dto.getRequireOtp() == null) {
                dto.setRequireOtp(false);
            }
            em.persist(dto);
            em.getTransaction().commit();
            return true;
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

    @Override
    public boolean update(UserDTO dto) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(dto);
            em.getTransaction().commit();
            return true;
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
     * Thực hiện xóa mềm tài khoản người dùng bằng cách chuyển trạng thái sang 'INACTIVE'.
     * Việc này giúp bảo toàn tính toàn vẹn dữ liệu lịch sử các trận đấu liên quan.
     * 
     * @param id Khóa chính (id) của User cần xóa mềm
     * @return true nếu cập nhật trạng thái thành công, ngược lại là false
     */
    @Override
    public boolean deleteById(Integer id) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            UserDTO dto = em.find(UserDTO.class, id);
            if (dto != null) {
                dto.setStatus("INACTIVE");
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
     * Tìm kiếm người dùng dựa trên tên đăng nhập (username).
     * 
     * @param value Tên đăng nhập cần tìm
     * @return Đối tượng UserDTO tương ứng hoặc null nếu không tìm thấy
     */
    public UserDTO getByUsername(String value) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<UserDTO> query = em.createQuery("SELECT u FROM UserDTO u WHERE u.username = :username", UserDTO.class);
            query.setParameter("username", value);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        } finally {
            em.close();
        }
    }

    /**
     * Tìm kiếm người dùng dựa trên địa chỉ email.
     * 
     * @param value Email cần tìm
     * @return Đối tượng UserDTO tương ứng hoặc null nếu không tìm thấy
     */
    public UserDTO getByEmail(String value) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<UserDTO> query = em.createQuery("SELECT u FROM UserDTO u WHERE u.email = :email", UserDTO.class);
            query.setParameter("email", value);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        } finally {
            em.close();
        }
    }

    /**
     * Lấy danh sách người dùng thuộc về một Vai trò (Role) cụ thể.
     * 
     * @param value Mã vai trò (roleId)
     * @return Danh sách các User thuộc vai trò này
     */
    public List<UserDTO> getByRoleId(Integer value) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<UserDTO> query = em.createQuery("SELECT u FROM UserDTO u WHERE u.roleId = :roleId", UserDTO.class);
            query.setParameter("roleId", value);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
