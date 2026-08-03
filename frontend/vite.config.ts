import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const mobileLivestreamBannerPlugin = () => ({
  name: 'mobile-livestream-banner',
  configureServer(server: any) {
    server.httpServer?.once('listening', () => {
      setTimeout(() => {
        console.log('\x1b[36m%s\x1b[0m', '\n===============================================================');
        console.log('\x1b[33m%s\x1b[0m', '📱 HƯỚNG DẪN PHÁT LIVESTREAM ĐIỆN THOẠI (CHUNG MẠNG WI-FI / HOTSPOT):');
        console.log('\x1b[32m%s\x1b[0m', '  👉 Mở trình duyệt Điện thoại (Samsung/iPhone) gõ link HTTPS bên dưới.');
        console.log('\x1b[36m%s\x1b[0m', '===============================================================\n');
      }, 100);
    });
  }
});

export default defineConfig(async () => {
  const plugins: any[] = [react(), mobileLivestreamBannerPlugin()];
  try {
    const basicSsl = (await import("@vitejs/plugin-basic-ssl")).default;
    plugins.push(basicSsl());
  } catch {
    // SSL plugin optional fallback
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true, // Mở thấu kính Network IP cho phép Điện thoại kết nối
      port: 5173,
      strictPort: false,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
        "/ws": {
          target: "ws://localhost:8080",
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
