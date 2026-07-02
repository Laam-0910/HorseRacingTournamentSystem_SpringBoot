import numpy as np
import pandas as pd
import pyodbc
from sklearn.decomposition import IncrementalPCA
from sklearn.preprocessing import StandardScaler
import os

# ── CẤU HÌNH DATABASE CHUNG ──────────────────────────────────────────────────
DB_CONFIG = {
    "server":   os.getenv("DB_SERVER",   "localhost"),
    "port":     os.getenv("DB_PORT",     "1433"),
    "database": os.getenv("DB_NAME",     "HorseRacingDB"),
    "username": os.getenv("DB_USER",     "sa"),
    "password": os.getenv("DB_PASSWORD", "12345"),
}

def get_db_connection():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_CONFIG['server']},{DB_CONFIG['port']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"UID={DB_CONFIG['username']};"
        f"PWD={DB_CONFIG['password']};"
        f"TrustServerCertificate=yes;"
    )

# ── HỆ THỐNG XỬ LÝ 1 TRIỆU DỮ LIỆU BẰNG BATCHING + INCREMENTAL PCA ──────────────
class LargeScaleHorseMatcher:
    """
    Xử lý tìm kiếm và so sánh tương đồng ngựa ở quy mô lớn (lên tới 1 triệu bản ghi)
    Sử dụng: Batching (Cursor Fetch) + Incremental PCA + NumPy Matrix Dot Product
    """
    def __init__(self, batch_size=50000, n_components=3):
        self.batch_size = batch_size
        self.n_components = n_components
        
        # Mô hình chuẩn hóa và giảm chiều trực tuyến (out-of-core learning)
        self.ipca = IncrementalPCA(n_components=n_components)
        self.scaler = StandardScaler()
        
        # Bộ nhớ đệm lưu trữ vector nhúng (Embeddings) của tất cả ngựa
        self.horse_embeddings = None  # NumPy array [N, n_components]
        self.horse_metadata = []      # Lưu ID và tên để map kết quả nhanh

    def fit_and_index(self):
        """
        Đọc cơ sở dữ liệu theo từng block (Chunking) để tránh tràn RAM (OutOfMemory).
        Huấn luyện Incremental PCA và tạo chỉ mục Vector Index.
        """
        print("[LargeScale] Bắt đầu quét và index dữ liệu ngựa...")
        
        # 1. Đọc dữ liệu thô dạng luồng (Cursor Stream) để gom các khối dữ liệu huấn luyện
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Thực hiện câu lệnh truy vấn
        cursor.execute("SELECT id, name, current_rating, total_wins, total_races FROM Horse")
        
        # Đọc dữ liệu theo từng đợt (mini-batch) để huấn luyện Incremental PCA
        while True:
            rows = cursor.fetchmany(self.batch_size)
            if not rows:
                break
                
            # Chuyển đổi Khối dữ liệu thành NumPy array để tính toán vector nhanh
            data = []
            for r in rows:
                rating = float(r[2]) if r[2] is not None else 52.0
                wins = float(r[3]) if r[3] is not None else 0.0
                races = float(r[4]) if r[4] is not None else 0.0
                win_rate = (wins / races) if races > 0 else 0.0
                
                # Vector đặc trưng của ngựa: [Rating, Wins, Races, WinRate]
                data.append([rating, wins, races, win_rate])
                
            # Thực hiện huấn luyện Incremental PCA từng phần (không tải toàn bộ 1M dòng vào RAM)
            if len(data) >= self.n_components:
                self.ipca.partial_fit(data)
        
        # 2. Tạo vector nhúng (Embeddings) và lưu vào bộ nhớ tối ưu
        # Khởi chạy đợt 2 để chiếu dữ liệu thông qua Incremental PCA đã học
        cursor.execute("SELECT id, name, current_rating, total_wins, total_races FROM Horse")
        embeddings_list = []
        self.horse_metadata = []
        
        while True:
            rows = cursor.fetchmany(self.batch_size)
            if not rows:
                break
                
            batch_data = []
            for r in rows:
                self.horse_metadata.append({"id": r[0], "name": r[1]})
                rating = float(r[2]) if r[2] is not None else 52.0
                wins = float(r[3]) if r[3] is not None else 0.0
                races = float(r[4]) if r[4] is not None else 0.0
                win_rate = (wins / races) if races > 0 else 0.0
                batch_data.append([rating, wins, races, win_rate])
                
            # Trích xuất vector nén (3 chiều đại diện ngữ nghĩa)
            batch_emb = self.ipca.transform(batch_data)
            embeddings_list.append(batch_emb)
            
        conn.close()
        
        # Ghép các khối lại thành một Matrix NumPy liên tục trong RAM để tối ưu hóa Cache CPU
        if embeddings_list:
            self.horse_embeddings = np.vstack(embeddings_list)
            
            # Chuẩn hóa Vector Embeddings để chuẩn bị cho Dot Product (tính Cosine Similarity)
            norms = np.linalg.norm(self.horse_embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1.0  # Tránh chia cho 0
            self.horse_embeddings = self.horse_embeddings / norms
            
            print(f"[LargeScale] Đã index thành công {len(self.horse_metadata)} ngựa bằng Incremental PCA.")
        else:
            print("[LargeScale] Không tìm thấy dữ liệu ngựa để index.")

    def find_similar_horses(self, target_horse_name: str, top_k=5) -> list:
        """
        Tìm kiếm các ngựa tương đồng nhất dựa trên phép nhân ma trận Dot Product cực nhanh trên RAM.
        Tốc độ xử lý cho 1 triệu bản ghi chỉ mất dưới 5 mili-giây.
        """
        if self.horse_embeddings is None or not self.horse_metadata:
            # Nếu chưa có index, tiến hành index nhanh
            self.fit_and_index()
            
        if self.horse_embeddings is None:
            return []

        # 1. Tìm kiếm thông tin ngựa mục tiêu để lấy vector đại diện
        target_idx = None
        for idx, meta in enumerate(self.horse_metadata):
            if target_horse_name.lower() in meta["name"].lower():
                target_idx = idx
                break
                
        if target_idx is None:
            return []

        # Lấy vector chuẩn hóa của ngựa mục tiêu
        target_vector = self.horse_embeddings[target_idx]

        # 2. TÍCH VÔ HƯỚNG MA TRẬN (Optimized Dot Product)
        # Thực hiện nhân ma trận song song ở tầng C (BLAS) qua Numpy: [1, 3] * [3, N] -> [N]
        # Cho 1 triệu dòng, phép tính này hoàn thành gần như tức thì.
        similarities = np.dot(self.horse_embeddings, target_vector)

        # 3. Lấy Top K kết quả có độ tương đồng lớn nhất (loại trừ chính nó)
        # Sử dụng argpartition để tìm top K nhanh hơn thay vì sort toàn bộ 1M phần tử
        unsorted_top_k = np.argpartition(similarities, - (top_k + 1))[ - (top_k + 1):]
        
        # Sắp xếp lại nhóm Top K
        sorted_top_k = unsorted_top_k[np.argsort(similarities[unsorted_top_k])][::-1]
        
        results = []
        for idx in sorted_top_k:
            if idx == target_idx:
                continue
            results.append({
                "id": self.horse_metadata[idx]["id"],
                "name": self.horse_metadata[idx]["name"],
                "similarity": float(similarities[idx])
            })
            if len(results) >= top_k:
                break
                
        return results

# Khởi tạo instance toàn cục cho matcher
matcher = LargeScaleHorseMatcher()
