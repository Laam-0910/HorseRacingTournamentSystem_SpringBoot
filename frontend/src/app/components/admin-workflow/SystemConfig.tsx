import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

// Từ điển ánh xạ giải thích chi tiết ý nghĩa của từng khóa cấu hình tham số hệ thống
const CONFIG_DESC_MAP: Record<string, string> = {
  MAX_TOP_WEIGHT: "Maximum top weight (kg)",
  MIN_BOTTOM_WEIGHT: "Minimum bottom weight (kg)",
  WEIGHT_PER_POINT: "Weight adjustment (kg) per 1 rating point difference",
  MAX_OVERWEIGHT_ALLOWED: "Maximum overweight allowed for jockeys (kg)",
  SEX_ALLOWANCE: "Sex weight allowance for female horses (Fillies/Mares) (kg)",
  DEFAULT_JOCKEY_HIRE_FEE: "Default hire fee paid by horse owner to jockey per accepted mount ($100 - $10,000)",
};

/**
 * Component SystemConfig - Phân hệ cấu hình tham số hệ thống dành cho Admin.
 * Cho phép xem và điều chỉnh các hằng số tính toán trọng lượng gánh (carried weight) của ngựa,
 * chênh lệch rating, và dung sai cân nặng cho kỵ sĩ ngay trong cơ sở dữ liệu.
 */
export default function SystemConfig() {
  // State lưu trữ cấu hình thô kéo về từ API
  const [configs, setConfigs] = useState<any[]>([]);
  // State dạng Object lưu cặp key-value tương ứng của form để tiện chỉnh sửa và submit gửi đi
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  // Trạng thái chờ gọi API
  const [loading, setLoading] = useState(false);
  // Banner thông báo lỗi / thành công
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hàm tải cấu hình hệ thống từ API endpoint /admin/configs
  const fetchConfigs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/admin/configs");
      setConfigs(data);
      
      // Chuyển đổi mảng cấu hình thành Object { [configKey]: configValue } để liên kết vào Form
      const values: Record<string, string> = {};
      data.forEach((c) => {
        values[c.configKey] = c.configValue;
      });
      setFormValues(values);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load system configurations."));
    } finally {
      setLoading(false);
    }
  };

  // effect tự động gọi tải cấu hình khi phân hệ được mount vào DOM
  useEffect(() => {
    fetchConfigs();
  }, []);

  // Xử lý cập nhật giá trị đầu vào của từng tham số cấu hình trong formValues state
  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Gửi toàn bộ cấu hình mới lên backend để cập nhật vào cơ sở dữ liệu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn việc reload trang mặc định
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/admin/configs", formValues);
      setSuccess("System configurations updated successfully.");
      fetchConfigs(); // Tải lại cấu hình mới nhất
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to update configurations."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Banner thông báo lỗi nếu có */}
      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Banner thông báo thành công */}
      {success && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "13px" }}>
          ✓ {success}
        </div>
      )}

      {/* Card chứa form cấu hình */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        {/* Header của Card */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("System Configurations", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Update weights and thresholds for ranking and prediction formulas.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Lặp qua danh sách cấu hình kéo về để sinh trường nhập liệu tương ứng */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {configs.map((c) => (
                <div key={c.configKey} className="grid grid-cols-1 md:grid-cols-12 md:items-center" style={{ gap: "0.5rem", padding: "0.75rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "0.5rem" }}>
                  {/* Cột trái: Nhãn cấu hình + Mô tả ý nghĩa tham số */}
                  <div className="md:col-span-5" style={{ display: "flex", alignItems: "start", gap: "0.5rem" }}>
                    <div style={{ marginTop: "0.125rem", padding: "0.25rem", borderRadius: "0.25rem", background: "rgba(201,162,39,0.1)", color: "#c9a227" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold", color: "#c9a227" }}>
                        {c.configKey}
                      </label>
                      <p style={{ fontSize: "9px", marginTop: "0.125rem", color: "rgba(255,255,255,0.4)" }}>
                        {CONFIG_DESC_MAP[c.configKey] || c.description || "System parameter"}
                      </p>
                    </div>
                  </div>
                  {/* Cột phải: Ô input nhập giá trị cấu hình */}
                  <div className="md:col-span-7">
                    <input
                      type="text"
                      required
                      value={formValues[c.configKey] || ""}
                      onChange={(e) => handleChange(c.configKey, e.target.value)}
                      style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "0.75rem", fontFamily: "monospace", outline: "none" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Khối nút lưu cấu hình */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(201,162,39,0.10)", paddingTop: "1rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: "0.5rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, border: "none", background: "#c9a227", color: "#0b0d11", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? $t("Saving Parameters...", (localStorage.getItem('app-lang') || 'vi')) : $t("Save System Configs", (localStorage.getItem('app-lang') || 'vi'))}
              </button>
            </div>
          </form>
        </div>

        {/* Chú ý nhỏ dưới footer card */}
        <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.012)" }}>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>
            ℹ Formula changes take effect immediately on new calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
