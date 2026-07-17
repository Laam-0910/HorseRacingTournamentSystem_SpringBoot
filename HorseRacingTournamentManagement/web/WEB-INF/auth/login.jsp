<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="pageTitle">Login - Horse Race Management</jsp:attribute>
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
                <h2 class="font-['Roboto_Slab'] font-bold text-xl text-foreground mb-1">Welcome Back</h2>
                <p class="text-muted-foreground text-sm mb-6">
                  Sign in to access your dashboard. New accounts await role assignment by an Admin
                  before a dashboard unlocks.
                </p>

                <c:if test="${not empty sessionScope.message}">
                    <div class="mb-4 p-3 rounded text-sm text-white font-mono" style="background-color: #4a9d6f;">
                        <i data-lucide="check-circle" style="width: 14px; height: 14px; display: inline-block; margin-right: 5px;"></i>
                        ${sessionScope.message}
                    </div>
                    <c:remove var="message" scope="session"/>
                </c:if>
                <c:if test="${not empty requestScope.message}">
                    <div class="mb-4 p-3 rounded text-sm text-white font-mono" style="background-color: #c0392b;">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline-block; margin-right: 5px;"></i>
                        ${requestScope.message}
                    </div>
                </c:if>

                <form action="${pageContext.request.contextPath}/MainController" method="post" class="space-y-4">
                  <input type="hidden" name="action" value="login" />
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

                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Password</label>
                    <div class="relative">
                      <input
                        id="login-password"
                        type="password"
                        name="password"
                        class="w-full bg-input border border-border rounded pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Enter your password"
                        required
                      />
                      <span
                        role="button"
                        onclick="togglePasswordVisibility('login-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none p-1 flex items-center justify-center"
                        style="transform: translateY(-50%); z-index: 10;"
                      >
                        <i data-lucide="eye" class="w-4.5 h-4.5 pointer-events-none"></i>
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-end text-xs">
                    <a href="${pageContext.request.contextPath}/MainController?action=forgotPasswordPage" class="text-primary hover:text-[#dfb830] transition-all duration-300">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-primary text-primary-foreground py-3 rounded font-mono font-medium hover:bg-[#dfb830] hover:text-[#0e0c09] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Sign In
                    <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
                  </button>
                </form>

                <div class="mt-6 pt-6 border-t border-border text-center">
                  <p class="text-xs text-muted-foreground">
                    Don't have an account?
                    <a href="${pageContext.request.contextPath}/MainController?action=registerPage" class="text-primary hover:text-accent hover:brightness-75 transition-all duration-300 font-medium">
                      Register here
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

