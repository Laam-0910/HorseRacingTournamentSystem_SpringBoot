package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.RaceRefereeDTO;
import utils.JPAUtils;

/**
 * Data Access Object for RaceReferee entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class RaceRefereeDAO extends BaseDAO<RaceRefereeDTO, Integer> {

    @Override
    public boolean deleteById(Integer id) {
        throw new UnsupportedOperationException("Soft delete is not supported for RaceReferee as it lacks a status column.");
    }

    public List<RaceRefereeDTO> getByRaceId(Integer raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceRefereeDTO> query = em.createQuery("SELECT r FROM RaceRefereeDTO r WHERE r.raceId = :raceId", RaceRefereeDTO.class);
            query.setParameter("raceId", raceId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    public List<RaceRefereeDTO> getByRefereeId(Integer refereeId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<RaceRefereeDTO> query = em.createQuery("SELECT r FROM RaceRefereeDTO r WHERE r.refereeId = :refereeId", RaceRefereeDTO.class);
            query.setParameter("refereeId", refereeId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
