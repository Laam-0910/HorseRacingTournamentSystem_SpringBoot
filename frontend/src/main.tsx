import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

// Global Document Click Ripple and Spark Animation
if (typeof window !== "undefined") {
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
      "#c9a227", // Gold
      "#00f0ff", // Neon Cyan
      "#ff007f", // Neon Pink
      "#a855f7", // Neon Purple
      "#22c55e", // Neon Green
      "#f97316", // Neon Orange
      "#ffffff", // White
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
