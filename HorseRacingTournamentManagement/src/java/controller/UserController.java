package controller;

import java.io.IOException;
import java.util.Random;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import model.DAO.UserDAO;
import model.DTO.UserDTO;
import tool.EmailSender;
import tool.PasswordEncryptor;

@WebServlet(name = "UserController", urlPatterns = {"/UserController"})
public class UserController extends HttpServlet {

    protected void doLogin(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession();
        
        if (session.getAttribute("user") != null) {
            UserDTO user = (UserDTO) session.getAttribute("user");
            redirectBasedOnRole(user.getRoleId(), request, response);
            return;
        }

        String email = request.getParameter("email");
        String password = request.getParameter("password");
        if (email != null) email = email.trim();
        if (password != null) password = password.trim();

        UserDAO udao = new UserDAO();
        UserDTO user = udao.getByEmail(email);
        if (user == null) {
            user = udao.getByUsername(email);
        }
        
        if (user != null && user.getPasswordHash() != null) {
            boolean validPassword = false;
            
            // Check if it's a legacy plain-text password
            if (!user.getPasswordHash().startsWith("$2a$")) {
                String dbHash = user.getPasswordHash();
                if (dbHash.equals(password)) {
                    validPassword = true;
                    // Auto-upgrade to BCrypt
                    user.setPasswordHash(PasswordEncryptor.hashPassword(password));
                    udao.update(user);
                }
            } else {
                validPassword = PasswordEncryptor.checkPassword(password, user.getPasswordHash());
            }

            if (validPassword) {
                if ("INACTIVE".equals(user.getStatus())) {
                    request.setAttribute("message", "Your account has been deactivated. Please contact an administrator.");
                    request.getRequestDispatcher("WEB-INF/auth/login.jsp").forward(request, response);
                } else {
                    int roleId = user.getRoleId();
                    boolean requireOtp = (user.getRequireOtp() != null && user.getRequireOtp());
                    
                    if (roleId == 1 || roleId == 5 || !requireOtp) {
                        // Admin, Referee, or general OTP disabled bypasses email verification
                        session.setAttribute("user", user);
                        redirectBasedOnRole(roleId, request, response);
                    } else {
                        // Generate OTP for 2FA
                        String otp = String.format("%06d", new Random().nextInt(999999));
                        session.setAttribute("login_otp", otp);
                        session.setAttribute("login_otp_time", System.currentTimeMillis());
                        session.setAttribute("pending_user", user);
                        
                        // Send Email
                        EmailSender.sendVerificationCode(user.getEmail(), otp, "LOGIN");
                        
                        response.sendRedirect(request.getContextPath() + "/MainController?action=verifyLoginPage");
                    }
                }
            } else {
                request.setAttribute("message", "Invalid email or password.");
                request.getRequestDispatcher("WEB-INF/auth/login.jsp").forward(request, response);
            }
        } else {
            request.setAttribute("message", "Invalid email or password.");
            request.getRequestDispatcher("WEB-INF/auth/login.jsp").forward(request, response);
        }
    }
    
    protected void doVerifyLogin(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        String enteredOtp = request.getParameter("otp");
        String sessionOtp = (String) session.getAttribute("login_otp");
        Long otpTime = (Long) session.getAttribute("login_otp_time");
        UserDTO pendingUser = (UserDTO) session.getAttribute("pending_user");
        
        if (sessionOtp != null && sessionOtp.equals(enteredOtp) && pendingUser != null) {
            if (otpTime == null || (System.currentTimeMillis() - otpTime) > 60000) {
                session.removeAttribute("login_otp");
                session.removeAttribute("login_otp_time");
                session.removeAttribute("pending_user");
                request.setAttribute("message", "Verification code has expired (valid for 1 minute). Please try logging in again.");
                request.getRequestDispatcher("WEB-INF/auth/login.jsp").forward(request, response);
            } else {
                session.removeAttribute("login_otp");
                session.removeAttribute("login_otp_time");
                session.removeAttribute("pending_user");
                
                session.setAttribute("user", pendingUser);
                redirectBasedOnRole(pendingUser.getRoleId(), request, response);
            }
        } else {
            request.setAttribute("message", "Invalid or expired verification code.");
            request.getRequestDispatcher("WEB-INF/auth/verify-login.jsp").forward(request, response);
        }
    }

    private void redirectBasedOnRole(int roleId, HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if (roleId == 1) {
            response.sendRedirect(request.getContextPath() + "/MainController");
        } else {
            response.sendRedirect(request.getContextPath() + "/MainController?action=dashboard");
        }
    }

    protected void doLogout(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        if (session.getAttribute("user") != null) {
            session.invalidate();
        }
        response.sendRedirect(request.getContextPath() + "/MainController");
    }

    protected void doRegister(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        String fullName = request.getParameter("fullName");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String confirmPassword = request.getParameter("confirmPassword");

        if (password != null && password.equals(confirmPassword)) {
            UserDAO udao = new UserDAO();
            UserDTO existingUser = udao.getByEmail(email);
            if (existingUser == null) {
                UserDTO newUser = new UserDTO();
                newUser.setUsername(fullName != null ? fullName : email.split("@")[0]);
                newUser.setEmail(email);
                newUser.setPasswordHash(PasswordEncryptor.hashPassword(password));
                
                int roleId = 4; // Default and only registration role is Spectator
                newUser.setRoleId(roleId);
                newUser.setStatus("ACTIVE");
                newUser.setTotalRacesParticipated(0);
                newUser.setTotalTop3Finishes(0);

                if (roleId == 1 || roleId == 5) {
                    // Admin and Referee bypass email verification
                    if (udao.insert(newUser)) {
                        request.getSession().setAttribute("message", "Account created successfully. You can now sign in.");
                        response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
                        return;
                    } else {
                        request.setAttribute("message", "Error creating account. Please try again.");
                    }
                } else {
                    // Instead of inserting directly, generate registration OTP
                    String otp = String.format("%06d", new Random().nextInt(999999));
                    HttpSession session = request.getSession();
                    session.setAttribute("register_otp", otp);
                    session.setAttribute("register_otp_time", System.currentTimeMillis());
                    session.setAttribute("pending_register_user", newUser);
                    
                    // Send verification code
                    EmailSender.sendVerificationCode(email, otp, "REGISTER");
                    
                    response.sendRedirect(request.getContextPath() + "/MainController?action=verifyRegisterPage");
                    return;
                }
            } else {
                request.setAttribute("message", "Email already in use.");
            }
        } else {
            request.setAttribute("message", "Passwords do not match.");
        }
        request.getRequestDispatcher("WEB-INF/auth/register.jsp").forward(request, response);
    }

    protected void doVerifyRegister(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        String enteredOtp = request.getParameter("otp");
        String sessionOtp = (String) session.getAttribute("register_otp");
        Long otpTime = (Long) session.getAttribute("register_otp_time");
        UserDTO pendingRegisterUser = (UserDTO) session.getAttribute("pending_register_user");
        
        if (sessionOtp != null && sessionOtp.equals(enteredOtp) && pendingRegisterUser != null) {
            // Check 5-minute expiration for registration OTP
            if (otpTime == null || (System.currentTimeMillis() - otpTime) > 300000) { // 5 minutes = 300,000 ms
                session.removeAttribute("register_otp");
                session.removeAttribute("register_otp_time");
                session.removeAttribute("pending_register_user");
                request.setAttribute("message", "Verification code has expired. Please register again.");
                request.getRequestDispatcher("WEB-INF/auth/register.jsp").forward(request, response);
            } else {
                UserDAO udao = new UserDAO();
                // Double check email is not taken in the meantime
                if (udao.getByEmail(pendingRegisterUser.getEmail()) != null) {
                    session.removeAttribute("register_otp");
                    session.removeAttribute("register_otp_time");
                    session.removeAttribute("pending_register_user");
                    request.setAttribute("message", "Email already in use. Please register again.");
                    request.getRequestDispatcher("WEB-INF/auth/register.jsp").forward(request, response);
                } else if (udao.insert(pendingRegisterUser)) {
                    session.removeAttribute("register_otp");
                    session.removeAttribute("register_otp_time");
                    session.removeAttribute("pending_register_user");
                    
                    request.getSession().setAttribute("message", "Account created successfully. You can now sign in.");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
                } else {
                    request.setAttribute("message", "Error creating account. Please try again.");
                    request.getRequestDispatcher("WEB-INF/auth/register.jsp").forward(request, response);
                }
            }
        } else {
            request.setAttribute("message", "Invalid verification code.");
            request.getRequestDispatcher("WEB-INF/auth/verify-register.jsp").forward(request, response);
        }
    }

    protected void doForgotPassword(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = request.getParameter("email");
        if (email != null) email = email.trim();

        UserDAO udao = new UserDAO();
        UserDTO user = udao.getByEmail(email);
        if (user == null) {
            user = udao.getByUsername(email);
        }

        if (user != null) {
            int roleId = user.getRoleId();
            // Allow only Spectator(4), Owner(2), Jockey(3)
            if (roleId == 2 || roleId == 3 || roleId == 4) {
                String otp = String.format("%06d", new Random().nextInt(999999));
                HttpSession session = request.getSession();
                session.setAttribute("forgot_otp", otp);
                session.setAttribute("forgot_email", user.getEmail());
                
                EmailSender.sendVerificationCode(user.getEmail(), otp, "FORGOT_PASSWORD");
                
                response.sendRedirect(request.getContextPath() + "/MainController?action=verifyForgotPasswordPage");
            } else {
                request.setAttribute("message", "Your account role is not permitted to reset password this way.");
                request.getRequestDispatcher("WEB-INF/auth/forgot-password.jsp").forward(request, response);
            }
        } else {
            request.setAttribute("message", "Email or Username not found.");
            request.getRequestDispatcher("WEB-INF/auth/forgot-password.jsp").forward(request, response);
        }
    }
    
    protected void doVerifyForgotPassword(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String enteredOtp = request.getParameter("otp");
        HttpSession session = request.getSession();
        String sessionEmail = (String) session.getAttribute("forgot_email");
        String sessionOtp = (String) session.getAttribute("forgot_otp");
        
        if (sessionOtp != null && sessionOtp.equals(enteredOtp) && sessionEmail != null) {
            String newPassword = request.getParameter("newPassword");
            if (newPassword != null && !newPassword.trim().isEmpty()) {
                UserDAO udao = new UserDAO();
                UserDTO user = udao.getByEmail(sessionEmail);
                if (user != null) {
                    user.setPasswordHash(PasswordEncryptor.hashPassword(newPassword));
                    udao.update(user);
                    
                    session.removeAttribute("forgot_otp");
                    session.removeAttribute("forgot_email");
                    
                    session.setAttribute("message", "Password updated successfully. You can now log in.");
                    response.sendRedirect(request.getContextPath() + "/MainController?action=loginPage");
                    return;
                }
            } else {
                request.setAttribute("message", "Please enter a valid new password.");
            }
        } else {
            request.setAttribute("message", "Invalid or expired verification code.");
        }
        request.getRequestDispatcher("WEB-INF/auth/verify-forgot.jsp").forward(request, response);
    }

    protected void doToggleMyOtp(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        HttpSession session = request.getSession();
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
            return;
        }
        
        try {
            boolean currentVal = user.getRequireOtp() != null && user.getRequireOtp();
            boolean newVal = !currentVal;
            user.setRequireOtp(newVal);
            
            UserDAO udao = new UserDAO();
            boolean updated = udao.update(user);
            if (updated) {
                session.setAttribute("user", user);
                response.getWriter().write("{\"success\":true,\"requireOtp\":" + newVal + "}");
            } else {
                response.getWriter().write("{\"success\":false,\"message\":\"Database update failed\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"success\":false,\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        String action = request.getParameter("action");
        if (action == null) {
             response.sendRedirect(request.getContextPath() + "/MainController");
        } else if (action.equals("login")) {
            doLogin(request, response);
        } else if (action.equals("verifyLogin")) {
            doVerifyLogin(request, response);
        } else if (action.equals("logout")) {
            doLogout(request, response);
        } else if (action.equals("register")) {
            doRegister(request, response);
        } else if (action.equals("verifyRegister")) {
            doVerifyRegister(request, response);
        } else if (action.equals("forgotPassword")) {
            doForgotPassword(request, response);
        } else if (action.equals("verifyForgotPassword")) {
            doVerifyForgotPassword(request, response);
        } else if (action.equals("toggleMyOtp")) {
            doToggleMyOtp(request, response);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }
}
