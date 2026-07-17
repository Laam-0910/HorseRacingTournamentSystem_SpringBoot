package model.DAO;

import model.DTO.RoleDTO;

/**
 * Lớp DAO quản lý thực thể Vai trò (Role) người dùng (ví dụ: Admin, Owner, Jockey, Spectator, Referee).
 * Kế thừa toàn bộ các phương thức CRUD cơ bản từ BaseDAO.
 */
public class RoleDAO extends BaseDAO<RoleDTO, Integer> {
    // Không cần định nghĩa thêm phương thức nào do các thao tác CRUD tiêu chuẩn đã được BaseDAO giải quyết.
}
