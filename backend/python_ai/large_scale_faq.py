import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import IncrementalPCA
from sklearn.linear_model import Ridge
import os

# ── HỆ THỐNG GIẢI QUYẾT 1 TRIỆU CÂU HỎI BẰNG HỒI QUY (RIDGE REGRESSION) + PCA ──
class LargeScaleFAQEngine:
    """
    Hệ thống FAQ quy mô 1.000.000 câu hỏi.
    Sử dụng:
    1. Incremental PCA để nén chiều đặc trưng ngữ nghĩa.
    2. Hồi quy Ridge Regression để học ánh xạ (Projection) từ TF-IDF thưa sang tọa độ PCA liên tục.
    3. Phép nhân ma trận Tích vô hướng (Dot Product) trên RAM tìm câu trả lời tương đồng.
    """
    def __init__(self, n_components=5, batch_size=20000):
        self.n_components = n_components
        self.batch_size = batch_size
        
        # Công cụ trích xuất đặc trưng văn bản thưa
        self.vectorizer = TfidfVectorizer(max_features=5000, lowercase=True)
        self.ipca = IncrementalPCA(n_components=n_components)
        
        # Mảng chứa bộ hồi quy Ridge cho từng chiều của không gian PCA
        self.regressors = [Ridge(alpha=1.0) for _ in range(n_components)]
        
        # Index lưu trữ vector ngữ nghĩa chuẩn hóa của 1 triệu câu hỏi
        self.faq_matrix = None       # Matrix [1,000,000, n_components]
        self.faq_metadata = []       # Danh sách câu trả lời tương ứng

    def generate_synthetic_faq_for_scaling(self):
        """
        Tạo giả lập 1.000.000 câu hỏi HKJC dựa trên các mẫu quy tắc Class, Weight, Jockey, Horse.
        Giúp hệ thống có sẵn 1 triệu câu hỏi để chứng minh khả năng tính toán quy mô lớn.
        """
        print("[FAQ Engine] Đang sinh giả lập 1.000.000 câu hỏi hội đua...")
        
        templates = [
            ("quy định phân hạng class {} là gì", "Trận đấu Class {} yêu cầu ngựa có điểm rating từ {} đến {}."),
            ("ngựa rating {} đá giải nào", "Ngựa có điểm rating {} phù hợp thi đấu ở phân hạng Class {}."),
            ("cân nặng của nài ngựa {} kg mang tạ {}", "Nài ngựa nặng {}kg cần mang thêm tạ gánh để đạt mức handicap {}kg."),
            ("nài ngựa thắng {} trận có tỷ lệ top 3 là {}", "Nài ngựa đạt {} trận thắng với tỷ lệ lọt Top 3 là {}%."),
            ("ngựa {} thuộc giống {} có rating {}", "Chiến mã {} giống {} đang sở hữu mức rating phong độ {}."),
            ("trận đấu khoảng cách {} mét ở sân {}", "Trận đấu cự ly {}m được tổ chức tại đường chạy sân {}.")
        ]
        
        faq_data = []
        
        # Sinh tổ hợp để tạo ra chính xác 1.000.000 bản ghi
        horses = ["Golden Flash", "Thunder King", "Shadow Fax", "Pegasus", "Silver", "Wind Run", "Storm", "Night Rider"]
        breeds = ["Turf King", "Sand Storm", "Thoroughbred", "Arabian", "Quarter"]
        venues = ["Sha Tin", "Happy Valley", "Conghua"]
        
        count = 0
        while count < 1000000:
            # Lựa chọn ngẫu nhiên mẫu template
            t_idx = count % len(templates)
            tpl_q, tpl_a = templates[t_idx]
            
            if t_idx == 0:
                c = (count % 5) + 1
                min_r = 100 - c * 20
                max_r = 120 - c * 20
                q = tpl_q.format(c)
                a = tpl_a.format(c, min_r, max_r)
            elif t_idx == 1:
                r = (count % 120) + 10
                c = 5 - (r // 25)
                c = max(1, min(5, c))
                q = tpl_q.format(r)
                a = tpl_a.format(r, c)
            elif t_idx == 2:
                w_j = 50 + (count % 15)
                w_h = w_j + (count % 10)
                q = tpl_q.format(w_j, w_h)
                a = tpl_a.format(w_j, w_h)
            elif t_idx == 3:
                wins = count % 100
                rate = 20 + (count % 60)
                q = tpl_q.format(wins, rate)
                a = tpl_a.format(wins, rate)
            elif t_idx == 4:
                h = horses[count % len(horses)] + str(count)
                b = breeds[count % len(breeds)]
                r = 40 + (count % 70)
                q = tpl_q.format(h, b, r)
                a = tpl_a.format(h, b, r)
            else:
                dist = 1000 + (count % 12) * 100
                v = venues[count % len(venues)]
                q = tpl_q.format(dist, v)
                a = tpl_a.format(dist, v)
                
            faq_data.append({"q": q, "a": a})
            count += 1
            
        return pd.DataFrame(faq_data)

    def train_and_index(self):
        """
        Huấn luyện mô hình quy mô lớn:
        1. Fit TF-IDF trên 1 triệu câu hỏi bằng Generator.
        2. Fit Incremental PCA theo từng khối (mini-batch).
        3. Huấn luyện hệ thống HỒI QUY RIDGE để học cách chiếu từ văn bản thưa sang không gian PCA.
        4. Tạo ma trận Index 1 triệu vector trên RAM.
        """
        df = self.generate_synthetic_faq_for_scaling()
        
        print("[FAQ Engine] Trích xuất đặc trưng văn bản TF-IDF...")
        # Fit TF-IDF Vectorizer
        self.vectorizer.fit(df["q"])
        
        print("[FAQ Engine] Huấn luyện Incremental PCA từng phần...")
        # Huấn luyện Incremental PCA theo từng đợt để tránh tốn RAM
        for i in range(0, len(df), self.batch_size):
            chunk = df["q"].iloc[i: i + self.batch_size]
            vectors = self.vectorizer.transform(chunk).toarray()
            if len(vectors) >= self.n_components:
                self.ipca.partial_fit(vectors)
                
        print("[FAQ Engine] Áp dụng hồi quy đặc trưng ngữ nghĩa (Ridge Regression)...")
        # Huấn luyện mô hình hồi quy Ridge để ánh xạ tọa độ đặc trưng ngữ nghĩa
        # X: TF-IDF vector, Y: PCA coordinates
        # Ta huấn luyện từng bộ hồi quy cho mỗi chiều PCA (n_components)
        X_all = self.vectorizer.transform(df["q"])
        
        # Gom Y (tọa độ PCA) theo từng khối để huấn luyện hồi quy
        pca_coords_list = []
        for i in range(0, len(df), self.batch_size):
            chunk = df["q"].iloc[i: i + self.batch_size]
            vectors = self.vectorizer.transform(chunk).toarray()
            pca_coords_list.append(self.ipca.transform(vectors))
            
        Y_all = np.vstack(pca_coords_list)
        
        # Huấn luyện hồi quy cho từng chiều độc lập
        for d in range(self.n_components):
            self.regressors[d].fit(X_all, Y_all[:, d])
            
        # Lưu trữ ma trận vector chuẩn hóa của 1.000.000 câu hỏi lên RAM
        self.faq_matrix = Y_all
        norms = np.linalg.norm(self.faq_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.faq_matrix = self.faq_matrix / norms
        self.faq_metadata = df["a"].tolist()
        
        print(f"[FAQ Engine] Đã lập chỉ mục thành công {len(self.faq_metadata)} câu hỏi bằng Hồi quy + PCA.")

    def ask(self, user_question: str, threshold: float = 0.30) -> str:
        """
        Tìm kiếm câu hỏi tương đồng ngữ nghĩa bằng cách:
        1. Biến đổi câu hỏi người dùng thành TF-IDF.
        2. Dùng Hồi quy Ridge dự đoán tọa độ PCA ngữ nghĩa thích hợp.
        3. Nhân Tích vô hướng ma trận tối ưu trên 1 triệu vector.
        """
        if self.faq_matrix is None:
            self.train_and_index()
            
        # 1. Chuyển câu hỏi sang vector thưa
        user_tfidf = self.vectorizer.transform([user_question])
        if user_tfidf.nnz == 0:
            return None
        
        # 2. Sử dụng bộ Hồi quy để dự đoán tọa độ PCA ngữ nghĩa liên tục
        user_projected_pca = np.zeros(self.n_components)
        for d in range(self.n_components):
            user_projected_pca[d] = self.regressors[d].predict(user_tfidf)[0]
            
        # Chuẩn hóa vector dự đoán của user
        user_norm = np.linalg.norm(user_projected_pca)
        if user_norm == 0:
            return None
        user_projected_pca = user_projected_pca / user_norm

        # 3. Phép nhân ma trận Tích vô hướng (Dot Product)
        # NumPy thực hiện phép nhân 1.000.000 dòng cực kỳ tối ưu
        similarities = np.dot(self.faq_matrix, user_projected_pca)
        
        # Tìm câu hỏi tương đồng nhất
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        
        print(f"[LargeScale FAQ] Best similarity score: {best_score:.4f}")
        
        if best_score >= threshold:
            return self.faq_metadata[best_idx]
            
        return None

# Khởi tạo đối tượng toàn cục
faq_engine = LargeScaleFAQEngine()
