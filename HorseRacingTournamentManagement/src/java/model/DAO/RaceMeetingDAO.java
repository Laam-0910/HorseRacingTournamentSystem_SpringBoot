package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.RaceMeetingDTO;
import utils.JPAUtils;

/**
 * Data Access Object for RaceMeeting entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class RaceMeetingDAO extends BaseDAO<RaceMeetingDTO, Integer> {

    @Override
    public boolean deleteById(Integer id) {
        throw new UnsupportedOperationException("Soft delete is not supported for RaceMeeting as it lacks a status column.");
    }

    public List<RaceMeetingDTO> getBySeasonId(Integer seasonId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceMeetingDTO> query = em.createQuery("SELECT r FROM RaceMeetingDTO r WHERE r.seasonId = :seasonId", RaceMeetingDTO.class);
            query.setParameter("seasonId", seasonId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
