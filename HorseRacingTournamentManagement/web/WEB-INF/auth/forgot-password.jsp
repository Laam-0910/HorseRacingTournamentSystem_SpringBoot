<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="pageTitle">Forgot Password - Horse Race Management</jsp:attribute>
    <jsp:body>
        <div class="relative w-full h-screen overflow-hidden">
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url('${pageContext.request.contextPath}/imports/anhngua1-1.jpg')"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/75"></div>
          </div>

          <div class="relative z-10 flex items-center justify-center w-full h-full px-4">
            <div class="w-full max-w-md">
              <div class="flex items-center justify-center gap-3 mb-8">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: #c9a227">
                  <i data-lucide="trophy" style="width: 24px; height: 24px;" class="text-[#0e0c09]"></i>
                </div>
                <div>
                  <h1 class="font-['Roboto_Slab'] font-bold text-2xl text-foreground">HorseRace</h1>
                  <p class="text-muted-foreground text-xs font-mono uppercase tracking-widest">Management System</p>
                </div>
              </div>

              <div class="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-8 shadow-2xl">
                <h2 class="font-['Roboto_Slab'] font-bold text-xl text-foreground mb-1">Reset Password</h2>
                <p class="text-muted-foreground text-sm mb-6">
                  Enter your email or username. We will send a verification code to your registered email address.
                </p>

                <c:if test="${not empty message}">
                    <div class="mb-4 p-3 rounded text-sm text-[#0a0907] font-mono" style="background-color: #c9a227; color: #0b0d11;">
                        <i data-lucide="info" style="width: 14px; height: 14px; display: inline-block; margin-right: 5px;"></i>
                        ${message}
                    </div>
                </c:if>

                <form action="${pageContext.request.contextPath}/MainController" method="post" class="space-y-4">
                  <input type="hidden" name="action" value="forgotPassword" />
                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Email or Username</label>
                    <input
                      type="text"
                      name="email"
                      class="w-full bg-input border border-border rounded px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Email or Username"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-primary text-primary-foreground py-3 rounded font-mono font-medium hover:bg-[#dfb830] hover:text-[#0e0c09] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                  >
                    Send Verification Code
                    <i data-lucide="send" style="width: 16px; height: 16px;"></i>
                  </button>
                </form>

                <div class="mt-6 pt-6 border-t border-border text-center">
                  <p class="text-xs text-muted-foreground">
                    Remember your password?
                    <a href="${pageContext.request.contextPath}/MainController?action=loginPage" class="text-primary hover:text-[#dfb830] transition-colors font-medium">
                      Back to login
                    </a>
                  </p>
                </div>
              </div>

              <p class="text-center text-xs text-muted-foreground mt-6">
                HorseRace Management System
              </p>
            </div>
          </div>
        </div>
    </jsp:body>
</t:layout>

