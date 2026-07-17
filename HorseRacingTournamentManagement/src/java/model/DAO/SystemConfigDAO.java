package model.DAO;

import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import model.DTO.SystemConfigDTO;
import utils.JPAUtils;

/**
 * Lớp DAO quản lý thực thể Cấu hình hệ thống (SystemConfig).
 * Kế thừa các phương thức CRUD cơ bản từ BaseDAO, với kiểu dữ liệu của khóa chính là String.
 */
public class SystemConfigDAO extends BaseDAO<SystemConfigDTO, String> {

    /**
     * Lấy cấu hình hệ thống dựa trên từ khóa cấu hình (configKey).
     * Tương tự hàm getById của BaseDAO nhưng giữ tên getByConfigKey để tương thích ngược.
     * 
     * @param key Từ khóa cấu hình (ví dụ: 'SMTP_HOST', 'MAX_RACE_LIMIT')
     * @return Đối tượng cấu hình tương ứng
     */
    public SystemConfigDTO getByConfigKey(String key) {
        return getById(key);
    }

    /**
     * Lưu mới cấu hình nếu chưa tồn tại, hoặc cập nhật (merge) cấu hình nếu đã tồn tại.
     * 
     * @param config Đối tượng cấu hình cần lưu/cập nhật
     * @return true nếu thao tác thành công, ngược lại là false
     */
    public boolean saveOrUpdate(SystemConfigDTO config) {
        EntityManager em = JPAUtils.getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            SystemConfigDTO existing = em.find(SystemConfigDTO.class, config.getConfigKey());
            if (existing == null) {
                em.persist(config);
            } else {
                em.merge(config);
            }
            tx.commit();
            return true;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) {
                tx.rollback();
            }
            e.printStackTrace();
            return false;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Lấy giá trị của từ khóa cấu hình nhanh, nếu không tồn tại hoặc rỗng thì trả về giá trị mặc định (fallback).
     * 
     * @param key Từ khóa cấu hình cần tra cứu
     * @param defaultValue Giá trị mặc định trả về nếu cấu hình không tồn tại
     * @return Chuỗi giá trị cấu hình tương ứng hoặc defaultValue
     */
    public String getConfigValueOrDefault(String key, String defaultValue) {
        SystemConfigDTO config = getByConfigKey(key);
        if (config != null && config.getConfigValue() != null) {
            return config.getConfigValue();
        }
        return defaultValue;
    }
}
