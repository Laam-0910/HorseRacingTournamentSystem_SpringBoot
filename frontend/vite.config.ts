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
        console.log('\x1b[32m%s\x1b[0m', '  👉 Mở trình duyệt Điện thoại (Samsung/iPhone) gõ đúng link "Network" ở trên.');
        console.log('\x1b[36m%s\x1b[0m', '  👉 Nếu dùng Mobile Hotspot: Phát Wi-Fi từ ĐT -> Máy tính bắt Wi-Fi -> Nhập link Network.');
        console.log('\x1b[36m%s\x1b[0m', '===============================================================\n');
      }, 100);
    });
  }
});

export default defineConfig({
  plugins: [react(), mobileLivestreamBannerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Mở thấu kính Network IP cho phép Điện thoại kết nối
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
