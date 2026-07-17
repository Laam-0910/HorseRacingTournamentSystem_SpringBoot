package model.DAO;

import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import model.DTO.SeasonClassRuleDTO;
import utils.JPAUtils;

/**
 * Data Access Object for SeasonClassRule entity.
 * Inherits standard CRUD operations from BaseDAO.
 */
public class SeasonClassRuleDAO extends BaseDAO<SeasonClassRuleDTO, Integer> {

    @Override
    public boolean deleteById(Integer id) {
        throw new UnsupportedOperationException("Soft delete is not supported for SeasonClassRule as it lacks a status column.");
    }

    public List<SeasonClassRuleDTO> getBySeasonId(Integer seasonId) {
        EntityManager em = JPAUtils.getEntityManager();
        try {
            TypedQuery<SeasonClassRuleDTO> query = em.createQuery("SELECT s FROM SeasonClassRuleDTO s WHERE s.seasonId = :seasonId", SeasonClassRuleDTO.class);
            query.setParameter("seasonId", seasonId);
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
