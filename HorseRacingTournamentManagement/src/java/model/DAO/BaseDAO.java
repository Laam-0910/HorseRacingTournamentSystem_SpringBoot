package model.DAO;

import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import javax.persistence.TypedQuery;
import utils.JPAUtils;

/**
 * Lớp DAO Cơ sở (Generic Base DAO) định nghĩa các thao tác CRUD tiêu chuẩn sử dụng JPA.
 * Giúp loại bỏ mã lặp lại (boilerplate code) và quản lý EntityManager an toàn.
 *
 * @param <T>  Kiểu dữ liệu của thực thể (Entity DTO class)
 * @param <ID> Kiểu dữ liệu của khóa chính (ví dụ: Integer, String)
 */
public abstract class BaseDAO<T, ID extends Serializable> {

    protected final Class<T> entityClass;

    @SuppressWarnings("unchecked")
    protected BaseDAO() {
        // Sử dụng Reflection để lấy kiểu Class thực tế của thực thể T khi chạy
        this.entityClass = (Class<T>) ((ParameterizedType) getClass().getGenericSuperclass())
                .getActualTypeArguments()[0];
    }

    /**
     * Thêm mới một thực thể vào cơ sở dữ liệu (Persist).
     * 
     * @param entity Đối tượng thực thể cần lưu
     * @return true nếu lưu thành công, ngược lại là false
     */
    public boolean insert(T entity) {
        EntityManager em = JPAUtils.getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            em.persist(entity);
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
     * Tên gọi khác (Alias) của hàm insert, đảm bảo tương thích ngược với một số Controller.
     */
    public boolean create(T entity) {
        return insert(entity);
    }

    /**
     * Cập nhật thông tin thực thể đã tồn tại vào cơ sở dữ liệu (Merge).
     * 
     * @param entity Đối tượng thực thể chứa thông tin mới cần cập nhật
     * @return true nếu cập nhật thành công, ngược lại là false
     */
    public boolean update(T entity) {
        EntityManager em = JPAUtils.getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            em.merge(entity);
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
     * Tìm kiếm một thực thể theo khóa chính (Primary Key).
     * 
     * @param id Khóa chính của thực thể cần tìm
     * @return Đối tượng thực thể tìm thấy, hoặc null nếu không tồn tại
     */
    public T getById(ID id) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            return em.find(entityClass, id);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Tên gọi khác (Alias) của hàm getById.
     */
    public T findById(ID id) {
        return getById(id);
    }

    /**
     * Lấy toàn bộ danh sách thực thể có trong bảng.
     * 
     * @return Danh sách các đối tượng thực thể
     */
    public List<T> getAll() {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT e FROM " + entityClass.getSimpleName() + " e";
            TypedQuery<T> query = em.createQuery(jpql, entityClass);
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

    /**
     * Tên gọi khác (Alias) của hàm getAll.
     */
    public List<T> findAll() {
        return getAll();
    }

    /**
     * Xóa vật lý thực thể khỏi cơ sở dữ liệu dựa trên khóa chính (Physical Hard Delete).
     * Các DAO con cần xóa mềm (Soft Delete) sẽ ghi đè (override) lại hàm này.
     * 
     * @param id Khóa chính của thực thể cần xóa
     * @return true nếu xóa thành công, ngược lại là false
     */
    public boolean deleteById(ID id) {
        EntityManager em = JPAUtils.getEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            T entity = em.find(entityClass, id);
            if (entity != null) {
                em.remove(entity);
                tx.commit();
                return true;
            }
            tx.rollback();
            return false;
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
}
