package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import model.DTO.JockeyRaceMeetingRegistrationDTO;
import utils.JPAUtils;

/**
 * Data Access Object for JockeyRaceMeetingRegistration entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class JockeyRaceMeetingRegistrationDAO extends BaseDAO<JockeyRaceMeetingRegistrationDTO, Integer> {

    public List<JockeyRaceMeetingRegistrationDTO> findByJockeyId(int jockeyId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM JockeyRaceMeetingRegistrationDTO r WHERE r.jockeyId = :jockeyId";
            TypedQuery<JockeyRaceMeetingRegistrationDTO> query = em.createQuery(jpql, JockeyRaceMeetingRegistrationDTO.class);
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

    public List<JockeyRaceMeetingRegistrationDTO> findByRaceMeetingId(int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM JockeyRaceMeetingRegistrationDTO r WHERE r.raceMeetingId = :raceMeetingId";
            TypedQuery<JockeyRaceMeetingRegistrationDTO> query = em.createQuery(jpql, JockeyRaceMeetingRegistrationDTO.class);
            query.setParameter("raceMeetingId", raceMeetingId);
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

    public JockeyRaceMeetingRegistrationDTO findByJockeyAndMeeting(int jockeyId, int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM JockeyRaceMeetingRegistrationDTO r WHERE r.jockeyId = :jockeyId AND r.raceMeetingId = :raceMeetingId";
            TypedQuery<JockeyRaceMeetingRegistrationDTO> query = em.createQuery(jpql, JockeyRaceMeetingRegistrationDTO.class);
            query.setParameter("jockeyId", jockeyId);
            query.setParameter("raceMeetingId", raceMeetingId);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
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
