import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import os from 'os';

// Lấy địa chỉ IP thật của máy trên mạng WiFi / LAN (bỏ qua loopback và card ảo)
function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    // Bỏ qua card ảo VMware, VirtualBox, Loopback, Hotspot
    if (lowerName.includes('vmware') || lowerName.includes('virtualbox') ||
        lowerName.includes('vethernet') || lowerName.includes('loopback')) continue;
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Ưu tiên dải 10.x hoặc 192.168.x (trừ .137 và .217 là card ảo Windows)
        const ip = iface.address;
        if (ip.startsWith('10.') ||
           (ip.startsWith('192.168.') && !ip.startsWith('192.168.137.') && !ip.startsWith('192.168.217.'))) {
          return ip;
        }
      }
    }
  }
  return 'Không tìm thấy IP';
}

const mobileLivestreamBannerPlugin = () => ({
  name: 'mobile-livestream-banner',
  configureServer(server: any) {
    server.httpServer?.once('listening', () => {
      setTimeout(() => {
        const lanIp = getLanIp();
        console.log('\x1b[36m%s\x1b[0m', '\n================================================================');
        console.log('\x1b[33m%s\x1b[0m', '🚀 HORSE RACING FRONTEND - ĐANG CHẠY (npm run dev)');
        console.log('\x1b[36m%s\x1b[0m', '================================================================');
        console.log('\x1b[32m%s\x1b[0m', '  📌 GIẢI THÍCH CÁC ĐỊA CHỈ VITE HIỂN THỊ:');
        console.log('');
        console.log('\x1b[32m%s\x1b[0m', `  ✅ Local:   https://localhost:5173/`);
        console.log('\x1b[37m%s\x1b[0m', '     → Truy cập trên chính máy tính đang chạy dự án.');
        console.log('');
        console.log('\x1b[33m%s\x1b[0m', `  📡 Network: https://${lanIp}:5173/  ← IP WiFi / LAN thực của máy`);
        console.log('\x1b[37m%s\x1b[0m', '     → Dùng địa chỉ này để mở trên điện thoại hoặc máy tính khác cùng mạng WiFi.');
        console.log('');
        console.log('\x1b[90m%s\x1b[0m', '  ⚠️  Các địa chỉ Network còn lại (192.168.137.x, 192.168.217.x):');
        console.log('\x1b[90m%s\x1b[0m', '     → Card mạng ảo (VMware / VirtualBox / Windows Hotspot) — bỏ qua.');
        console.log('');
        console.log('\x1b[36m%s\x1b[0m', '================================================================');
        console.log('\x1b[33m%s\x1b[0m', '📱 PHÁT LIVESTREAM TỪ ĐIỆN THOẠI (CHUNG MẠNG WI-FI / HOTSPOT):');
        console.log('\x1b[32m%s\x1b[0m', '  👉 Mở trình duyệt điện thoại (Chrome/Safari) và truy cập địa chỉ Network ở trên.');
        console.log('\x1b[32m%s\x1b[0m', '  👉 Nếu hiện cảnh báo "không an toàn", chọn "Tiếp tục" (do chứng chỉ SSL tự ký).');
        console.log('\x1b[36m%s\x1b[0m', '================================================================\n');
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
