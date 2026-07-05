import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

# ── HỆ THỐNG KỸ THUẬT FAQ BẰNG VECTOR & PCA ────────────────────────────────────
# Định nghĩa bộ câu hỏi - câu trả lời FAQ mẫu về HKJC và giải đấu
FAQ_DATA = [
    {
        "questions": [
            "luật phân hạng đấu là gì", "quy định phân nhóm ngựa", "hạng đua class 1 2 3 4 5",
            "how are horses classified", "what are race classes", "rules for race classes"
        ],
        "answer": (
            "📌 **Quy định phân hạng trong Hệ thống:**\n"
            "Các trận đấu được phân hạng dựa trên điểm Rating của ngựa:\n"
            "• **Class 1:** Rating >= 95 (Hạng cao nhất)\n"
            "• **Class 2:** Rating 80-95\n"
            "• **Class 3:** Rating 60-80\n"
            "• **Class 4:** Rating 40-60\n"
            "• **Class 5:** Rating < 40\n"
            "Ngựa sẽ được xếp vào các trận đấu có Class tương ứng với Rating của mình."
        )
    },
    {
        "questions": [
            "quy định cân nặng tạ gánh", "tính tạ gánh như thế nào", "carried weight handicap weight",
            "weight rules", "how is handicap weight calculated"
        ],
        "answer": (
            "⚖️ **Quy định Cân nặng & Tạ gánh (Handicap Weight):**\n"
            "• Mỗi trận đấu có mức tạ gánh cơ bản (Handicap Weight) dựa trên điểm Rating.\n"
            "• Cân nặng thực tế mang theo (Carried Weight) = Cân nặng của Nài ngựa + Miếng chì gánh thêm.\n"
            "• Trọng tài sẽ kiểm tra cân nặng trước khi đua (Weigh-out) và sau khi đua (Weigh-in) để đảm bảo tính công bằng. Sai lệch quá 0.5kg sẽ bị phạt."
        )
    },
    {
        "questions": [
            "trọng tài làm nhiệm vụ gì", "vai trò của trọng tài", "referee duties",
            "what does the referee do", "referee role"
        ],
        "answer": (
            "🏁 **Nhiệm vụ của Trọng tài (Referee):**\n"
            "1. **Pre-race check:** Xác nhận tình trạng sức khỏe ngựa, cân weigh-out của nài và gán cổng xuất phát.\n"
            "2. **Start race:** Kích hoạt bắt đầu cuộc đua bằng nút Start thủ công.\n"
            "3. **Monitor:** Theo dõi trực tiếp cuộc đua và ghi nhận các lỗi vi phạm (Violations).\n"
            "4. **Weigh-in & Verify:** Cân lại nài ngựa sau trận và xác nhận kết quả chính thức (Official)."
        )
    },
    {
        "questions": [
            "stewards inquiry là gì", "quy trình điều tra trọng tài", "khi nào điều tra",
            "what is stewards inquiry", "referee violation review"
        ],
        "answer": (
            "🚨 **Trạng thái Stewards Inquiry (Trọng tài điều tra):**\n"
            "• Khi có bất kỳ vi phạm nào (Violation) được trọng tài ghi nhận trong lúc đua, cuộc đua sẽ tự động chuyển sang trạng thái **STEWARDS_INQUIRY**.\n"
            "• Trọng tài phải xác nhận (Confirm) hoặc bác bỏ (Dismiss) tất cả vi phạm này trước khi có thể kết thúc hội đua để đưa kết quả về trạng thái chính thức (Official)."
        )
    },
    {
        "questions": [
            "lịch trình giải đấu tổ chức như thế nào", "hội đua là gì", "season race meeting race",
            "tournament structure", "season scheduling"
        ],
        "answer": (
            "📅 **Cấu trúc Giải đấu:**\n"
            "Giải đấu được tổ chức theo cấu trúc hình cây:\n"
            "• **Mùa giải (Season):** Kéo dài từ tháng 9 năm trước đến tháng 6 năm sau.\n"
            "• **Hội đua (Race Meeting):** Tổ chức tại các địa điểm cụ thể gồm nhiều trận đua trong ngày.\n"
            "• **Trận đua (Race):** Mỗi trận đấu phân lớp cụ thể (Class 1-5, khoảng cách, loại sân cỏ/cát)."
        )
    },
    {
        "questions": [
            "dự đoán ai hoạt động như thế nào", "thuật toán dự đoán kết quả", "ai predictor logic",
            "how does AI predict", "prediction model algorithm"
        ],
        "answer": (
            "🔮 **Mô hình Dự đoán kết quả AI (AI Predictor):**\n"
            "• Hệ thống sử dụng thuật toán máy học (Machine Learning) Gradient Boosting Classifier kết hợp toán vector.\n"
            "• Các thuộc tính đầu vào bao gồm: Xếp hạng rating của ngựa, tỷ lệ thắng lịch sử, tỷ lệ lọt Top 3 của nài ngựa, cổng xuất phát, và tạ gánh nặng.\n"
            "• AI sẽ tính toán và phân phối xác suất về đích trong Top 3 cho từng cổng chạy."
        )
    },
    {
        "questions": [
            "quy trình mời nài ngựa", "chủ ngựa mời nài ngựa", "đăng ký race entry",
            "jockey invitation rules", "jockey registration"
        ],
        "answer": (
            "✉️ **Quy định mời Nài ngựa (Jockey Invitation):**\n"
            "• Chủ ngựa (Owner) đăng ký ngựa vào trận đấu và gửi lời mời đến Nài ngựa mong muốn.\n"
            "• Một nài ngựa chỉ được chấp nhận **01 ngựa duy nhất** trong cùng một trận đua.\n"
            "• Khi nài ngựa đồng ý, tất cả lời mời khác dành cho nài ngựa đó trong trận này sẽ tự động bị bác bỏ (Rejected), và ngựa đó cũng không thể mời nài khác."
        )
    }
]

# Chuyển đổi dữ liệu FAQ thành DataFrame để xử lý bằng pandas/numpy
df_faq_list = []
for idx, item in enumerate(FAQ_DATA):
    for q in item["questions"]:
        df_faq_list.append({"faq_id": idx, "question": q, "answer": item["answer"]})

df_faq = pd.DataFrame(df_faq_list)

# ── XỬ LÝ VECTOR VỚI TF-IDF VÀ PCA ───────────────────────────────────────────
# Khởi tạo vectorizer
vectorizer = TfidfVectorizer(lowercase=True)
tfidf_matrix = vectorizer.fit_transform(df_faq["question"]).toarray()

# Áp dụng PCA để giảm chiều dữ liệu (Trích xuất các đặc trưng ngữ nghĩa chính)
# Sử dụng số chiều nhỏ (ví dụ n_components=5) để chiếu thông tin
n_components = min(5, tfidf_matrix.shape[1])
pca = PCA(n_components=n_components)
pca_matrix = pca.fit_transform(tfidf_matrix)

# Chuẩn hóa vector PCA để tính cosine similarity bằng dot product nhanh hơn
norms = np.linalg.norm(pca_matrix, axis=1, keepdims=True)
# Tránh chia cho 0
norms[norms == 0] = 1.0
normalized_pca_matrix = pca_matrix / norms

def find_semantic_answer(user_query: str, threshold: float = 0.80) -> str:
    """
    Sử dụng toán vector tích vô hướng (Dot Product) và PCA để tìm câu trả lời FAQ phù hợp.
    Threshold cao (0.80) để tránh khớp sai các câu ngắn, tán gẫu không liên quan.
    """
    if not user_query.strip():
        return None
    
    # Lọc các câu quá ngắn (dưới 3 từ) ra khỏi hệ thống FAQ để tránh khớp sai
    words = user_query.strip().split()
    if len(words) < 3:
        return None

    # 1. Chuyển đổi câu hỏi của user thành vector TF-IDF
    user_tfidf = vectorizer.transform([user_query]).toarray()
    if np.sum(user_tfidf) == 0:
        return None
    
    # 2. Chiếu vector qua không gian PCA đã huấn luyện
    user_pca = pca.transform(user_tfidf)
    
    # 3. Chuẩn hóa vector PCA của user
    user_norm = np.linalg.norm(user_pca)
    if user_norm == 0:
        return None
    user_pca_normalized = user_pca / user_norm

    # 4. Tính toán Tích vô hướng (Dot Product) giữa vector user và tất cả FAQ vectors
    # Vì cả 2 đã được chuẩn hóa (norm=1), dot product chính là Cosine Similarity
    similarities = np.dot(normalized_pca_matrix, user_pca_normalized.T).flatten()

    # 5. Tìm chỉ số có độ tương đồng lớn nhất
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]

    print(f"[Semantic Match] Best match: '{df_faq.iloc[best_idx]['question']}' with score: {best_score:.4f}")

    if best_score >= threshold:
        return df_faq.iloc[best_idx]["answer"]
    
    return None
