<%@ tag language="java" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ attribute name="pageTitle" required="false" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><c:out value="${pageTitle}" default="Horse Racing Season Management" /></title>
    
    <!-- Google Fonts for English, Vietnamese, Chinese, Japanese -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Sans+JP:wght@300;400;500;700&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Tailwind Config to match existing theme -->
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              background: 'var(--background)',
              foreground: 'var(--foreground)',
              primary: {
                DEFAULT: 'var(--primary)',
                foreground: 'var(--primary-foreground)',
              },
              card: {
                DEFAULT: 'var(--card)',
                foreground: 'var(--card-foreground)',
              },
              popover: {
                DEFAULT: 'var(--popover)',
                foreground: 'var(--popover-foreground)',
              },
              secondary: {
                DEFAULT: 'var(--secondary)',
                foreground: 'var(--secondary-foreground)',
              },
              muted: {
                DEFAULT: 'var(--muted)',
                foreground: 'var(--muted-foreground)',
              },
              accent: {
                DEFAULT: 'var(--accent)',
                foreground: 'var(--accent-foreground)',
              },
              destructive: {
                DEFAULT: 'var(--destructive)',
                foreground: 'var(--destructive-foreground)',
              },
              border: 'var(--border)',
              input: 'var(--input)',
              ring: 'var(--ring)',
            },
            borderRadius: {
              lg: 'var(--radius)',
              md: 'calc(var(--radius) - 2px)',
              sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
              sans: ['Outfit', 'Noto Sans SC', 'Noto Sans JP', 'sans-serif'],
              serif: ['Roboto Slab', 'serif'],
              mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace']
            }
          }
        }
      }
    </script>
    
    <!-- Custom Styles -->
    <style>
      body {
        font-family: 'Outfit', 'Noto Sans SC', 'Noto Sans JP', sans-serif !important;
      }
      .font-serif {
        font-family: 'Roboto Slab', serif !important;
      }
      :root {
        --background: #0e0c09;
        --foreground: #f0f0f0;
        --primary: #c9a227;
        --primary-foreground: #0e0c09;
        --card: #151310;
        --card-foreground: #f0f0f0;
        --popover: #151310;
        --popover-foreground: #f0f0f0;
        --secondary: #1a1815;
        --secondary-foreground: #f0f0f0;
        --muted: #2a2825;
        --muted-foreground: #a0a0a0;
        --accent: #2a2825;
        --accent-foreground: #f0f0f0;
        --destructive: #c0392b;
        --destructive-foreground: #f0f0f0;
        --border: #2a2825;
        --input: #151310;
        --ring: #c9a227;
        --radius: 0.5rem;
      }

      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      @keyframes pulse-red {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
        }
      }
      .animate-pulse-red {
        animation: pulse-red 2s infinite;
      }

      /* Global high-visibility premium inputs styling */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="date"],
      input[type="datetime-local"],
      select,
      textarea {
        background: linear-gradient(120deg, #1a1815 30%, #25221b 50%, #1a1815 70%) !important;
        background-size: 200% 100% !important;
        background-position: 0% 0% !important;
        border: 1.5px solid rgba(201, 162, 39, 0.35) !important;
        color: #f4f2ec !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        transition: border-color 0.3s ease, box-shadow 0.3s ease, background-position 0.5s ease, transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      input[type="text"]::placeholder,
      input[type="email"]::placeholder,
      input[type="password"]::placeholder,
      input[type="number"]::placeholder,
      textarea::placeholder {
        color: rgba(244, 242, 236, 0.4) !important;
      }
      input[type="text"]:hover,
      input[type="email"]:hover,
      input[type="password"]:hover,
      input[type="number"]:hover,
      input[type="date"]:hover,
      input[type="datetime-local"]:hover,
      select:hover,
      textarea:hover {
        background-position: 100% 0% !important;
        border-color: rgba(201, 162, 39, 0.6) !important;
        transform: translateY(-1.5px) scale(1.008) !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(201, 162, 39, 0.15) !important;
      }
      input[type="text"]:focus,
      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="number"]:focus,
      input[type="date"]:focus,
      input[type="datetime-local"]:focus,
      select:focus,
      textarea:focus {
        background-position: 100% 0% !important;
        border-color: #c9a227 !important;
        transform: translateY(-2px) translateX(2px) scale(1.012) !important;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(201, 162, 39, 0.3) !important;
        outline: none !important;
      }
      input[type="text"]:active,
      input[type="email"]:active,
      input[type="password"]:active,
      input[type="number"]:active,
      input[type="date"]:active,
      input[type="datetime-local"]:active,
      select:active,
      textarea:active {
        transform: scale(0.985) translateY(0px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
      }

      /* Specific Select and Option overrides to prevent white-on-white text errors in Chrome/Edge */
      select {
        background: #1a1815 !important;
        color: #f4f2ec !important;
        color-scheme: dark !important;
      }
      select option {
        background-color: #151310 !important;
        color: #f4f2ec !important;
        color-scheme: dark !important;
      }

      /* Prevent browser autocomplete/autofill from overriding input styles (colors and backgrounds) */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #1a1815 inset !important;
        -webkit-text-fill-color: #f4f2ec !important;
        border: 1.5px solid rgba(201, 162, 39, 0.35) !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }

      /* Document Click Ripple Style */
      .click-ripple {
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        pointer-events: none;
        transform: translate3d(-50%, -50%, 0) scale(1);
        animation: ripple-effect 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        z-index: 99999;
        border-style: solid;
        border-width: 2px;
        will-change: transform, opacity;
      }
      
      @keyframes ripple-effect {
        0% {
          width: 0px;
          height: 0px;
          opacity: 1;
        }
        100% {
          width: 180px;
          height: 180px;
          opacity: 0;
          border-width: 0.5px;
        }
      }

      /* Document Click Spark Style */
      .click-spark {
        position: fixed;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        animation: spark-fall 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        will-change: transform, opacity;
      }
      
      @keyframes spark-fall {
        0% {
          transform: translate3d(-50%, -50%, 0) translate3d(0, 0, 0) scale(1.2);
          box-shadow: 0 0 10px currentColor, 0 0 5px currentColor;
          opacity: 1;
        }
        100% {
          transform: translate3d(-50%, -50%, 0) translate3d(var(--dx), var(--dy), 0) scale(0);
          box-shadow: 0 0 0px transparent;
          opacity: 0;
        }
      }

      /* Card click feedback compression */
      .rounded-xl.border:active,
      .rounded-xl[style*="border"]:active {
        transform: scale(0.96) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4) !important;
        transition: transform 0.08s ease !important;
      }

      /* Premium Interactive Button styling */
      button, 
      .btn,
      input[type="submit"],
      a.bg-primary,
      a.bg-secondary,
      a.border,
      a.border-primary,
      a.px-3 {
        position: relative;
        overflow: hidden;
        transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, filter 0.25s ease !important;
      }
      
      /* Shimmer Shine Sweep effect */
      button::after,
      .btn::after,
      input[type="submit"]::after,
      a.bg-primary::after,
      a.bg-secondary::after,
      a.border::after,
      a.border-primary::after {
        content: '';
        position: absolute;
        top: 0;
        left: -150%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.25) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: skewX(-25deg);
        transition: left 0.75s ease;
        pointer-events: none;
        z-index: 1;
      }
      
      button:hover::after,
      .btn:hover::after,
      input[type="submit"]:hover::after,
      a.bg-primary:hover::after,
      a.bg-secondary:hover::after,
      a.border:hover::after,
      a.border-primary:hover::after {
        left: 150%;
      }
      
      button:hover,
      .btn:hover,
      input[type="submit"]:hover,
      a.bg-primary:hover,
      a.bg-secondary:hover,
      a.border:hover,
      a.border-primary:hover {
        transform: translateY(-3.5px) scale(1.02) !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.55), 0 0 25px rgba(201, 162, 39, 0.45) !important;
        filter: brightness(1.1) !important;
      }
      
      button:active,
      .btn:active,
      input[type="submit"]:active,
      a.bg-primary:active,
      a.bg-secondary:active,
      a.border:active,
      a.border-primary:active {
        transform: scale(0.95) translateY(0px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.08s ease !important; /* Snappy click down transition */
      }

      /* Internal button click ripple style */
      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        transform: translate3d(-50%, -50%, 0) scale(0);
        animation: btn-ripple-expand 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        pointer-events: none;
        z-index: 2;
        will-change: transform, opacity;
      }
      
      @keyframes btn-ripple-expand {
        to {
          transform: translate3d(-50%, -50%, 0) scale(2.5);
          opacity: 0;
        }
      }

      /* High visibility invalid fields on user typing */
      input:invalid:not(:placeholder-shown) {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
      }
    </style>
<body class="min-h-screen bg-background text-foreground font-sans antialiased">
    <!-- Global Loading Overlay -->
    <div id="global-loading" class="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
      <div class="relative flex flex-col items-center p-8 rounded-2xl bg-[#151310] border border-[#c9a227]/30 shadow-2xl max-w-sm w-full mx-4 text-center">
        <!-- Golden Spinner -->
        <div class="relative w-16 h-16 mb-6">
          <div class="absolute inset-0 rounded-full border-4 border-[#c9a227]/10"></div>
          <div class="absolute inset-0 rounded-full border-4 border-t-[#c9a227] animate-spin"></div>
          <!-- Centered Icon -->
          <div class="absolute inset-0 flex items-center justify-center text-[#c9a227]">
            <i data-lucide="loader" class="w-6 h-6" id="loading-icon"></i>
          </div>
        </div>
        
        <h3 class="font-serif font-bold text-lg text-white mb-2" id="loading-title">Processing</h3>
        <p class="text-xs text-white/60 font-sans" id="loading-desc">Please wait a moment while we process your request...</p>
      </div>
    </div>
    
    <div id="root" class="relative flex min-h-screen flex-col">
        <main class="flex-1">
            <jsp:doBody />
        </main>
    </div>

    <!-- Global Toast Notification Setup -->
    <c:set var="alertMessage" value="" />
    <c:if test="${not empty requestScope.message}">
        <c:set var="alertMessage" value="${requestScope.message}" />
    </c:if>
    <c:if test="${empty alertMessage and not empty sessionScope.message}">
        <c:set var="alertMessage" value="${sessionScope.message}" />
        <c:remove var="message" scope="session" />
    </c:if>
    <c:if test="${empty alertMessage and not empty param.message}">
        <c:set var="alertMessage" value="${param.message}" />
    </c:if>

    <c:if test="${not empty alertMessage}">
        <div id="global-toast" class="fixed top-5 right-5 z-[99999] flex items-center gap-3 bg-[#151310] border border-[#c9a227] rounded-lg px-4 py-3.5 shadow-2xl transition-all duration-500 ease-out translate-x-[120%] opacity-0">
            <div id="toast-icon-container" class="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
            <div class="text-left">
                <p id="toast-title" class="font-mono text-[9px] uppercase tracking-widest text-white/40">Notification</p>
                <p id="toast-text" class="text-xs text-[#f4f2ec] font-sans font-medium pr-6"><c:out value="${alertMessage}" /></p>
            </div>
            <button onclick="dismissToast()" class="absolute top-2 right-2 text-white/30 hover:text-white transition-colors">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const toast = document.getElementById('global-toast');
                const toastText = document.getElementById('toast-text').innerText;
                const iconContainer = document.getElementById('toast-icon-container');
                
                const isSuccess = toastText.toLowerCase().includes('success') || 
                                  toastText.toLowerCase().includes('thành công') || 
                                  toastText.toLowerCase().includes('verified') ||
                                  toastText.toLowerCase().includes('approved');
                                  
                if (isSuccess) {
                    iconContainer.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500';
                    iconContainer.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
                    toast.style.borderColor = '#10b981';
                } else {
                    iconContainer.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500';
                    iconContainer.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4"></i>';
                    toast.style.borderColor = '#ef4444';
                }
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                setTimeout(() => {
                    toast.classList.remove('translate-x-[120%]', 'opacity-0');
                }, 100);
                
                setTimeout(() => {
                    dismissToast();
                }, 5000);
            });

            function dismissToast() {
                const toast = document.getElementById('global-toast');
                if (toast) {
                    toast.classList.add('translate-x-[120%]', 'opacity-0');
                    setTimeout(() => {
                        toast.remove();
                    }, 500);
                }
            }
        </script>
    </c:if>

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
      lucide.createIcons();

      // Document Click Ripple and Spark Animation
      document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Skip form elements, buttons, links, and items inside them to prevent interaction lag
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' ||
            target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
          return; 
        }
        
        // Neon color palette for random selection on click
        const neonColors = [
          '#c9a227', // Gold
          '#00f0ff', // Neon Cyan
          '#ff007f', // Neon Pink
          '#a855f7', // Neon Purple
          '#22c55e', // Neon Green
          '#f97316', // Neon Orange
          '#ffffff'  // White
        ];
        
        // Pick random color for ripple border and glow
        const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        // Spawn ripple on empty whitespace click
        const ripple = document.createElement('span');
        ripple.className = 'click-ripple';
        ripple.style.borderColor = randomColor;
        ripple.style.background = `radial-gradient(circle, ${randomColor}55 0%, ${randomColor}00 70%)`;
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);
        setTimeout(() => {
          ripple.remove();
        }, 700);

        // Spawn 12 multi-colored burst sparks
        const numSparks = 12;
        for (let i = 0; i < numSparks; i++) {
          const spark = document.createElement('span');
          spark.className = 'click-spark';
          const sparkColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          spark.style.backgroundColor = sparkColor;
          spark.style.color = sparkColor;
          spark.style.left = e.clientX + 'px';
          spark.style.top = e.clientY + 'px';
          
          const angle = Math.random() * Math.PI * 2;
          const distance = 35 + Math.random() * 65;
          const dx = Math.cos(angle) * distance;
          const dy = Math.sin(angle) * distance + 20;
          
          spark.style.setProperty('--dx', dx + 'px');
          spark.style.setProperty('--dy', dy + 'px');
          
          document.body.appendChild(spark);
          setTimeout(() => {
            spark.remove();
          }, 600);
        }
      });

      // Global Show/Hide Password Toggle Function
      function togglePasswordVisibility(inputId, toggleEl) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        // update eye icon
        const icon = toggleEl.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      }

      // Intercept authentication form submissions to show loading animations
      document.addEventListener('submit', function(e) {
        const form = e.target;
        const actionInput = form.querySelector('input[name="action"]');
        if (!actionInput) return;
        
        const action = actionInput.value;
        let title = "Processing";
        let desc = "Please wait a moment while we process your request...";
        let iconName = "loader";
        
        if (action === "register") {
          title = "Creating Account";
          desc = "We are setting up your account and sending a verification code to your email. Please do not close this page.";
          iconName = "user-plus";
        } else if (action === "forgotPassword") {
          title = "Sending Verification Code";
          desc = "We are generating your reset code and sending it to your email. Please check your inbox shortly.";
          iconName = "mail";
        } else if (action === "verifyLogin" || action === "verifyRegister" || action === "verifyForgotPassword") {
          title = "Verifying Code";
          desc = "Verifying your security credentials, please hold on...";
          iconName = "shield-check";
        } else if (action === "login") {
          title = "Signing In";
          desc = "Verifying credentials and logging you in...";
          iconName = "key";
        } else {
          return; // Do not show loading overlay on non-auth submissions
        }
        
        const overlay = document.getElementById('global-loading');
        const titleEl = document.getElementById('loading-title');
        const descEl = document.getElementById('loading-desc');
        const iconEl = document.getElementById('loading-icon');
        
        if (overlay && titleEl && descEl && iconEl) {
          titleEl.innerText = title;
          descEl.innerText = desc;
          iconEl.setAttribute('data-lucide', iconName);
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
          overlay.classList.remove('opacity-0', 'pointer-events-none');
        }
      });

      // Snappy and smooth internal button click ripple effect
      document.addEventListener('mousedown', function(e) {
        const btn = e.target.closest('button, .btn, input[type="submit"], a.bg-primary, a.bg-secondary, a.border, a.border-primary, a.px-3');
        if (!btn) return;
        
        // Remove any existing ripples first
        const oldRipples = btn.querySelectorAll('.btn-ripple');
        oldRipples.forEach(r => r.remove());

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.width = ripple.style.height = (size * 2) + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        btn.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 550);
      });
    </script>
</body>
</html>
