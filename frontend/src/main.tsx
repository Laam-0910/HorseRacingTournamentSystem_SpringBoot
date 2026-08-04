import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import "@/lib/confirm";

// with a clean, custom English floating tooltip on all platforms.
if (typeof window !== "undefined") {
  let currentValidationTooltip: HTMLDivElement | null = null;

  const removeValidationTooltip = () => {
    if (currentValidationTooltip) {
      currentValidationTooltip.remove();
      currentValidationTooltip = null;
    }
  };

  document.addEventListener(
    "invalid",
    (e: Event) => {
      e.preventDefault();

      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!target) return;

      let msg = "Please enter a valid value.";

      if (target.validity.valueMissing) {
        msg = "Please fill out this field.";
      } else if (target.validity.typeMismatch) {
        if (target.type === "email") {
          msg = "Please enter a valid email address.";
        } else if (target.type === "url") {
          msg = "Please enter a valid URL.";
        } else {
          msg = "Please enter a valid value.";
        }
      } else if (target.validity.patternMismatch) {
        msg = "Please match the requested format.";
      } else if (target.validity.tooShort) {
        const minLen = (target as HTMLInputElement).minLength || 1;
        msg = `Please enter at least ${minLen} characters.`;
      } else if (target.validity.tooLong) {
        const maxLen = (target as HTMLInputElement).maxLength || 255;
        msg = `Please enter no more than ${maxLen} characters.`;
      } else if (target.validity.rangeUnderflow) {
        const minVal = (target as HTMLInputElement).min || 0;
        msg = `Value must be greater than or equal to ${minVal}.`;
      } else if (target.validity.rangeOverflow) {
        const maxVal = (target as HTMLInputElement).max || 100;
        msg = `Value must be less than or equal to ${maxVal}.`;
      } else if (target.validity.stepMismatch) {
        msg = "Please enter a valid value.";
      } else if (target.validity.badInput) {
        msg = "Please enter a valid number.";
      }

      // Focus invalid input
      try { target.focus(); } catch (_) {}

      // Remove existing tooltip
      removeValidationTooltip();

      // Create custom English tooltip element
      const rect = target.getBoundingClientRect();
      const tooltip = document.createElement("div");
      tooltip.className = "custom-validation-tooltip";
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = "999999";
      tooltip.style.left = `${Math.max(10, rect.left)}px`;
      tooltip.style.top = `${Math.max(10, rect.top - 42)}px`;
      tooltip.style.background = "#1e1e1e";
      tooltip.style.color = "#ffffff";
      tooltip.style.border = "1px solid #ef4444";
      tooltip.style.borderRadius = "8px";
      tooltip.style.padding = "6px 12px";
      tooltip.style.fontSize = "12px";
      tooltip.style.fontFamily = "system-ui, -apple-system, sans-serif";
      tooltip.style.fontWeight = "500";
      tooltip.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 10px rgba(239, 68, 68, 0.3)";
      tooltip.style.display = "flex";
      tooltip.style.alignItems = "center";
      tooltip.style.gap = "6px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.animation = "customTooltipFadeIn 0.2s ease-out forwards";

      tooltip.innerHTML = `
        <span style="color: #ef4444; font-weight: bold; font-size: 14px;">⚠️</span>
        <span>${msg}</span>
        <div style="position: absolute; bottom: -6px; left: 16px; width: 10px; height: 10px; background: #1e1e1e; border-right: 1px solid #ef4444; border-bottom: 1px solid #ef4444; transform: rotate(45deg);"></div>
      `;

      document.body.appendChild(tooltip);
      currentValidationTooltip = tooltip;

      // Automatically hide after 4 seconds
      setTimeout(() => {
        if (currentValidationTooltip === tooltip) {
          removeValidationTooltip();
        }
      }, 4000);
    },
    true
  );

  document.addEventListener("input", removeValidationTooltip, true);
  document.addEventListener("change", removeValidationTooltip, true);
  document.addEventListener("scroll", removeValidationTooltip, true);

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      !target ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    const neonColors = [
      "#c9a227",
      "#00f0ff",
      "#ff007f",
      "#a855f7",
      "#22c55e",
      "#f97316",
      "#ffffff",
    ];

    const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];

    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.borderColor = randomColor;
    ripple.style.background = `radial-gradient(circle, ${randomColor}55 0%, ${randomColor}00 70%)`;
    ripple.style.left = e.clientX + "px";
    ripple.style.top = e.clientY + "px";
    document.body.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 700);

    const numSparks = 12;
    for (let i = 0; i < numSparks; i++) {
      const spark = document.createElement("span");
      spark.className = "click-spark";
      const sparkColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      spark.style.backgroundColor = sparkColor;
      spark.style.color = sparkColor;
      spark.style.left = e.clientX + "px";
      spark.style.top = e.clientY + "px";

      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * 65;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance + 20;

      spark.style.setProperty("--dx", dx + "px");
      spark.style.setProperty("--dy", dy + "px");

      document.body.appendChild(spark);
      setTimeout(() => {
        spark.remove();
      }, 600);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
