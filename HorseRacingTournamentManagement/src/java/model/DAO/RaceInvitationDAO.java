package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import model.DTO.RaceInvitationDTO;
import utils.JPAUtils;

/**
 * Data Access Object for RaceInvitation entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class RaceInvitationDAO extends BaseDAO<RaceInvitationDTO, Integer> {

    public List<RaceInvitationDTO> findByJockeyId(int jockeyId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.jockeyId = :jockeyId";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
            query.setParameter("jockeyId", jockeyId);
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

    public List<RaceInvitationDTO> findByOwnerId(int ownerId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.ownerId = :ownerId";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
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

    public List<RaceInvitationDTO> findByRaceId(int raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.raceId = :raceId";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
            query.setParameter("raceId", raceId);
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

    public RaceInvitationDTO findByJockeyAndRace(int jockeyId, int raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.jockeyId = :jockeyId AND i.raceId = :raceId";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
            query.setParameter("jockeyId", jockeyId);
            query.setParameter("raceId", raceId);
            List<RaceInvitationDTO> list = query.getResultList();
            return (list != null && !list.isEmpty()) ? list.get(0) : null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public RaceInvitationDTO findByJockeyRaceAndHorse(int jockeyId, int raceId, int horseId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.jockeyId = :jockeyId AND i.raceId = :raceId AND i.horseId = :horseId";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
            query.setParameter("jockeyId", jockeyId);
            query.setParameter("raceId", raceId);
            query.setParameter("horseId", horseId);
            List<RaceInvitationDTO> list = query.getResultList();
            return (list != null && !list.isEmpty()) ? list.get(0) : null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public RaceInvitationDTO findAcceptedInvitationByJockeyAndRace(int jockeyId, int raceId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT i FROM RaceInvitationDTO i WHERE i.jockeyId = :jockeyId AND i.raceId = :raceId AND i.status = 'ACCEPTED'";
            TypedQuery<RaceInvitationDTO> query = em.createQuery(jpql, RaceInvitationDTO.class);
            query.setParameter("jockeyId", jockeyId);
            query.setParameter("raceId", raceId);
            List<RaceInvitationDTO> list = query.getResultList();
            return (list != null && !list.isEmpty()) ? list.get(0) : null;
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
