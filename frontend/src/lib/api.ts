/// <reference types="vite/client" />
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"; // Lấy địa chỉ API gốc từ biến môi trường Vite, nếu không có thì mặc định dùng localhost:8080/api

async function request<T>(path: string, options: RequestInit = {}): Promise<T> { // Hàm bất đồng bộ dùng để gửi các HTTP request tới server
  const token = sessionStorage.getItem("token"); // Lấy token xác thực từ bộ nhớ sessionStorage của trình duyệt
  const headers: Record<string, string> = { "Content-Type": "application/json" }; // Khởi tạo header mặc định với định dạng dữ liệu là JSON
  if (token) { // Kiểm tra xem token có tồn tại hay không
    headers["Authorization"] = `Bearer ${token}`; // Nếu có token, thêm trường Authorization vào header dưới dạng Bearer token
  }

  const mergedHeaders = { ...headers, ...(options.headers as Record<string, string>) }; // Gộp header mặc định vừa tạo với bất kỳ header nào được truyền vào qua tham số options

  const res = await fetch(`${API_BASE_URL}${path}`, { // Thực hiện gọi API (fetch) tới đường dẫn ghép từ BASE_URL và path
    ...options, // Truyền toàn bộ các tham số cấu hình khác từ options (method, body, ...)
    headers: mergedHeaders, // Truyền header đã được gộp vào request
  });

  if (!res.ok) { // Kiểm tra nếu phản hồi trả về lỗi (mã trạng thái HTTP không nằm trong khoảng 200-299)
    const err = await res.json().catch(() => ({})); // Thử parse nội dung lỗi thành JSON, nếu parse thất bại thì trả về một object rỗng
    throw new Error(err.error || `Request failed: ${res.status}`); // Ném ra một ngoại lệ với nội dung lỗi từ server hoặc mã lỗi mặc định
  }

  // Một số API endpoint có thể trả về phần body rỗng (không có dữ liệu)
  const text = await res.text(); // Lấy toàn bộ nội dung phản hồi dưới dạng text (chuỗi văn bản)
  return (text ? JSON.parse(text) : null) as T; // Nếu chuỗi không rỗng thì chuyển đổi thành JSON, ngược lại trả về null, sau đó ép kiểu sang kiểu dữ liệu chung T
}

export const api = { // Xuất một object chứa các phương thức gọi API cơ bản (CRUD)
  get: <T,>(path: string) => request<T>(path), // Phương thức GET: gọi hàm request chỉ với đường dẫn path
  post: <T,>(path: string, body?: unknown) => // Phương thức POST: nhận đường dẫn path và dữ liệu body
    request<T>(path, { // Gọi hàm request kèm theo cấu hình
      method: "POST", // Chỉ định phương thức HTTP là POST
      body: body !== undefined ? JSON.stringify(body) : undefined, // Nếu có truyền body thì chuyển đổi thành chuỗi JSON, ngược lại để là undefined
    }),
  put: <T,>(path: string, body?: unknown) => // Phương thức PUT: dùng để cập nhật dữ liệu
    request<T>(path, { // Gọi hàm request kèm cấu hình PUT
      method: "PUT", // Chỉ định phương thức HTTP là PUT
      body: body !== undefined ? JSON.stringify(body) : undefined, // Chuyển đổi body thành JSON nếu có dữ liệu truyền vào
    }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }), // Phương thức DELETE: dùng để xóa dữ liệu với phương thức HTTP là DELETE
};

