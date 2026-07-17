package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import model.DTO.OwnerRaceMeetingRegistrationDTO;
import utils.JPAUtils;

/**
 * Data Access Object for OwnerRaceMeetingRegistration entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class OwnerRaceMeetingRegistrationDAO extends BaseDAO<OwnerRaceMeetingRegistrationDTO, Integer> {

    public List<OwnerRaceMeetingRegistrationDTO> findByOwnerId(int ownerId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM OwnerRaceMeetingRegistrationDTO r WHERE r.ownerId = :ownerId";
            TypedQuery<OwnerRaceMeetingRegistrationDTO> query = em.createQuery(jpql, OwnerRaceMeetingRegistrationDTO.class);
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

    public List<OwnerRaceMeetingRegistrationDTO> findByRaceMeetingId(int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM OwnerRaceMeetingRegistrationDTO r WHERE r.raceMeetingId = :raceMeetingId";
            TypedQuery<OwnerRaceMeetingRegistrationDTO> query = em.createQuery(jpql, OwnerRaceMeetingRegistrationDTO.class);
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

    public OwnerRaceMeetingRegistrationDTO findByOwnerAndMeeting(int ownerId, int raceMeetingId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            String jpql = "SELECT r FROM OwnerRaceMeetingRegistrationDTO r WHERE r.ownerId = :ownerId AND r.raceMeetingId = :raceMeetingId";
            TypedQuery<OwnerRaceMeetingRegistrationDTO> query = em.createQuery(jpql, OwnerRaceMeetingRegistrationDTO.class);
            query.setParameter("ownerId", ownerId);
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
