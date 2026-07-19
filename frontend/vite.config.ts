import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function swaggerLinkPlugin() {
  return {
    name: "swagger-link-plugin",
    configureServer(server: any) {
      server.httpServer?.once("listening", () => {
        setTimeout(() => {
          console.log("  \x1b[36m➜\x1b[0m  \x1b[1mSwagger UI:\x1b[0m \x1b[36mhttp://localhost:8080/swagger-ui/index.html\x1b[0m");
        }, 100);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), swaggerLinkPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});

