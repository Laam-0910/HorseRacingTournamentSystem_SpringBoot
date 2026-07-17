package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import model.DTO.HorseRaceMeetingRegistrationDTO;
import utils.JPAUtils;

/**
 * Data Access Object for HorseRaceMeetingRegistration entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class HorseRaceMeetingRegistrationDAO extends BaseDAO<HorseRaceMeetingRegistrationDTO, Integer> {

    public List<HorseRaceMeetingRegistrationDTO> findByHorseId(int horseId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM HorseRaceMeetingRegistrationDTO r WHERE r.horseId = :horseId";
            TypedQuery<HorseRaceMeetingRegistrationDTO> query = em.createQuery(jpql, HorseRaceMeetingRegistrationDTO.class);
            query.setParameter("horseId", horseId);
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

    public List<HorseRaceMeetingRegistrationDTO> findByRaceMeetingId(int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM HorseRaceMeetingRegistrationDTO r WHERE r.raceMeetingId = :raceMeetingId";
            TypedQuery<HorseRaceMeetingRegistrationDTO> query = em.createQuery(jpql, HorseRaceMeetingRegistrationDTO.class);
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

    public HorseRaceMeetingRegistrationDTO findByHorseAndMeeting(int horseId, int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM HorseRaceMeetingRegistrationDTO r WHERE r.horseId = :horseId AND r.raceMeetingId = :raceMeetingId";
            TypedQuery<HorseRaceMeetingRegistrationDTO> query = em.createQuery(jpql, HorseRaceMeetingRegistrationDTO.class);
            query.setParameter("horseId", horseId);
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
