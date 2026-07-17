<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="pageTitle">Reset Password - Horse Race Management</jsp:attribute>
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
                  <i data-lucide="key-round" style="width: 24px; height: 24px;" class="text-[#0e0c09]"></i>
                </div>
                <div>
                  <h1 class="font-['Roboto_Slab'] font-bold text-2xl text-foreground">Verification</h1>
                  <p class="text-muted-foreground text-xs font-mono uppercase tracking-widest">Password Reset</p>
                </div>
              </div>

              <div class="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-8 shadow-2xl">
                <h2 class="font-['Roboto_Slab'] font-bold text-xl text-foreground mb-1">Enter Code & New Password</h2>
                <p class="text-muted-foreground text-sm mb-6">
                  We've sent a verification code to your email. Enter it below along with your new password.
                </p>

                <c:if test="${not empty message}">
                    <div class="mb-4 p-3 rounded text-sm text-white font-mono" style="background-color: #c0392b;">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline-block; margin-right: 5px;"></i>
                        ${message}
                    </div>
                </c:if>

                <form action="${pageContext.request.contextPath}/MainController" method="post" class="space-y-4">
                  <input type="hidden" name="action" value="verifyForgotPassword" />
                  
                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">6-Digit Code</label>
                    <input
                      type="text"
                      name="otp"
                      maxlength="6"
                      class="w-full bg-input border border-border rounded px-4 py-3 text-center text-xl tracking-[0.3em] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="------"
                      required
                      autocomplete="off"
                    />
                  </div>

                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">New Password</label>
                    <div class="relative">
                      <input
                        id="verify-new-password"
                        type="password"
                        name="newPassword"
                        class="w-full bg-input border border-border rounded pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Enter new password"
                        required
                      />
                      <span
                        role="button"
                        onclick="togglePasswordVisibility('verify-new-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none p-1 flex items-center justify-center"
                        style="transform: translateY(-50%); z-index: 10;"
                      >
                        <i data-lucide="eye" class="w-4.5 h-4.5 pointer-events-none"></i>
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-primary text-primary-foreground py-3 rounded font-mono font-medium hover:bg-[#dfb830] hover:text-[#0e0c09] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                  >
                    Confirm & Update
                    <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                  </button>
                </form>

                <div class="mt-6 pt-6 border-t border-border text-center">
                  <p class="text-xs text-muted-foreground">
                    <a href="${pageContext.request.contextPath}/MainController?action=loginPage" class="text-primary hover:text-[#dfb830] transition-colors font-medium">
                      Cancel and return to login
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </jsp:body>
</t:layout>
