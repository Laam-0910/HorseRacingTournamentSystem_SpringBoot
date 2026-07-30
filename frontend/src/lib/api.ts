/// <reference types="vite/client" />
// Xác định URL cơ sở (Base URL) của API Spring Boot từ cấu hình biến môi trường Vite hoặc mặc định là http://localhost:8080/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
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
