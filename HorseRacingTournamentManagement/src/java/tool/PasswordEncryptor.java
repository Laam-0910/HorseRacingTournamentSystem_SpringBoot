package tool;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordEncryptor {

    /**
     * Hashes a plain text password using BCrypt.
     */
    public static String hashPassword(String plainPassword) {
        if (plainPassword == null) return null;
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(10));
    }

    /**
     * Checks if a plain password matches the hashed password.
     */
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) return false;
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (IllegalArgumentException e) {
            // This happens if the hashedPassword is not a valid BCrypt hash
            // (e.g. legacy plain text passwords in the DB)
            return false;
        }
    }
}
