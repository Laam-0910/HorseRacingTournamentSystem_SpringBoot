package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.SeasonDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Mùa giải (Season).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO và ghi đè hàm xóa để thực hiện Xóa mềm (Soft Delete).
 */
public class SeasonDAO extends BaseDAO<SeasonDTO, Integer> {

    /**
     * Thực hiện xóa mềm mùa giải bằng cách chuyển trạng thái sang 'CLOSED'.
     * 
     * @param id Mã mùa giải (id) cần kết thúc
     * @return true nếu cập nhật trạng thái thành công, ngược lại là false
     */
    @Override
    public boolean deleteById(Integer id) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            SeasonDTO dto = em.find(SeasonDTO.class, id);
            if (dto != null) {
                dto.setStatus("CLOSED");
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
     * Lấy toàn bộ danh sách mùa giải có trong hệ thống, sắp xếp theo thời gian bắt đầu giảm dần (mới nhất lên đầu).
     * 
     * @return Danh sách các mùa giải đã được sắp xếp
     */
    @Override
    public List<SeasonDTO> getAll() {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<SeasonDTO> query = em.createQuery("SELECT s FROM SeasonDTO s ORDER BY s.startDate DESC", SeasonDTO.class);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
