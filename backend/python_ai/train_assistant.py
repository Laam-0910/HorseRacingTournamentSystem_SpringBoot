import os
import json
import pyodbc
import pandas as pd

# ── CẤU HÌNH DATABASE ────────────────────────────────────────────────────────
CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=HorseRacingDB;"
    "UID=sa;PWD=12345"
)

def get_db_connection():
    return pyodbc.connect(CONN_STR)

# ── BƯỚC 1: TRÍCH XUẤT DỮ LIỆU TỰ ĐỘNG TỪ DATABASE ĐỂ LÀM TẬP HỌC (DATASET) ────
def export_dataset_to_jsonl(output_path="dataset.jsonl"):
    print("[Dataset Creator] Đang kết nối Database và trích xuất dữ liệu học...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    dataset = []

    # 1. Trích xuất dữ liệu Ngựa (Horse)
    cursor.execute("""
        SELECT h.name, h.breed, h.current_rating, h.total_races, h.total_wins, h.status, u.username
        FROM Horse h
        LEFT JOIN [User] u ON h.owner_id = u.id
    """)
    for r in cursor.fetchall():
        name, breed, rating, races, wins, status, owner = r
        win_rate = (wins / races * 100) if races > 0 else 0
        prompt = f"Thông tin chi tiết về chiến mã {name} là gì?"
        response = (
            f"Chiến mã {name} thuộc giống {breed}, sở hữu điểm rating hiện tại là {rating}. "
            f"Trong lịch sử thi đấu, ngựa đã tham gia {races} trận và giành được {wins} chiến thắng "
            f"(đạt tỷ lệ thắng là {win_rate:.1f}%). Hiện tại ngựa đang ở trạng thái {status} và thuộc sở hữu của chủ ngựa {owner}."
        )
        dataset.append({"instruction": prompt, "input": "", "output": response})

    # 2. Trích xuất dữ liệu Nài Ngựa (Jockey)
    cursor.execute("""
        SELECT username, weight, total_races_participated, total_top3_finishes, status
        FROM [User]
        WHERE role_id = 3
    """)
    for r in cursor.fetchall():
        username, weight, races, top3, status = r
        top3_rate = (top3 / races * 100) if races > 0 else 0
        prompt = f"Thông tin phong độ của nài ngựa {username} ra sao?"
        response = (
            f"Nài ngựa {username} có cân nặng thi đấu là {weight}kg. Trong sự nghiệp của mình, "
            f"nài đã tham gia {races} lượt đua và xuất sắc cán đích trong Top 3 là {top3} lần "
            f"(tương đương tỷ lệ lọt Top 3 là {top3_rate:.1f}%). Trạng thái hoạt động hiện tại: {status}."
        )
        dataset.append({"instruction": prompt, "input": "", "output": response})

    # 3. Trích xuất dữ liệu Trận Đấu sắp diễn ra (Races)
    cursor.execute("""
        SELECT r.id, r.class_level, r.distance_meters, r.track_type, r.status, r.start_time, rm.name
        FROM Race r
        LEFT JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
    """)
    for r in cursor.fetchall():
        race_id, class_level, distance, track, status, start_time, meeting_name = r
        prompt = f"Thông tin về trận đấu số {race_id} như thế nào?"
        response = (
            f"Trận đấu số {race_id} thuộc hội đua '{meeting_name}'. Trận đấu được phân cấp hạng {class_level}, "
            f"cự ly chạy là {distance} mét trên bề mặt đường đua {track}. Trạng thái hiện tại của trận đấu là {status} "
            f"và thời gian bắt đầu dự kiến vào lúc {start_time}."
        )
        dataset.append({"instruction": prompt, "input": "", "output": response})

    conn.close()

    # Lưu dữ liệu thành định dạng JSONL chuyên dụng để nạp vào mô hình AI train
    with open(output_path, "w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
            
    print(f"[Dataset Creator] Đã lưu {len(dataset)} mẫu câu hỏi - trả lời vào file: {output_path}")

# ── BƯỚC 2: KỊCH BẢN HUẤN LUYỆN MODEL MÃ NGUỒN MỞ (FINE-TUNING CODE) ──────────
# Đoạn code dưới đây sử dụng Unsloth - công cụ train Llama/Qwen nhanh nhất hiện tại trên GPU.
TRAIN_SCRIPT_TEMPLATE = """
import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Cấu hình Model nền móng (Base Model)
max_seq_length = 2048 # Độ dài ngữ cảnh tối đa
dtype = None # Tự động phát hiện GPU (Float16 hoặc Bfloat16)
load_in_4bit = True # Load model dưới dạng 4-bit để tiết kiệm VRAM GPU (chỉ cần ~6GB VRAM)

# Tải model Qwen-2.5 (1.5B hoặc 7B) tối ưu cho tiếng Việt
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-1.5B-Instruct", # Có thể nâng cấp lên Qwen2.5-7B-Instruct nếu GPU mạnh
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Cấu hình LoRA (Tinh chỉnh tham số hiệu quả)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank của LoRA
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 3. Chuẩn bị định dạng Prompt huấn luyện
prompt_format = \"\"\"Hãy trả lời câu hỏi dưới đây một cách chính xác dựa trên luật đấu và dữ liệu thật của giải đua ngựa HKJC.

### Câu hỏi:
{}

### Trả lời:
{}\"\"\"

def format_prompts(batch):
    instructions = batch["instruction"]
    outputs      = batch["output"]
    texts = []
    for instruction, output in zip(instructions, outputs):
        text = prompt_format.format(instruction, output)
        texts.append(text)
    return { "text" : texts }

# Nạp file dữ liệu đã xuất từ Database vào bộ train
dataset = load_dataset("json", data_files="dataset.jsonl", split="train")
dataset = dataset.map(format_prompts, batched = True)

# 4. Cấu hình Tham số huấn luyện (Hyperparameters)
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Tăng lên 200-500 bước nếu muốn AI học sâu sắc hơn
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# Tiến hành huấn luyện
print("[Train] Bắt đầu quá trình huấn luyện AI...")
trainer_stats = trainer.train()

# 5. Lưu và xuất mô hình đã train (Lưu dưới dạng GGUF để chạy cực nhẹ trên máy)
print("[Train] Hoàn thành! Đang xuất mô hình ra định dạng GGUF...")
model.save_pretrained_gguf("hkjc_ai_model", tokenizer, quantization_method = "q4_k_m")
print("[Train] Đã lưu mô hình thành công tại thư mục 'hkjc_ai_model'!")
"""

if __name__ == "__main__":
    # Bước 1: Xuất dữ liệu thật từ DB ra file dataset.jsonl
    export_dataset_to_jsonl()
    
    # Bước 2: Tạo file script train_model.py
    with open("train_model.py", "w", encoding="utf-8") as f:
        f.write(TRAIN_SCRIPT_TEMPLATE)
        
    print("\n=======================================================")
    print("👉 ĐÃ THIẾT LẬP XONG BỘ KHUNG HUẤN LUYỆN!")
    print("1. File dữ liệu học đã tạo: 'dataset.jsonl'")
    print("2. File script huấn luyện đã tạo: 'train_model.py'")
    print("\n👉 Hướng dẫn chạy train trên máy của bạn:")
    print("Bấm chạy lệnh dưới đây để cài đặt thư viện và kích hoạt huấn luyện:")
    print("  pip install unsloth trl transformers datasets accelerate")
    print("  python train_model.py")
    print("=======================================================")
