/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package utils;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
/**
 *
 * @author caonh
 */
public class JPAUtils {
     public final static EntityManagerFactory emf = Persistence.createEntityManagerFactory("HorseRacingTournamentManagementPU");
    public static EntityManager getEntityManager(){
        return emf.createEntityManager();
    }
}
