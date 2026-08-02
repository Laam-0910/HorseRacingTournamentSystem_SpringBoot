/// <reference types="vite/client" />
// Tự động tính toán API Base URL theo hostname hiện tại (localhost hoặc IP 192.168.x.x của máy tính khi mở trên Điện thoại)
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Nếu trang chạy HTTPS (Mobile / Hotspot), dùng relative path /api để qua Vite Proxy tránh lỗi Mixed Content
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "/api";
  }
  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:8080/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Trích xuất thông báo lỗi sạch từ một Error object bất kỳ.
 * - Ưu tiên lấy message từ response body của backend (field "error" hoặc "message").
 * - Loại bỏ mọi URL localhost/IP khỏi chuỗi thông báo.
 * - Trả về fallback nếu không có thông tin hữu ích.
 */
export function getErrMsg(err: unknown, fallback = "An error occurred. Please try again."): string {
  if (!err) return fallback;

  let raw = "";

  // Ưu tiên lấy message từ Error object
  if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === "string") {
    raw = err;
  } else {
    raw = String(err);
  }

  // Xóa URL localhost và http://... khỏi thông báo
  raw = raw
    .replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^\s,]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Nếu sau khi lọc thông báo trống hoặc chỉ còn status code → dùng fallback
  if (!raw || /^request failed:?\s*\d*$/i.test(raw) || raw.length < 3) {
    return fallback;
  }

  return raw;
}

/**
 * Hàm chung thực hiện các yêu cầu HTTP gửi đến server (fetch API wrapper).
 * - Tự động đính kèm mã JWT Token lấy từ sessionStorage vào Header Authorization (Bearer Token).
 * - Đảm bảo cấu hình mặc định Content-Type là application/json.
 * - Xử lý bắt lỗi phản hồi không thành công (!res.ok) và phân tích lỗi trả về từ API.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("token"); // Lấy mã JWT Token đã lưu từ phiên làm việc
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // Thiết lập tiêu đề xác thực chuẩn JWT
  }

  // Gộp các header mặc định với các header tùy chọn truyền thêm
  const mergedHeaders = { ...headers, ...(options.headers as Record<string, string>) };

  // Thực hiện yêu cầu HTTP
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
  });

  // Nếu máy chủ phản hồi mã lỗi (status khác 2xx)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Lấy message từ body phản hồi backend, fallback về HTTP status
    const msg = body?.error || body?.message || body?.detail
      || `Server returned ${res.status} ${res.statusText || "error"}`;
    throw new Error(msg);
  }

  // Đọc dữ liệu thô từ phản hồi (vì một số endpoint Spring Boot trả về body rỗng)
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Đối tượng API xuất ra chứa các phương thức HTTP thông dụng để sử dụng trong toàn bộ frontend
export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};
