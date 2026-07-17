<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:layout>
    <jsp:attribute name="pageTitle">Register - Horse Race Management</jsp:attribute>
    <jsp:body>
        <div class="relative w-full h-screen overflow-hidden">
          <!-- Full-scene background image -->
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url('${pageContext.request.contextPath}/imports/anhngua1-1.jpg')"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
          </div>

          <!-- Register form centered -->
          <div class="relative z-10 flex items-center justify-center w-full h-full px-4 py-8">
            <div class="w-full max-w-md">
              <!-- Logo -->
              <div class="flex items-center justify-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: #c9a227">
                  <i data-lucide="trophy" style="width: 24px; height: 24px;" class="text-[#0e0c09]"></i>
                </div>
                <div>
                  <h1 class="font-['Roboto_Slab'] font-bold text-2xl text-foreground">HorseRace</h1>
                  <p class="text-muted-foreground text-xs font-mono uppercase tracking-widest">Management System</p>
                </div>
              </div>

              <!-- Register card -->
              <div class="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-8 shadow-2xl">
                <h2 class="font-['Roboto_Slab'] font-bold text-xl text-foreground mb-2">Create Account</h2>
                <p class="text-muted-foreground text-sm mb-6">Join the racing season system</p>

                <form action="${pageContext.request.contextPath}/MainController" method="post" class="space-y-4">
                  <input type="hidden" name="action" value="register" />
                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      class="w-full bg-input border border-border rounded px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Nguyen Van A"
                      required
                    />
                  </div>

                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      class="w-full bg-input border border-border rounded px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Password</label>
                    <div class="relative">
                      <input
                        id="register-password"
                        type="password"
                        name="password"
                        class="w-full bg-input border border-border rounded pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Create a password"
                        required
                      />
                      <span
                        role="button"
                        onclick="togglePasswordVisibility('register-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none p-1 flex items-center justify-center"
                        style="transform: translateY(-50%); z-index: 10;"
                      >
                        <i data-lucide="eye" class="w-4.5 h-4.5 pointer-events-none"></i>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label class="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-2">Confirm Password</label>
                    <div class="relative">
                      <input
                        id="register-confirm-password"
                        type="password"
                        name="confirmPassword"
                        class="w-full bg-input border border-border rounded pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="Confirm your password"
                        required
                      />
                      <span
                        role="button"
                        onclick="togglePasswordVisibility('register-confirm-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none p-1 flex items-center justify-center"
                        style="transform: translateY(-50%); z-index: 10;"
                      >
                        <i data-lucide="eye" class="w-4.5 h-4.5 pointer-events-none"></i>
                      </span>
                    </div>
                  </div>



                  <button
                    type="submit"
                    class="w-full bg-primary text-primary-foreground py-3 rounded font-mono font-medium hover:bg-[#dfb830] hover:text-[#0e0c09] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Create Account
                    <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
                  </button>
                </form>

                <div class="mt-6 pt-6 border-t border-border text-center">
                  <p class="text-xs text-muted-foreground">
                    Already have an account?
                    <a href="${pageContext.request.contextPath}/MainController?action=loginPage" class="text-primary hover:text-[#dfb830] transition-all duration-300 font-medium">
                      Sign in here
                    </a>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <p class="text-center text-xs text-muted-foreground mt-6">
                HorseRace Management System
              </p>
            </div>
          </div>
        </div>
    </jsp:body>
</t:layout>

